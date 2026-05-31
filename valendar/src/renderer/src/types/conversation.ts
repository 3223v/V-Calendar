export interface ConversationMessage {
  id: string
  role: 'user' | 'system'
  content: string
  source: 'voice-online' | 'text'
  timestamp: string
  images?: string[]
  status?: 'thinking' | 'executed' | 'abandoned' | 'error' | 'created' | 'rolled-back'
  opIds?: string[]
  executedEventId?: string
}

export interface CRUDOperation {
  id: string
  source: 'nlu'
  confidence: number
  type: 'create' | 'update' | 'delete' | 'query'
  status: 'pending' | 'executing' | 'executed' | 'abandoned' | 'error' | 'rolled-back'
  executedEventId?: string
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
}

export interface ConversationHistoryEntry {
  id: string
  messages: ConversationMessage[]
  crudOperations: CRUDOperation[]
  status: 'completed' | 'abandoned'
  createdAt: string
  completedAt: string
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
