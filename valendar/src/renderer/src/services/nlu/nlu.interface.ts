import type { CRUDOperation, ConversationMessage } from '../../types/conversation'
import type { CalendarEvent } from '../../types'

export interface NLUResult {
  operations: CRUDOperation[]
  rawText: string
  source: 'nlu'
}

export interface NLUContext {
  recentMessages: ConversationMessage[]
  recentOperations: CRUDOperation[]
  upcomingEvents: CalendarEvent[]
  currentTime: string
}

export interface NLUEngine {
  readonly name: string
  parse(text: string, source: 'nlu', context?: NLUContext): Promise<NLUResult>
  isAvailable(): boolean
}
