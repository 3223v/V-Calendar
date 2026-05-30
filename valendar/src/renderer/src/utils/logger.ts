type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const LOG_STYLES: Record<LogLevel, string> = {
  debug: 'color: #95A5A6',
  info: 'color: #2C3E50',
  warn: 'color: #E67E22; font-weight: bold',
  error: 'color: #E74C3C; font-weight: bold'
}

const currentLevel: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatTime(): string {
  return new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  })
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

export function createLogger(module: string): Logger {
  const prefix = `[${module}]`

  return {
    debug(message: string, ...args: unknown[]): void {
      if (shouldLog('debug')) {
        console.debug(
          `%c${formatTime()} %c${prefix} ${message}`,
          'color: #95A5A6',
          LOG_STYLES.debug,
          ...args
        )
      }
    },

    info(message: string, ...args: unknown[]): void {
      if (shouldLog('info')) {
        console.log(
          `%c${formatTime()} %c${prefix} ${message}`,
          'color: #95A5A6',
          LOG_STYLES.info,
          ...args
        )
      }
    },

    warn(message: string, ...args: unknown[]): void {
      if (shouldLog('warn')) {
        console.warn(
          `%c${formatTime()} %c${prefix} ${message}`,
          'color: #95A5A6',
          LOG_STYLES.warn,
          ...args
        )
      }
    },

    error(message: string, ...args: unknown[]): void {
      if (shouldLog('error')) {
        console.error(
          `%c${formatTime()} %c${prefix} ${message}`,
          'color: #95A5A6',
          LOG_STYLES.error,
          ...args
        )
      }
    }
  }
}
