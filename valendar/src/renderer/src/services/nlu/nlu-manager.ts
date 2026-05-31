import type { NLUEngine, NLUResult, ExistingEvent } from './nlu.interface'
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
 *    - parse(text, source): Promise<NLUResult>
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
    // Register built-in engines
    this.register(langGraphNLU)
    this.setActive(langGraphNLU.name)
  }

  /** Register an NLU engine */
  register(engine: NLUEngine): void {
    this.engines.set(engine.name, engine)
    log.info('Registered engine:', engine.name)
  }

  /** Set the active engine by name */
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

  /** Get all registered engine names */
  getEngineNames(): string[] {
    return Array.from(this.engines.keys())
  }

  /** Get the active engine instance (for direct configuration) */
  getActiveEngine(): NLUEngine | null {
    return this.activeEngine
  }

  /** Configure the active engine's LLM connection */
  configure(baseUrl: string, apiKey: string, model: string, supportsImage?: boolean): void {
    if (!this.activeEngine) {
      log.warn('No active engine to configure')
      return
    }

    log.info('configure() called:', { baseUrl, apiKey: apiKey ? '***set***' : '(empty)', model, supportsImage })

    // Engines that support LLM configuration implement configure()
    if ('configure' in this.activeEngine && typeof (this.activeEngine as any).configure === 'function') {
      (this.activeEngine as any).configure(baseUrl, apiKey, model)
      log.info('Engine configured:', this.activeEngine.name, '| available:', this.activeEngine.isAvailable())
    }

    if (supportsImage !== undefined && 'setSupportsImage' in this.activeEngine && typeof (this.activeEngine as any).setSupportsImage === 'function') {
      (this.activeEngine as any).setSupportsImage(supportsImage)
    }
  }

  isAvailable(): boolean {
    return this.activeEngine?.isAvailable() ?? false
  }

  async parse(text: string, source: 'nlu', images?: string[], existingEvents?: ExistingEvent[]): Promise<NLUResult> {
    if (!this.activeEngine) {
      throw new Error('No NLU engine available')
    }
    return this.activeEngine.parse(text, source, images, existingEvents)
  }
}

export const nluManager = new NLUManager()
