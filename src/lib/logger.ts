/**
 * Centralized Logging Utility
 * Provides structured logging with automatic sensitive data redaction
 * Integrated with Sentry for error tracking in production
 */

import * as Sentry from '@sentry/nextjs'

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

    const sanitizedMetadata = this.sanitizeMetadata(metadata)
    const errorData = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...sanitizedMetadata,
    }

    console.error(`[ERROR] ${message}`, errorData)

    // Send to Sentry in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true') {
      // Set context for better debugging
      if (sanitizedMetadata) {
        Sentry.setContext('metadata', sanitizedMetadata)
      }

      // Capture the error
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: {
            logger: 'true',
          },
          contexts: {
            message: {
              formatted: message,
            },
          },
        })
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          tags: {
            logger: 'true',
          },
          extra: {
            errorMessage: String(error),
            ...errorData,
          },
        })
      }
    }
  }
}

export const logger = new Logger()
