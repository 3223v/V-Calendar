export interface ConversationMessage {
  id: string
  role: 'user' | 'system' | 'assistant'
  type: 'text' | 'thinking' | 'result' | 'error' | 'abandoned' | 'completed'
  content: string
  source: 'voice-online' | 'text' | 'nlu' | 'system'
  timestamp: string
  crudOperations?: CRUDOperation[]
  metadata?: Record<string, any>
}

export interface CRUDOperation {
  id: string
  source: 'nlu'
  confidence: number
  type: 'create' | 'update' | 'delete'
  event: {
    title: string
    description?: string
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
    isAllDay: boolean
    category: string
    location?: string
  }
  executed?: boolean
  error?: string
}

export interface NLUResult {
  operations: CRUDOperation[]
  rawText: string
  source: 'nlu'
}

export interface ConversationSession {
  id: string
  messages: ConversationMessage[]
  crudOperations: CRUDOperation[]
  status: 'listening' | 'processing' | 'waiting-decision' | 'executing' | 'completed' | 'abandoned'
  countdownSeconds: number
  createdAt: string
  updatedAt: string
}

export interface AISettings {
  provider: 'openai' | 'custom'
  baseUrl: string
  apiKey: string
  model: string
}

export interface ASRSettings {
  onlineProvider: 'glm' | 'custom'
  onlineKey: string
  enabled: boolean
}
