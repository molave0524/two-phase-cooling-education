/**
 * Centralized Logging Utility
 * Provides structured logging with automatic sensitive data redaction
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMetadata {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  private shouldLog(level: LogLevel): boolean {
    if (this.isTest) return false
    if (level === 'debug') return this.isDevelopment
    return true
  }

  private sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
    if (!metadata) return undefined

    // Remove sensitive fields
    const sanitized = { ...metadata }
    const sensitiveKeys = [
      'password',
      'apiKey',
      'token',
      'secret',
      'creditCard',
      'cvv',
      'ssn',
      'cardNumber',
      'client_secret', // Stripe
      'authorization',
    ]

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(k => lowerKey.includes(k))) {
        sanitized[key] = '[REDACTED]'
      }
    }

    return sanitized
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog('debug')) return
    console.log(`[DEBUG] ${message}`, this.sanitizeMetadata(metadata) || '')
  }

  info(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog('info')) return
    console.log(`[INFO] ${message}`, this.sanitizeMetadata(metadata) || '')
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog('warn')) return
    console.warn(`[WARN] ${message}`, this.sanitizeMetadata(metadata) || '')
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    if (!this.shouldLog('error')) return

    const errorData = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...this.sanitizeMetadata(metadata),
    }

    console.error(`[ERROR] ${message}`, errorData)

    // TODO: Send to error tracking service (Sentry, DataDog, etc.)
  }
}

export const logger = new Logger()
