/**
 * Sentry Client Configuration
 * This file configures Sentry for client-side error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // Sentry DSN (Data Source Name) - get this from your Sentry project settings
  // https://sentry.io/settings/[your-org]/projects/[your-project]/keys/
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment name (development, staging, production)
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Release tracking for better debugging
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Only initialize in production or when explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration({
      // Trace specific Next.js features
      tracePropagationTargets: ['localhost', /^\//],
    }),
  ],

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Don't send events from development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && process.env.SENTRY_ENABLED !== 'true') {
      return null
    }

    // Filter out localhost URLs in production
    if (event.request?.url?.includes('localhost')) {
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
      console.error('Sentry Event:', hint.originalException || hint.syntheticException)
    }

    return event
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // ResizeObserver loop errors (benign)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Non-Error promise rejections
    'Non-Error promise rejection captured',
  ],
})
