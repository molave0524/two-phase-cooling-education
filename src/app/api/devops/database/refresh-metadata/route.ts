/**
 * API Route: Refresh Database Metadata
 * Refreshes metadata for a target environment without performing comparison
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { logger } from '@/lib/logger'

type Environment = 'dev' | 'uat' | 'prod'

interface RefreshMetadataRequest {
  environment: Environment
}

/**
 * Refresh metadata for target environment using dblink
 */
async function refreshFDWMetadata(environment: Environment): Promise<void> {
  const envVar = `${environment.toUpperCase()}_POSTGRES_URL`
  const connectionUrl = process.env[envVar]

  if (!connectionUrl) {
    logger.warn('Missing environment variable for metadata refresh', { envVar })
    throw new Error(`Missing environment variable: ${envVar}`)
  }

  const url = new URL(connectionUrl)

  try {
    // Call stored procedure on remote database to refresh metadata
    logger.info('Calling stored procedure for metadata refresh', { environment })

    await db.execute(
      sql.raw(`
        CREATE EXTENSION IF NOT EXISTS dblink;

        SELECT dblink_exec(
          'host=${url.hostname} port=${url.port || '5432'} dbname=${url.pathname.slice(1)} user=${url.username} password=${url.password} sslmode=require',
          'CALL public.usp_stage_pg_metadata_tables_for_schema_comparison()'
        );
      `)
    )

    logger.info('Successfully refreshed metadata', { environment })
  } catch (error) {
    logger.error('Metadata refresh error', { error, environment })
    throw error
  }
}

/**
 * POST /api/devops/database/refresh-metadata
 * Refresh metadata for a target environment
 */
export async function POST(request: NextRequest) {
  try {
    const body: RefreshMetadataRequest = await request.json()
    const { environment } = body

    // Validate environment
    if (!environment || !['dev', 'uat', 'prod'].includes(environment)) {
      return NextResponse.json(
        { error: 'Invalid environment. Must be dev, uat, or prod.' },
        { status: 400 }
      )
    }

    logger.info('Starting metadata refresh', { environment })

    // Refresh FDW metadata
    await refreshFDWMetadata(environment)

    return NextResponse.json({
      success: true,
      message: `Metadata refreshed successfully for ${environment} environment`,
      environment,
    })
  } catch (error) {
    logger.error('Metadata refresh failed', { error })
    return NextResponse.json(
      {
        error: 'Failed to refresh metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
