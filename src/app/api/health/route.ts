/**
 * Health Check Endpoint
 * Used by load balancers and monitoring systems to verify application health
 *
 * Returns:
 * - 200 OK: All systems healthy
 * - 503 Service Unavailable: Critical failure (database down, etc.)
 */

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  environment: string
  checks: {
    database: {
      status: 'up' | 'down'
      latency?: number
      error?: string
    }
    server: {
      status: 'up'
      uptime: number
      memory: {
        used: number
        total: number
        percentage: number
      }
    }
  }
  version?: string
}

export async function GET() {
  const startTime = Date.now()

  const healthCheck: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {
      database: {
        status: 'down',
      },
      server: {
        status: 'up',
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: Math.round(
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
          ),
        },
      },
    },
    ...(process.env.npm_package_version && { version: process.env.npm_package_version }),
  }

  // Database health check
  try {
    const dbStartTime = Date.now()
    await db.execute(sql`SELECT 1 as health_check`)
    const dbLatency = Date.now() - dbStartTime

    healthCheck.checks.database = {
      status: 'up',
      latency: dbLatency,
    }
  } catch (error) {
    healthCheck.status = 'unhealthy'
    healthCheck.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    }

    logger.error('Health check: Database connection failed', { error })

    return NextResponse.json(healthCheck, { status: 503 })
  }

  // Log health check (only in development to avoid log spam)
  if (process.env.NODE_ENV === 'development') {
    logger.info('Health check completed', {
      status: healthCheck.status,
      duration: Date.now() - startTime,
      dbLatency: healthCheck.checks.database.latency,
    })
  }

  return NextResponse.json(healthCheck, { status: 200 })
}

/**
 * HEAD request for lightweight health checks
 * Load balancers often use HEAD requests to reduce bandwidth
 */
export async function HEAD() {
  try {
    await db.execute(sql`SELECT 1 as health_check`)
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    logger.error('Health check HEAD: Database connection failed', { error })
    return new NextResponse(null, { status: 503 })
  }
}
