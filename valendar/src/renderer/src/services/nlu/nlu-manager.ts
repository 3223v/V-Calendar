import type { NLUEngine, NLUResult, NLUContext } from './nlu.interface'
import { langGraphNLU } from './langgraph-nlu'
import { createLogger } from '../../utils/logger'

const log = createLogger('NLUManager')

/**
 * NLU Manager — central registry for NLU engines.
 *
 * === Adding a new NLU engine ===
 *
 * 1. Create a new file in services/nlu/ (e.g. my-custom-nlu.ts)
 * 2. Implement the NLUEngine interface:
 *    - readonly name: string
 *    - configure(...): void
 *    - isAvailable(): boolean
 *    - parse(text, source, context?): Promise<NLUResult>
 * 3. Import and register it in this file:
 *    nluManager.register(myEngine)
 * 4. (Optional) Add a selector in SettingsPage to let users pick the engine.
 *    Call nluManager.setActive(name) to switch.
 */
class NLUManager implements NLUEngine {
  readonly name = 'NLU Manager'
  private engines = new Map<string, NLUEngine>()
  private activeEngine: NLUEngine | null = null

  constructor() {
    this.register(langGraphNLU)
    this.setActive(langGraphNLU.name)
  }

  register(engine: NLUEngine): void {
    this.engines.set(engine.name, engine)
    log.info('Registered engine:', engine.name)
  }

  setActive(name: string): boolean {
    const engine = this.engines.get(name)
    if (!engine) {
      log.warn('Engine not found:', name)
      return false
    }
    this.activeEngine = engine
    log.info('Active engine set to:', name)
    return true
  }

  getEngineNames(): string[] {
    return Array.from(this.engines.keys())
  }

  getActiveEngine(): NLUEngine | null {
    return this.activeEngine
  }

  configure(baseUrl: string, apiKey: string, model: string): void {
    if (!this.activeEngine) {
      log.warn('No active engine to configure')
      return
    }

    log.info('configure() called:', { baseUrl, apiKey: apiKey ? '***set***' : '(empty)', model })

    if (
      'configure' in this.activeEngine &&
      typeof (this.activeEngine as any).configure === 'function'
    ) {
      ;(this.activeEngine as any).configure(baseUrl, apiKey, model)
      log.info(
        'Engine configured:',
        this.activeEngine.name,
        '| available:',
        this.activeEngine.isAvailable()
      )
    }
  }

  isAvailable(): boolean {
    return this.activeEngine?.isAvailable() ?? false
  }

  async parse(text: string, source: 'nlu', context?: NLUContext): Promise<NLUResult> {
    if (!this.activeEngine) {
      throw new Error('No NLU engine available')
    }
    return this.activeEngine.parse(text, source, context)
  }
}

export const nluManager = new NLUManager()
