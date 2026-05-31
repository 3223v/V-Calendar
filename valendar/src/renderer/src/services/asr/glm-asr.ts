import type { ASREngine, ASRResult } from './asr.interface'
import { createLogger } from '../../utils/logger'

const log = createLogger('GLM-ASR')

const DEFAULT_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/audio/transcriptions'
const DEFAULT_MODEL = 'glm-asr-2512'
const DEFAULT_API_KEY = '9b36f0044c8a4d2eb486e3b037749361.3oTwpnahTWQvSp4w'

interface GLMASRConfig {
  endpoint: string
  apiKey: string
  model: string
}

export class GLMASREngine implements ASREngine {
  readonly name = 'GLM-ASR-2512'
  readonly type = 'online' as const

  private config: GLMASRConfig = {
    endpoint: DEFAULT_ENDPOINT,
    apiKey: DEFAULT_API_KEY,
    model: DEFAULT_MODEL
  }

  configure(apiKey: string, endpoint?: string, model?: string): void {
    this.config.apiKey = apiKey
    if (endpoint) this.config.endpoint = endpoint
    if (model) this.config.model = model
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }

  async transcribe(audioBlob: Blob): Promise<ASRResult> {
    if (!this.config.apiKey) {
      throw new Error('GLM ASR 未配置 API Key，请在设置中填写智谱 API Key')
    }

    const startTime = performance.now()
    const formData = new FormData()

    // File field: GLM API supports wav/mp3, max 25MB, max 30s
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', this.config.model)

    log.info('Calling GLM ASR API, audio size:', audioBlob.size, 'bytes')

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GLM ASR API error (${response.status}): ${errorText}`)
    }

    const data: GLMASRResponse = await response.json()
    const latency = performance.now() - startTime

    log.info('GLM ASR result:', data.text, 'latency:', latency.toFixed(0), 'ms')

    return {
      text: data.text || '',
      confidence: 0.95, // GLM API doesn't return confidence, use default
      latency
    }
  }
}

interface GLMASRResponse {
  id: string
  created: number
  request_id: string
  model: string
  text: string
}

export const glmASREngine = new GLMASREngine()
