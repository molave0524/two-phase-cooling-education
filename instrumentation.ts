/**
 * Next.js Instrumentation
 * This file is automatically loaded by Next.js for server-side instrumentation
 * Used to initialize monitoring tools like Sentry, OpenTelemetry, etc.
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  // Run on Edge runtime (middleware)
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
