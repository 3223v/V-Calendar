import type { ASREngine, ASRResult, ASRInput } from './asr.interface'
import { glmASREngine } from './glm-asr'
import { createLogger } from '../../utils/logger'

const log = createLogger('OnlineASR')

export class OnlineASR implements ASREngine {
  readonly name = 'Online ASR'
  readonly type = 'online' as const

  private engine: ASREngine = glmASREngine
  private apiKey = ''

  setEngine(engine: ASREngine): void {
    this.engine = engine
    log.info('ASR engine switched to:', engine.name)
  }

  configure(apiKey: string): void {
    this.apiKey = apiKey
    glmASREngine.configure(apiKey)
    log.info('ASR configured with API key')
  }

  getApiKey(): string {
    return this.apiKey
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    return this.engine.isAvailable()
  }

  async transcribe(input: ASRInput): Promise<ASRResult> {
    if (!this.apiKey) {
      throw new Error('ASR 未配置：请在设置中填写智谱 API Key')
    }

    log.info('Transcribing with:', this.engine.name)
    return this.engine.transcribe(input)
  }
}

export const onlineASR = new OnlineASR()
