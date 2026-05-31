import type { CRUDOperation } from '../../types/conversation'

export interface NLUResult {
  operations: CRUDOperation[]
  rawText: string
  source: 'nlu'
}

export interface ExistingEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  category: string
}

export interface NLUEngine {
  readonly name: string
  parse(text: string, source: 'nlu', images?: string[], existingEvents?: ExistingEvent[]): Promise<NLUResult>
  isAvailable(): boolean
}
