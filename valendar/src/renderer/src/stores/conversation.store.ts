import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { ConversationMessage, ConversationSession, CRUDOperation } from '../types/conversation'
import type { EventCategory } from '../types'
import { createLogger } from '../utils/logger'
import { webmToWav } from '../utils/audio-utils'
import { onlineASR } from '../services/asr/online-asr'
import { nluManager } from '../services/nlu/nlu-manager'
import { useEventStore } from './event.store'

const log = createLogger('ConversationStore')

export const useConversationStore = defineStore('conversation', () => {
  const sessions = ref<ConversationSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const isListening = ref(false)
  const isProcessing = ref(false)
  const transcribedText = ref('')
  const speechError = ref('')
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const crudCountdownTimer = ref<ReturnType<typeof setInterval> | null>(null)
  const inputCountdown = ref(0)
  const inputCountdownTimer = ref<ReturnType<typeof setInterval> | null>(null)
  const crudCountdownSeconds = ref(3)

  let audioStream: MediaStream | null = null
  let recorderChunks: Blob[] = []

  const currentSession = computed(() => {
    return sessions.value.find((s) => s.id === currentSessionId.value) || null
  })

  function setCountdownSeconds(seconds: number): void {
    crudCountdownSeconds.value = seconds
  }

  function getOrCreateSession(): ConversationSession {
    if (!currentSessionId.value) {
      const session: ConversationSession = {
        id: uuidv4(),
        messages: [],
        crudOperations: [],
        status: 'listening',
        countdownSeconds: crudCountdownSeconds.value,
        createdAt: new Date().toISOString()
      }
      sessions.value.push(session)
      currentSessionId.value = session.id
    }
    return currentSession.value!
  }

  function addMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): void {
    const session = getOrCreateSession()
    session.messages.push({
      id: uuidv4(),
      ...message,
      timestamp: new Date().toISOString()
    })
  }

  function setCRUDOperations(operations: CRUDOperation[]): void {
    const session = getOrCreateSession()
    session.crudOperations = operations
  }

  // --- Voice Recording ---

  async function startListening(): Promise<void> {
    speechError.value = ''
    transcribedText.value = ''
    stopInputCountdown()

    const onlineReady = await onlineASR.isAvailable()
    if (!onlineReady) {
      speechError.value = '语音识别不可用。请到 设置 → 语音识别 → 填写智谱 API Key'
      return
    }

    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
        }
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error('getUserMedia failed:', msg)
      speechError.value = `无法访问麦克风：${msg}`
      return
    }

    try {
      recorderChunks = []
      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4']
      let mimeType = ''
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) {
          mimeType = mt
          break
        }
      }

      if (!mimeType) {
        speechError.value = '当前浏览器不支持音频录制'
        audioStream.getTracks().forEach((t) => t.stop())
        audioStream = null
        return
      }

      const recorder = new MediaRecorder(audioStream, { mimeType, audioBitsPerSecond: 16000 })
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) recorderChunks.push(e.data)
      }
      recorder.onstop = async () => {
        audioStream?.getTracks().forEach((t) => t.stop())
        audioStream = null
        const blob = new Blob(recorderChunks, { type: recorder.mimeType })
        recorderChunks = []
        await processRecording(blob)
      }
      recorder.start()
      mediaRecorder.value = recorder
      isListening.value = true
      getOrCreateSession().status = 'listening'
      log.info('MediaRecorder started, mimeType:', mimeType)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error('MediaRecorder start failed:', msg)
      speechError.value = `录音启动失败：${msg}`
      audioStream?.getTracks().forEach((t) => t.stop())
      audioStream = null
    }
  }

  async function stopListening(): Promise<void> {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
      mediaRecorder.value = null
    }
    isListening.value = false
  }

  async function processRecording(audioBlob: Blob): Promise<void> {
    isProcessing.value = true
    try {
      log.info('Converting audio to WAV, blob size:', audioBlob.size)
      const wavBlob = await webmToWav(audioBlob)
      const result = await onlineASR.transcribe(wavBlob)

      if (!result.text) {
        log.warn('Online ASR returned empty text')
        speechError.value = '未检测到有效语音输入，请靠近麦克风后重试'
        return
      }

      transcribedText.value = result.text
      log.info('Transcription result:', result.text)

      // Start input countdown (auto-send after N seconds)
      startInputCountdown()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error('ASR error:', msg)
      speechError.value = msg
    } finally {
      isProcessing.value = false
    }
  }

  // --- Input Countdown (auto-send transcribed text) ---

  function startInputCountdown(seconds?: number): void {
    stopInputCountdown()
    const s = seconds || crudCountdownSeconds.value
    inputCountdown.value = s

    inputCountdownTimer.value = setInterval(() => {
      inputCountdown.value--
      if (inputCountdown.value <= 0) {
        stopInputCountdown()
        const text = transcribedText.value.trim()
        if (text) {
          transcribedText.value = ''
          processTextInput(text)
        }
      }
    }, 1000)
  }

  function stopInputCountdown(): void {
    if (inputCountdownTimer.value) {
      clearInterval(inputCountdownTimer.value)
      inputCountdownTimer.value = null
    }
    inputCountdown.value = 0
  }

  // --- Text Processing ---

  async function processTextInput(text: string): Promise<void> {
    stopInputCountdown()
    const trimmed = text.trim()
    if (!trimmed) return

    isProcessing.value = true
    const session = getOrCreateSession()
    session.status = 'processing'

    try {
      addMessage({ role: 'user', content: trimmed, source: 'text' })

      const result = await nluManager.parse(trimmed, 'nlu')
      setCRUDOperations(result.operations)

      if (result.operations.length === 0) {
        session.status = 'completed'
        speechError.value = '未能解析出可执行操作，请尝试更明确的指令，如"明天下午3点开会"'
      } else {
        session.status = 'waiting-decision'
        startCRUDCountdown()
      }
    } catch (err) {
      log.error('NLU error:', err)
      session.status = 'completed'
      speechError.value = `处理失败：${err instanceof Error ? err.message : String(err)}`
    } finally {
      isProcessing.value = false
    }
  }

  // --- CRUD Countdown (auto-execute operations) ---

  function startCRUDCountdown(): void {
    const session = getOrCreateSession()
    stopCRUDCountdown()
    session.countdownSeconds = crudCountdownSeconds.value

    crudCountdownTimer.value = setInterval(() => {
      if (!currentSession.value) {
        stopCRUDCountdown()
        return
      }
      currentSession.value.countdownSeconds--
      if (currentSession.value.countdownSeconds <= 0) {
        stopCRUDCountdown()
        autoExecuteCRUD()
      }
    }, 1000)
  }

  function stopCRUDCountdown(): void {
    if (crudCountdownTimer.value) {
      clearInterval(crudCountdownTimer.value)
      crudCountdownTimer.value = null
    }
  }

  function autoExecuteCRUD(): void {
    const session = currentSession.value
    if (!session || session.crudOperations.length === 0) return
    const bestOp = session.crudOperations.reduce((a, b) => (a.confidence > b.confidence ? a : b))
    executeCRUD(bestOp.id)
  }

  async function executeCRUD(operationId: string): Promise<void> {
    const session = currentSession.value
    if (!session) return

    session.status = 'executing'
    stopCRUDCountdown()

    const op = session.crudOperations.find((o) => o.id === operationId)
    if (!op) return

    log.info('Executing CRUD:', op.type, op.event.title)

    try {
      const eventStore = useEventStore()

      switch (op.type) {
        case 'create': {
          await eventStore.createEvent({
            title: op.event.title,
            description: op.event.description,
            startDate: op.event.startDate,
            endDate: op.event.endDate,
            startTime: op.event.startTime,
            endTime: op.event.endTime,
            isAllDay: op.event.isAllDay,
            category: (op.event.category || 'personal') as EventCategory,
            location: op.event.location
          })
          break
        }
        case 'update': {
          const found = await eventStore.searchEvents(op.event.title)
          if (found.length > 0) {
            await eventStore.updateEvent(found[0].id, {
              title: op.event.title,
              description: op.event.description,
              startDate: op.event.startDate,
              endDate: op.event.endDate,
              startTime: op.event.startTime,
              endTime: op.event.endTime,
              isAllDay: op.event.isAllDay,
              category: (op.event.category || found[0].category) as EventCategory,
              location: op.event.location
            })
          }
          break
        }
        case 'delete': {
          const found = await eventStore.searchEvents(op.event.title)
          if (found.length > 0) {
            await eventStore.deleteEvent(found[0].id)
          }
          break
        }
      }
      await eventStore.fetchEvents()
      session.status = 'completed'
      log.info('CRUD executed successfully:', op.type, op.event.title)
    } catch (err) {
      log.error('CRUD execution failed:', err)
      session.status = 'completed'
      speechError.value = `执行失败：${err instanceof Error ? err.message : String(err)}`
    }
  }

  function abandonCRUD(): void {
    const session = currentSession.value
    if (!session) return
    session.status = 'abandoned'
    stopCRUDCountdown()
  }

  function newSession(): void {
    stopCRUDCountdown()
    stopInputCountdown()
    currentSessionId.value = null
    isListening.value = false
    isProcessing.value = false
    transcribedText.value = ''
    speechError.value = ''
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    isListening,
    isProcessing,
    transcribedText,
    speechError,
    inputCountdown,
    crudCountdownSeconds,
    setCountdownSeconds,
    startListening,
    stopListening,
    processTextInput,
    startInputCountdown,
    stopInputCountdown,
    executeCRUD,
    autoExecuteCRUD,
    abandonCRUD,
    newSession,
    stopCRUDCountdown,
    addMessage
  }
})
