/**
 * API Route: Refresh Database Metadata
 * Refreshes metadata for a target environment without performing comparison
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { logger } from '@/lib/logger'

type Environment = 'dev' | 'uat' | 'prod'

interface RefreshMetadataRequest {
  environment: Environment
}

/**
 * Refresh metadata for target environment by connecting directly
 */
async function refreshFDWMetadata(environment: Environment): Promise<void> {
  const envVar = `${environment.toUpperCase()}_POSTGRES_URL`
  const connectionUrl = process.env[envVar]

  if (!connectionUrl) {
    logger.warn('Missing environment variable for metadata refresh', { envVar })
    throw new Error(`Missing environment variable: ${envVar}`)
  }

  // Create a direct connection to the remote database
  const remoteClient = postgres(connectionUrl, {
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  const remoteDb = drizzle(remoteClient)

  try {
    // Call stored procedure directly on remote database
    logger.info('Calling stored procedure for metadata refresh', { environment })

    await remoteDb.execute(
      sql.raw(`CALL public.usp_stage_pg_metadata_tables_for_schema_comparison()`)
    )

    logger.info('Successfully refreshed metadata', { environment })
  } catch (error) {
    logger.error('Metadata refresh error', { error, environment })
    throw error
  } finally {
    // Close the connection
    await remoteClient.end()
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
