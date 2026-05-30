import type { CRUDOperation } from '../../types/conversation'

export interface NLUResult {
  operations: CRUDOperation[]
  rawText: string
  source: 'nlu'
}

export interface NLUEngine {
  readonly name: string
  parse(text: string, source: 'nlu'): Promise<NLUResult>
  isAvailable(): boolean
}
