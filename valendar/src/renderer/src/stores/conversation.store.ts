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
import { useSettingsStore } from './settings.store'

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
  const highlightedOps = ref<string[]>([])

  const currentSession = computed(() => {
    return sessions.value.find((s) => s.id === currentSessionId.value) || null
  })

  const supportsImages = computed(() => {
    const settingsStore = useSettingsStore()
    return settingsStore.settings.aiSupportsImage || false
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

  function addSystemMessage(
    content: string,
    status?: ConversationMessage['status'],
    opIds?: string[],
    executedEventId?: string
  ): void {
    addMessage({
      role: 'system',
      content,
      source: 'text',
      status,
      opIds,
      executedEventId
    })
  }

  /** Replace the last thinking message with the actual result */
  function replaceThinkingMessage(
    content: string,
    status?: ConversationMessage['status'],
    opIds?: string[],
    executedEventId?: string
  ): void {
    const session = getOrCreateSession()
    const lastThinkingIdx = [...session.messages].reverse().findIndex(
      (m) => m.role === 'system' && m.status === 'thinking'
    )
    if (lastThinkingIdx >= 0) {
      const realIdx = session.messages.length - 1 - lastThinkingIdx
      session.messages[realIdx] = {
        ...session.messages[realIdx],
        content,
        status,
        opIds,
        executedEventId
      }
    } else {
      addSystemMessage(content, status, opIds, executedEventId)
    }
  }

  function setHighlightedOps(opIds: string[]): void {
    highlightedOps.value = opIds
  }

  function typeLabel(type: string): string {
    const labels: Record<string, string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      query: '查询'
    }
    return labels[type] || type
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
      addSystemMessage('语音识别不可用。请到 设置 → 语音识别 → 填写智谱 API Key', 'error')
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
      addSystemMessage(`无法访问麦克风：${msg}`, 'error')
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
        addSystemMessage('当前浏览器不支持音频录制', 'error')
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
      addSystemMessage(`录音启动失败：${msg}`, 'error')
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
        addSystemMessage('未检测到有效语音输入，请靠近麦克风后重试', 'error')
        return
      }

      transcribedText.value = result.text
      log.info('Transcription result:', result.text)

      // Start input countdown (auto-send after N seconds)
      startInputCountdown()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error('ASR error:', msg)
      addSystemMessage(`语音识别失败：${msg}`, 'error')
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

  function cancelInputCountdown(): void {
    stopInputCountdown()
    transcribedText.value = ''
  }

  // --- Text Processing ---

  async function processTextInput(text: string, images?: string[]): Promise<void> {
    stopInputCountdown()
    const trimmed = text.trim()
    if (!trimmed && (!images || images.length === 0)) return

    isProcessing.value = true
    const session = getOrCreateSession()
    session.status = 'processing'

    try {
      addMessage({ role: 'user', content: trimmed || '[图片]', source: 'text', images })

      // Add thinking message
      addSystemMessage('正在思考...', 'thinking')

      // Inject existing events context for NLU
      const eventStore = useEventStore()
      const existingEvents = eventStore.events.map((e) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        startTime: e.startTime,
        endTime: e.endTime,
        category: e.category
      }))

      const result = await nluManager.parse(trimmed, 'nlu', images, existingEvents)
      setCRUDOperations(result.operations)

      if (result.operations.length === 0) {
        session.status = 'completed'
        replaceThinkingMessage('未能解析出可执行操作，请尝试更明确的指令')
      } else {
        if (!hasQueryOps(result.operations)) {
          // No query ops - normal flow
          session.status = 'waiting-decision'
          const opDescriptions = result.operations
            .map((op) => `${typeLabel(op.type)} "${op.event.title}"`)
            .join('、')
          const opIds = result.operations.map((op) => op.id)
          replaceThinkingMessage(
            `识别到 ${result.operations.length} 个操作：${opDescriptions}`,
            undefined,
            opIds
          )
          startCRUDCountdown()
        } else {
          // Query ops - execute immediately
          session.status = 'waiting-decision'
          const queryOps = result.operations.filter((op) => op.type === 'query')
          const otherOps = result.operations.filter((op) => op.type !== 'query')

          // Execute queries immediately
          for (const qOp of queryOps) {
            await executeQuery(qOp)
          }

          if (otherOps.length > 0) {
            setCRUDOperations(otherOps)
            const opDescriptions = otherOps
              .map((op) => `${typeLabel(op.type)} "${op.event.title}"`)
              .join('、')
            const opIds = otherOps.map((op) => op.id)
            addSystemMessage(
              `还有 ${otherOps.length} 个待执行操作：${opDescriptions}`,
              undefined,
              opIds
            )
            startCRUDCountdown()
          } else {
            session.status = 'completed'
          }
        }
      }
    } catch (err) {
      log.error('NLU error:', err)
      session.status = 'completed'
      replaceThinkingMessage(`处理失败：${err instanceof Error ? err.message : String(err)}`, 'error')
    } finally {
      isProcessing.value = false
    }
  }

  function hasQueryOps(ops: CRUDOperation[]): boolean {
    return ops.some((op) => op.type === 'query')
  }

  async function executeQuery(op: CRUDOperation): Promise<void> {
    const eventStore = useEventStore()
    const events = await eventStore.searchEvents(op.event.title)
    if (events.length > 0) {
      const eventList = events
        .slice(0, 5)
        .map((e) => `  • ${e.title} (${e.startDate}${e.startTime ? ' ' + e.startTime : ''})`)
        .join('\n')
      replaceThinkingMessage(
        `找到 ${events.length} 个相关事件：\n${eventList}${events.length > 5 ? '\n  ...等' : ''}`,
        'executed',
        [op.id]
      )
    } else {
      replaceThinkingMessage(`未找到与"${op.event.title}"相关的事件`, 'executed', [op.id])
    }
    op.status = 'executed'
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
    const pendingOps = session.crudOperations.filter((o) => o.status === 'pending')
    if (pendingOps.length === 0) return
    const bestOp = pendingOps.reduce((a, b) => (a.confidence > b.confidence ? a : b))
    executeCRUD(bestOp.id)
  }

  async function executeCRUD(operationId: string): Promise<void> {
    const session = currentSession.value
    if (!session) return

    stopCRUDCountdown()

    const op = session.crudOperations.find((o) => o.id === operationId)
    if (!op || op.status === 'executed') return

    op.status = 'executing'
    log.info('Executing CRUD:', op.type, op.event.title)

    try {
      const eventStore = useEventStore()

      switch (op.type) {
        case 'create': {
          const created = await eventStore.createEvent({
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
          if (created) {
            op.executedEventId = created.id
          }
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
      op.status = 'executed'

      // Check if all ops are done
      const allDone = session.crudOperations.every(
        (o) => o.status === 'executed' || o.status === 'abandoned' || o.status === 'error' || o.status === 'rolled-back'
      )
      if (allDone) {
        session.status = 'completed'
      }

      if (op.type === 'create' && op.executedEventId) {
        addSystemMessage(
          `已创建 "${op.event.title}"`,
          'created',
          [op.id],
          op.executedEventId
        )
      } else {
        addSystemMessage(
          `已${typeLabel(op.type)} "${op.event.title}"`,
          'executed',
          [op.id]
        )
      }
      log.info('CRUD executed successfully:', op.type, op.event.title)
    } catch (err) {
      log.error('CRUD execution failed:', err)
      op.status = 'error'
      addSystemMessage(
        `${typeLabel(op.type)} "${op.event.title}" 失败：${err instanceof Error ? err.message : String(err)}`,
        'error',
        [op.id]
      )
    }
  }

  async function rollbackCRUD(operationId: string): Promise<void> {
    const session = currentSession.value
    if (!session) return

    const op = session.crudOperations.find((o) => o.id === operationId)
    if (!op || !op.executedEventId) return

    log.info('Rolling back CRUD:', op.type, op.event.title)

    try {
      const eventStore = useEventStore()
      await eventStore.deleteEvent(op.executedEventId)
      await eventStore.fetchEvents()
      op.status = 'rolled-back'
      addSystemMessage(
        `已撤销创建 "${op.event.title}"`,
        'rolled-back',
        [op.id]
      )
      log.info('CRUD rolled back successfully:', op.type, op.event.title)
    } catch (err) {
      log.error('CRUD rollback failed:', err)
      addSystemMessage(`撤销失败：${err instanceof Error ? err.message : String(err)}`, 'error')
    }
  }

  function abandonCRUD(): void {
    const session = currentSession.value
    if (!session) return
    session.status = 'abandoned'
    stopCRUDCountdown()
    const opIds = session.crudOperations.map((op) => {
      op.status = 'abandoned'
      return op.id
    })
    addSystemMessage('已放弃操作', 'abandoned', opIds)
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
    supportsImages,
    highlightedOps,
    setCountdownSeconds,
    startListening,
    stopListening,
    processTextInput,
    startInputCountdown,
    stopInputCountdown,
    cancelInputCountdown,
    executeCRUD,
    rollbackCRUD,
    autoExecuteCRUD,
    abandonCRUD,
    newSession,
    stopCRUDCountdown,
    addMessage,
    addSystemMessage,
    setHighlightedOps
  }
})
