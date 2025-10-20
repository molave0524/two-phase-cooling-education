/**
 * Sentry Server Configuration
 * This file configures Sentry for server-side error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // Sentry DSN (Data Source Name)
  dsn: process.env.SENTRY_DSN,

  // Environment name
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only initialize in production or when explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',

  // Server-specific integrations
  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration(), // If using Prisma
  ],

  // Filter events before sending
  beforeSend(event, hint) {
    // Don't send events from development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && process.env.SENTRY_ENABLED !== 'true') {
      return null
    }

    // Scrub sensitive data from request
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['cookie']
        delete event.request.headers['authorization']
        delete event.request.headers['x-api-key']
      }

      // Remove sensitive query params
      if (event.request.query_string) {
        const sensitiveParams = ['token', 'api_key', 'password', 'secret']
        event.request.query_string = event.request.query_string
          .split('&')
          .filter(param => !sensitiveParams.some(sp => param.toLowerCase().includes(sp)))
          .join('&')
      }
    }

    // Scrub sensitive context data
    if (event.contexts) {
      delete event.contexts.cookies
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Sentry Event:', hint.originalException || hint.syntheticException)
    }

    return event
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    // Postgres connection errors (handled by connection pool)
    'Connection terminated unexpectedly',
    'ECONNREFUSED',
    // Client disconnections (user navigated away)
    'Client has already been connected',
    'Connection terminated',
    // Expected API errors
    'Invalid request',
    'Unauthorized',
  ],
})
