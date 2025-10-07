import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type Environment = 'dev' | 'uat' | 'prod'

interface SetupRequest {
  environment: Environment
}

export async function POST(request: NextRequest) {
  try {
    const { environment } = (await request.json()) as SetupRequest

    if (!['dev', 'uat', 'prod'].includes(environment)) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 })
    }

    // Get environment-specific database URL
    const envVar = `${environment.toUpperCase()}_POSTGRES_URL`
    const connectionUrl = process.env[envVar]

    if (!connectionUrl) {
      return NextResponse.json(
        { error: `Missing environment variable: ${envVar}` },
        { status: 500 }
      )
    }

    // Parse connection URL
    const url = new URL(connectionUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const dbname = url.pathname.slice(1)
    const username = url.username
    const password = url.password

    // Setup FDW connection
    const serverName = `${environment}_server`
    const schemaName = `${environment}_remote`

    await db.execute(
      sql.raw(`
      -- Enable FDW extension
      CREATE EXTENSION IF NOT EXISTS postgres_fdw;

      -- Drop existing server if exists
      DROP SERVER IF EXISTS ${serverName} CASCADE;

      -- Create foreign server
      CREATE SERVER ${serverName}
      FOREIGN DATA WRAPPER postgres_fdw
      OPTIONS (
        host '${host}',
        port '${port}',
        dbname '${dbname}',
        sslmode 'require'
      );

      -- Create user mapping
      CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
      SERVER ${serverName}
      OPTIONS (user '${username}', password '${password}');

      -- Drop existing schema if exists
      DROP SCHEMA IF EXISTS ${schemaName} CASCADE;

      -- Create schema for foreign tables
      CREATE SCHEMA ${schemaName};

      -- Import foreign schema (public tables only)
      IMPORT FOREIGN SCHEMA public
      FROM SERVER ${serverName}
      INTO ${schemaName};
    `)
    )

    return NextResponse.json({
      success: true,
      message: `FDW setup completed for ${environment}`,
      environment,
      server: serverName,
      schema: schemaName,
    })
  } catch (error) {
    logger.error('FDW setup error', { error })
    return NextResponse.json(
      {
        error: 'Failed to setup FDW',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
