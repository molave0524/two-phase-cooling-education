import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

interface TableInfo {
  name: string
  rowCount: number
  size: string
  lastModified: string | null
  columns: number
  indexes: number
}

interface DatabaseInfoResponse {
  database: {
    name: string
    type: 'postgresql'
    version: string
    size: string
  }
  tables: TableInfo[]
  statistics: {
    totalTables: number
    totalRows: number
    totalSize: string
  }
}

export async function GET() {
  try {
    // Get database name from connection string
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
    const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown'

    // Get PostgreSQL version first (this should always work)
    let version = 'unknown'
    let dbSize = 'unknown'

    try {
      const versionResult = await db.execute(sql`SELECT version()::text as version`)
      const versionRows = Array.isArray(versionResult) ? versionResult : versionResult.rows || []
      const versionString = (versionRows[0] as any)?.version || 'unknown'
      version = versionString.match(/PostgreSQL ([\d.]+)/)?.[1] || 'unknown'
    } catch (err) {
      // Version query failed, continue with unknown
    }

    // Get database size (this should always work)
    try {
      const dbSizeResult = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size(current_database()))::text as db_size
      `)
      const dbSizeRows = Array.isArray(dbSizeResult) ? dbSizeResult : dbSizeResult.rows || []
      dbSize = (dbSizeRows[0] as any)?.db_size || 'unknown'
    } catch (err) {
      // Size query failed, continue with unknown
    }

    // Get table statistics (this might fail if no tables exist)
    let tables: TableInfo[] = []

    try {
      const tablesResult = await db.execute(sql`
        SELECT
          t.tablename,
          COALESCE(pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))), '0 bytes')::text as total_size,
          s.last_vacuum::text as last_vacuum,
          (SELECT count(*)::integer FROM information_schema.columns c WHERE c.table_name = t.tablename AND c.table_schema = 'public') as column_count,
          (SELECT count(*)::integer FROM pg_indexes i WHERE i.tablename = t.tablename AND i.schemaname = 'public') as index_count
        FROM pg_tables t
        LEFT JOIN pg_stat_user_tables s ON s.relname = t.tablename
        WHERE t.schemaname = 'public'
        ORDER BY COALESCE(pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)), 0) DESC
      `)

      logger.debug('Tables query result type', {
        type: Array.isArray(tablesResult) ? 'array' : 'object',
      })
      logger.debug('Tables result length/rows', {
        length: Array.isArray(tablesResult) ? tablesResult.length : tablesResult.rows?.length,
      })

      // Handle both array format and rows property format
      const rows = Array.isArray(tablesResult) ? tablesResult : tablesResult.rows || []

      // Get actual row counts for each table
      logger.debug('Starting row count queries for tables', { count: rows.length })
      const tablesWithCounts = await Promise.all(
        rows.map(async (row: any) => {
          try {
            // Use sql template with identifier quoting for table name
            const countResult = await db.execute(
              sql.raw(`SELECT COUNT(*)::integer as count FROM "${row.tablename}"`)
            )
            const countRows = Array.isArray(countResult) ? countResult : countResult.rows || []
            const rowCount = countRows[0]?.count || 0

            return {
              name: row.tablename,
              rowCount,
              size: row.total_size || '0 bytes',
              lastModified: row.last_vacuum,
              columns: row.column_count || 0,
              indexes: row.index_count || 0,
            }
          } catch (err) {
            logger.debug('Error counting rows for table', { table: row.tablename, error: err })
            // Return 0 count if query fails
            return {
              name: row.tablename,
              rowCount: 0,
              size: row.total_size || '0 bytes',
              lastModified: row.last_vacuum,
              columns: row.column_count || 0,
              indexes: row.index_count || 0,
            }
          }
        })
      )

      logger.debug('Finished row counts', { tablesCount: tablesWithCounts.length })
      tables = tablesWithCounts
    } catch (err) {
      // No tables exist or query failed - return empty array
      tables = []
    }

    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0)

    const response: DatabaseInfoResponse = {
      database: {
        name: dbName,
        type: 'postgresql',
        version,
        size: dbSize,
      },
      tables,
      statistics: {
        totalTables: tables.length,
        totalRows,
        totalSize: dbSize,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    // Catastrophic error - return safe defaults
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
    const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown'

    return NextResponse.json({
      database: {
        name: dbName,
        type: 'postgresql' as const,
        version: 'unknown',
        size: 'unknown',
      },
      tables: [],
      statistics: {
        totalTables: 0,
        totalRows: 0,
        totalSize: 'unknown',
      },
    })
  }
}
