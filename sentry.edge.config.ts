/**
 * Sentry Edge Configuration
 * This file configures Sentry for Edge Runtime (middleware, edge functions)
 */

import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    // Sentry DSN (Data Source Name)
    dsn: process.env.SENTRY_DSN,

    // Environment name
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Release tracking
    ...(process.env.VERCEL_GIT_COMMIT_SHA && {
      release: process.env.VERCEL_GIT_COMMIT_SHA,
    }),

    // Performance Monitoring (lower sample rate for edge to reduce overhead)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Only initialize in production or when explicitly enabled
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',

    // Edge runtime has limited integrations available
    integrations: [],

    // Filter events before sending
    beforeSend(event, hint) {
      // Don't send events from development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && process.env.SENTRY_ENABLED !== 'true') {
        return null
      }

      // Scrub sensitive data
      if (event.request?.headers) {
        delete event.request.headers['cookie']
        delete event.request.headers['authorization']
      }

      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Sentry Edge Event:', hint.originalException || hint.syntheticException)
      }

      return event
    },

    // Ignore middleware-specific errors
    ignoreErrors: ['Rate limit exceeded', 'Invalid token', 'Unauthorized'],
  })
}
