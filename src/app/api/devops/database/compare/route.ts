import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type Environment = 'local' | 'dev' | 'uat' | 'prod'

interface CompareRequest {
  source: Environment
  target: Environment
}

interface ColumnDifference {
  table: string
  column: string
  status: 'added' | 'removed' | 'modified' | 'matching'
  sourceType?: string
  targetType?: string
}

export async function POST(request: NextRequest) {
  try {
    const { source, target } = (await request.json()) as CompareRequest

    if (source === target) {
      return NextResponse.json({ error: 'Source and target must be different' }, { status: 400 })
    }

    // Check if environment variable exists for target
    if (target !== 'local') {
      const envVar = `${target.toUpperCase()}_POSTGRES_URL`
      const targetUrl = process.env[envVar]

      if (!targetUrl) {
        return NextResponse.json(
          {
            error: 'Environment not configured',
            details: `Missing environment variable: ${envVar}. Please add it to .env.local to enable schema comparison with ${target.toUpperCase()}.`,
            envVar,
          },
          { status: 400 }
        )
      }

      // Check if target URL is same as local (comparing to same database)
      const localUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
      if (targetUrl === localUrl) {
        return NextResponse.json(
          {
            error: 'Same database comparison',
            details: `Cannot compare: ${target.toUpperCase()}_POSTGRES_URL points to the same database as local. Schema comparison requires different databases.`,
          },
          { status: 400 }
        )
      }
    }

    // Setup FDW for target environment if not local
    if (target !== 'local') {
      logger.info('Setting up FDW for schema comparison', { target })
      await setupFDW(target)
      logger.info('FDW setup complete', { target })
    }

    const targetSchema = target === 'local' ? 'public' : `${target}_remote`
    logger.info('Using target schema for comparison', { targetSchema })

    // Get tables from source (always local/public)
    const sourceTables = (await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)) as Array<{ tablename: string }>

    // Get tables from target
    // For FDW: Query the foreign schema's tables directly using pg_catalog
    const targetTablesQuery =
      target === 'local'
        ? sql`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
          `
        : sql.raw(`
            SELECT c.relname as tablename
            FROM pg_catalog.pg_class c
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = '${targetSchema}'
              AND c.relkind = 'f'
            ORDER BY c.relname
          `)

    const targetTables = (await db.execute(targetTablesQuery)) as Array<{ tablename: string }>

    const sourceTableNames = new Set(sourceTables.map((t: { tablename: string }) => t.tablename))
    const targetTableNames = new Set(targetTables.map((t: { tablename: string }) => t.tablename))

    // Find table differences
    const tablesOnlyInSource = Array.from(sourceTableNames).filter(t => !targetTableNames.has(t))
    const tablesOnlyInTarget = Array.from(targetTableNames).filter(t => !sourceTableNames.has(t))
    const tablesInBoth = Array.from(sourceTableNames).filter(t => targetTableNames.has(t))

    // Compare columns for tables in both
    const columnDifferences: ColumnDifference[] = []

    for (const tableName of tablesInBoth) {
      // Get columns from source
      const sourceColumns = (await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
        ORDER BY ordinal_position
      `)) as Array<{
        column_name: string
        data_type: string
        is_nullable: string
      }>

      // Get columns from target
      // Note: For FDW, we need to query the foreign columns directly from the foreign table
      // We'll use the pg_attribute catalog instead since information_schema isn't imported via FDW
      const targetColumnsQuery =
        target === 'local'
          ? sql`
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = ${tableName}
              ORDER BY ordinal_position
            `
          : sql.raw(`
              SELECT
                a.attname as column_name,
                format_type(a.atttypid, a.atttypmod) as data_type,
                CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END as is_nullable
              FROM pg_catalog.pg_attribute a
              JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
              JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
              WHERE n.nspname = '${targetSchema}'
                AND c.relname = '${tableName}'
                AND a.attnum > 0
                AND NOT a.attisdropped
              ORDER BY a.attnum
            `)

      const targetColumns = (await db.execute(targetColumnsQuery)) as Array<{
        column_name: string
        data_type: string
        is_nullable: string
      }>

      const sourceColMap = new Map<string, { type: string; nullable: string }>(
        sourceColumns.map((c: { column_name: string; data_type: string; is_nullable: string }) => [
          c.column_name,
          { type: c.data_type, nullable: c.is_nullable },
        ])
      )
      const targetColMap = new Map<string, { type: string; nullable: string }>(
        targetColumns.map((c: { column_name: string; data_type: string; is_nullable: string }) => [
          c.column_name,
          { type: c.data_type, nullable: c.is_nullable },
        ])
      )

      // Find added columns
      for (const [colName, colInfo] of Array.from(targetColMap)) {
        if (!sourceColMap.has(colName)) {
          columnDifferences.push({
            table: tableName,
            column: colName,
            status: 'added',
            targetType: colInfo.type,
          })
        }
      }

      // Find removed, modified, or matching columns
      for (const [colName, colInfo] of Array.from(sourceColMap)) {
        if (!targetColMap.has(colName)) {
          columnDifferences.push({
            table: tableName,
            column: colName,
            status: 'removed',
            sourceType: colInfo.type,
          })
        } else {
          const targetCol = targetColMap.get(colName)!
          if (colInfo.type !== targetCol.type || colInfo.nullable !== targetCol.nullable) {
            columnDifferences.push({
              table: tableName,
              column: colName,
              status: 'modified',
              sourceType: `${colInfo.type}${colInfo.nullable === 'YES' ? ' (nullable)' : ''}`,
              targetType: `${targetCol.type}${targetCol.nullable === 'YES' ? ' (nullable)' : ''}`,
            })
          } else {
            // Column matches perfectly
            columnDifferences.push({
              table: tableName,
              column: colName,
              status: 'matching',
              sourceType: colInfo.type,
              targetType: targetCol.type,
            })
          }
        }
      }
    }

    // Detect breaking changes
    const breakingChanges = detectBreakingChanges(
      tablesOnlyInSource,
      tablesOnlyInTarget,
      columnDifferences
    )

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      source,
      target,
      comparison: {
        tablesOnlyInSource,
        tablesOnlyInTarget,
        tablesInBoth,
        columnDifferences,
        breakingChanges,
        isCompatible: breakingChanges.length === 0,
      },
    })
  } catch (error) {
    logger.error('Schema comparison failed', { error })
    return NextResponse.json(
      {
        error: 'Failed to compare schemas',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

async function setupFDW(environment: string) {
  const envVar = `${environment.toUpperCase()}_POSTGRES_URL`
  const connectionUrl = process.env[envVar]

  if (!connectionUrl) {
    // Instead of throwing, return gracefully - FDW comparison not available
    logger.warn('Missing environment variable for FDW setup', { envVar })
    return
  }

  const url = new URL(connectionUrl)
  const serverName = `${environment}_server`
  const schemaName = `${environment}_remote`

  try {
    // Check if server already exists
    const serverExists = (await db.execute(sql`
      SELECT COUNT(*) as count
      FROM pg_foreign_server
      WHERE srvname = ${serverName}
    `)) as Array<{ count: number }>

    if (serverExists && serverExists[0] && serverExists[0].count > 0) {
      logger.info('FDW server already exists, skipping setup', { serverName })
      return
    }

    logger.info('Setting up FDW', { environment })

    // Step 0: Call stored procedure on remote to stage metadata tables for comparison
    logger.info('Calling stored procedure for schema comparison', { environment })
    await db.execute(
      sql.raw(`
      CREATE EXTENSION IF NOT EXISTS dblink;

      SELECT dblink_exec(
        'host=${url.hostname} port=${url.port || '5432'} dbname=${url.pathname.slice(1)} user=${url.username} password=${url.password} sslmode=require',
        'CALL public.usp_stage_pg_metadata_tables_for_schema_comparison()'
      );
    `)
    )
    logger.info('Successfully staged metadata tables', { environment })

    // Setup FDW
    await db.execute(
      sql.raw(`
      CREATE EXTENSION IF NOT EXISTS postgres_fdw;

      CREATE SERVER ${serverName}
      FOREIGN DATA WRAPPER postgres_fdw
      OPTIONS (
        host '${url.hostname}',
        port '${url.port || '5432'}',
        dbname '${url.pathname.slice(1)}',
        sslmode 'require'
      );

      CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
      SERVER ${serverName}
      OPTIONS (user '${url.username}', password '${url.password}');

      DROP SCHEMA IF EXISTS ${schemaName} CASCADE;

      CREATE SCHEMA ${schemaName};

      IMPORT FOREIGN SCHEMA public
      FROM SERVER ${serverName}
      INTO ${schemaName};
    `)
    )

    logger.info('FDW setup complete', { environment })
  } catch (error) {
    logger.error('FDW setup error', { error, environment })
    // If FDW already exists, continue
    if (error instanceof Error && !error.message.includes('already exists')) {
      throw error
    }
  }
}

function detectBreakingChanges(
  tablesOnlyInSource: string[],
  tablesOnlyInTarget: string[],
  columnDifferences: ColumnDifference[]
): string[] {
  const changes: string[] = []

  // Tables only in source (missing in target - would break deployment to target)
  if (tablesOnlyInSource.length > 0) {
    changes.push(`Tables missing in target: ${tablesOnlyInSource.join(', ')}`)
  }

  // Tables only in target (missing in source - would break if code expects them)
  if (tablesOnlyInTarget.length > 0) {
    changes.push(`Tables missing in source: ${tablesOnlyInTarget.join(', ')}`)
  }

  // Removed columns (breaking) - only for tables that exist in both
  const removedColumns = columnDifferences.filter(d => d.status === 'removed')
  if (removedColumns.length > 0) {
    changes.push(`Columns removed: ${removedColumns.map(c => `${c.table}.${c.column}`).join(', ')}`)
  }

  // Modified columns (potentially breaking) - only for tables that exist in both
  const modifiedColumns = columnDifferences.filter(d => d.status === 'modified')
  if (modifiedColumns.length > 0) {
    changes.push(
      `Columns modified (type changes): ${modifiedColumns.map(c => `${c.table}.${c.column}`).join(', ')}`
    )
  }

  return changes
}
