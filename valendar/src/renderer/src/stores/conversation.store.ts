import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { ConversationMessage, ConversationSession, CRUDOperation } from '../types/conversation'
import type { EventCategory } from '../types'
import type { NLUContext } from '../services/nlu/nlu.interface'
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
  const isLoadingHistory = ref(false)
  const autoSaveTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  let audioStream: MediaStream | null = null
  let recorderChunks: Blob[] = []

  const currentSession = computed(() => {
    return sessions.value.find((s) => s.id === currentSessionId.value) || null
  })

  const currentMessages = computed(() => {
    return currentSession.value?.messages || []
  })

  const currentOperations = computed(() => {
    return currentSession.value?.crudOperations || []
  })

  // --- Persistence Methods ---

  async function loadConversationHistory(): Promise<void> {
    try {
      isLoadingHistory.value = true
      if (window.api?.conversation?.getAllSessions) {
        const savedSessions = await window.api.conversation.getAllSessions()
        sessions.value = savedSessions
        if (savedSessions.length > 0) {
          const lastSession = savedSessions[savedSessions.length - 1]
          if (lastSession.status === 'listening' || lastSession.status === 'waiting-decision') {
            currentSessionId.value = lastSession.id
          }
        }
      }
    } catch (error) {
      log.error('Error loading conversation history:', error)
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function saveCurrentSession(): Promise<void> {
    if (!currentSessionId.value || !currentSession.value) return
    try {
      if (window.api?.conversation?.saveSession) {
        const plainSession = JSON.parse(JSON.stringify(currentSession.value))
        await window.api.conversation.saveSession(plainSession)
      }
    } catch (error) {
      log.error('Error saving conversation session:', error)
    }
  }

  function debouncedSave(): void {
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
    }
    autoSaveTimer.value = setTimeout(() => {
      saveCurrentSession()
    }, 500)
  }

  // Watch for changes to auto-save
  watch(
    () => currentSession.value,
    () => {
      if (currentSession.value) {
        debouncedSave()
      }
    },
    { deep: true }
  )

  // --- Session Management ---

  function getOrCreateSession(): ConversationSession {
    if (!currentSessionId.value) {
      const now = new Date().toISOString()
      const session: ConversationSession = {
        id: uuidv4(),
        messages: [],
        crudOperations: [],
        status: 'listening',
        countdownSeconds: crudCountdownSeconds.value,
        createdAt: now,
        updatedAt: now
      }
      sessions.value.push(session)
      currentSessionId.value = session.id
    }
    return currentSession.value!
  }

  function addMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): ConversationMessage {
    const session = getOrCreateSession()
    const fullMessage: ConversationMessage = {
      id: uuidv4(),
      ...message,
      timestamp: new Date().toISOString()
    }
    session.messages.push(fullMessage)
    return fullMessage
  }

  function addResultMessage(content: string, operations: CRUDOperation[]): ConversationMessage {
    return addMessage({
      role: 'assistant',
      type: 'result',
      content,
      source: 'nlu',
      crudOperations: operations
    })
  }

  function addErrorMessage(content: string): ConversationMessage {
    return addMessage({
      role: 'assistant',
      type: 'error',
      content,
      source: 'system'
    })
  }

  function addCompletedMessage(content: string): ConversationMessage {
    return addMessage({
      role: 'assistant',
      type: 'completed',
      content,
      source: 'system'
    })
  }

  function addAbandonedMessage(content: string = '已放弃操作'): ConversationMessage {
    return addMessage({
      role: 'assistant',
      type: 'abandoned',
      content,
      source: 'system'
    })
  }

  function setCRUDOperations(operations: CRUDOperation[]): void {
    const session = getOrCreateSession()
    session.crudOperations = operations
  }

  function setCountdownSeconds(seconds: number): void {
    crudCountdownSeconds.value = seconds
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
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
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
        await processRecording(new Blob(recorderChunks, { type: recorder.mimeType }))
      }
      recorder.start()
      mediaRecorder.value = recorder
      isListening.value = true
      getOrCreateSession().status = 'listening'
      log.info('MediaRecorder started, mimeType:', mimeType)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
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

      startInputCountdown()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
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
      addMessage({
        role: 'user',
        type: 'text',
        content: trimmed,
        source: 'text'
      })

      const eventStore = useEventStore()
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      
      const upcomingEvents = eventStore.events
        .filter(e => e.startDate >= today)
        .sort((a, b) => {
          if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate)
          return (a.startTime || '').localeCompare(b.startTime || '')
        })
        .slice(0, 100)

      const allOperations: CRUDOperation[] = []
      sessions.value.forEach(s => {
        allOperations.push(...s.crudOperations)
      })
      const recentOperations = allOperations
        .sort((a, b) => (a.id > b.id ? -1 : 1))
        .slice(0, 10)

      const recentMessages = session.messages.slice(-10)

      const context: NLUContext = {
        recentMessages,
        recentOperations,
        upcomingEvents,
        currentTime: now.toISOString()
      }

      const result = await nluManager.parse(trimmed, 'nlu', context)
      setCRUDOperations(result.operations)

      if (result.operations.length === 0) {
        session.status = 'completed'
        addErrorMessage('未能解析出可执行操作，请尝试更明确的指令，如"明天下午3点开会"')
      } else {
        session.status = 'waiting-decision'
        const operationTypes = result.operations.map(op => op.type === 'create' ? '创建' : op.type === 'delete' ? '删除' : '更新').join('、')
        addResultMessage(
          `我识别到了${result.operations.length}个可执行操作（${operationTypes}），请确认是否执行：`,
          result.operations
        )
        startCRUDCountdown()
      }
    } catch (error) {
      log.error('NLU error:', error)
      session.status = 'completed'
      addErrorMessage(`处理失败：${error instanceof Error ? error.message : String(error)}`)
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

  async function autoExecuteCRUD(): Promise<void> {
    const session = currentSession.value
    if (!session || session.crudOperations.length === 0) return
    
    await executeAllCRUD()
  }

  async function executeAllCRUD(): Promise<void> {
    const session = currentSession.value
    if (!session) return

    session.status = 'executing'
    stopCRUDCountdown()

    const eventStore = useEventStore()
    const results: Array<{ success: boolean; operation: CRUDOperation; error?: string }> = []

    for (const operation of session.crudOperations) {
      try {
        log.info('Executing CRUD:', operation.type, operation.event.title)

        switch (operation.type) {
          case 'create':
            await eventStore.createEvent({
              title: operation.event.title,
              description: operation.event.description,
              startDate: operation.event.startDate,
              endDate: operation.event.endDate,
              startTime: operation.event.startTime,
              endTime: operation.event.endTime,
              isAllDay: operation.event.isAllDay,
              category: (operation.event.category || 'personal') as EventCategory,
              location: operation.event.location
            })
            break
          case 'update':
            const foundEvents = await eventStore.searchEvents(operation.event.title)
            if (foundEvents.length > 0) {
              await eventStore.updateEvent(foundEvents[0].id, {
                title: operation.event.title,
                description: operation.event.description,
                startDate: operation.event.startDate,
                endDate: operation.event.endDate,
                startTime: operation.event.startTime,
                endTime: operation.event.endTime,
                isAllDay: operation.event.isAllDay,
                category: (operation.event.category || foundEvents[0].category) as EventCategory,
                location: operation.event.location
              })
            } else {
              throw new Error('未找到要更新的事件')
            }
            break
          case 'delete':
            const deleteEvents = await eventStore.searchEvents(operation.event.title)
            if (deleteEvents.length > 0) {
              await eventStore.deleteEvent(deleteEvents[0].id)
            } else {
              throw new Error('未找到要删除的事件')
            }
            break
        }

        operation.executed = true
        results.push({ success: true, operation })
      } catch (error) {
        operation.executed = false
        operation.error = error instanceof Error ? error.message : '执行失败'
        results.push({ success: false, operation, error: error instanceof Error ? error.message : '执行失败' })
      }
    }

    await eventStore.fetchEvents()
    session.status = 'completed'

    // Add result message
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    if (failureCount === 0) {
      addCompletedMessage(`成功执行了 ${successCount} 个操作！`)
    } else {
      addErrorMessage(
        `完成了 ${successCount} 个操作，但有 ${failureCount} 个失败`
      )
    }

    log.info('CRUD executed:', successCount, 'success,', failureCount, 'failed')
  }

  async function executeCRUD(operationId: string): Promise<void> {
    const session = currentSession.value
    if (!session) return

    session.status = 'executing'
    stopCRUDCountdown()

    const op = session.crudOperations.find((o) => o.id === operationId)
    if (!op) return

    log.info('Executing single CRUD:', op.type, op.event.title)

    try {
      const eventStore = useEventStore()

      switch (op.type) {
        case 'create':
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
        case 'update':
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
        case 'delete':
          const deleteEvents = await eventStore.searchEvents(op.event.title)
          if (deleteEvents.length > 0) {
            await eventStore.deleteEvent(deleteEvents[0].id)
          }
          break
      }

      op.executed = true
      await eventStore.fetchEvents()
      session.status = 'completed'
      addCompletedMessage('操作成功！')
      log.info('CRUD executed successfully:', op.type, op.event.title)
    } catch (error) {
      log.error('CRUD execution failed:', error)
      op.executed = false
      op.error = error instanceof Error ? error.message : '执行失败'
      session.status = 'completed'
      addErrorMessage(`执行失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  function abandonCRUD(): void {
    const session = currentSession.value
    if (!session) return
    session.status = 'abandoned'
    stopCRUDCountdown()
    addAbandonedMessage()
  }

  function clearTranscribedText(): void {
    transcribedText.value = ''
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

  // --- Initialization ---
  loadConversationHistory()

  return {
    sessions,
    currentSessionId,
    currentSession,
    currentMessages,
    currentOperations,
    isListening,
    isProcessing,
    transcribedText,
    speechError,
    inputCountdown,
    crudCountdownSeconds,
    isLoadingHistory,
    loadConversationHistory,
    saveCurrentSession,
    setCountdownSeconds,
    startListening,
    stopListening,
    processTextInput,
    startInputCountdown,
    stopInputCountdown,
    executeCRUD,
    executeAllCRUD,
    autoExecuteCRUD,
    abandonCRUD,
    clearTranscribedText,
    newSession,
    stopCRUDCountdown,
    addMessage,
    setCRUDOperations
  }
})
