/**
 * Inventory Cleanup API
 * Endpoint to clean up expired inventory reservations
 * Can be triggered by cron jobs or manual admin actions
 */

import { NextRequest } from 'next/server'
import { cleanupExpiredReservations } from '@/lib/inventory'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, ERROR_CODES } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/inventory/cleanup
 * Cleans up expired inventory reservations
 *
 * Security: This endpoint should be protected in production
 * - Use API key authentication for cron jobs
 * - Or restrict to admin users only
 */
export async function POST(request: NextRequest) {
  try {
    // Simple API key authentication for cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET

    // Allow requests with proper authorization or in development
    const isAuthorized =
      process.env.NODE_ENV === 'development' ||
      (authHeader && authHeader === `Bearer ${cronSecret}`)

    if (!isAuthorized) {
      logger.warn('Unauthorized cleanup attempt', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      })
      return apiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', { status: 401 })
    }

    logger.info('Starting inventory cleanup job')

    const cleanedCount = await cleanupExpiredReservations()

    logger.info('Inventory cleanup completed', {
      cleanedCount,
      timestamp: new Date().toISOString(),
    })

    return apiSuccess({
      message: 'Cleanup completed successfully',
      cleanedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Inventory cleanup failed', { error })
    return apiError(ERROR_CODES.INTERNAL_ERROR, 'Failed to clean up inventory reservations', {
      status: 500,
      error,
    })
  }
}

/**
 * GET /api/inventory/cleanup
 * Get cleanup job status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Simple API key authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET

    const isAuthorized =
      process.env.NODE_ENV === 'development' ||
      (authHeader && authHeader === `Bearer ${cronSecret}`)

    if (!isAuthorized) {
      return apiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', { status: 401 })
    }

    // Return cleanup job information
    return apiSuccess({
      message: 'Inventory cleanup endpoint',
      documentation: {
        endpoint: '/api/inventory/cleanup',
        method: 'POST',
        authentication: 'Bearer token in Authorization header',
        description: 'Cleans up expired inventory reservations',
        schedule: 'Recommended: Every 15-30 minutes',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        cronSecretConfigured: !!process.env.CRON_SECRET,
      },
    })
  } catch (error) {
    logger.error('Failed to get cleanup status', { error })
    return apiError(ERROR_CODES.INTERNAL_ERROR, 'Failed to get cleanup status', {
      status: 500,
      error,
    })
  }
}
