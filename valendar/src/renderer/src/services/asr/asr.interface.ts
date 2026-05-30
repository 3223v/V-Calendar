export interface ASRResult {
  text: string
  confidence: number
  latency: number
}

export type ASRInput = ArrayBuffer | Blob

export interface ASREngine {
  readonly name: string
  readonly type: 'offline' | 'online'
  transcribe(input: ASRInput): Promise<ASRResult>
  isAvailable(): Promise<boolean>
}
