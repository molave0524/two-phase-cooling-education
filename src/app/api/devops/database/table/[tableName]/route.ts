import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

interface FieldInfo {
  name: string
  dataType: string
  nonNullCount: number
  distinctCount: number
  isNullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  isUnique: boolean
}

interface TableDetailsResponse {
  tableName: string
  fields: FieldInfo[]
}

export async function GET(_request: Request, { params }: { params: { tableName: string } }) {
  try {
    const tableName = params.tableName

    // Get column information from information_schema
    const columnsResult = await db.execute(sql`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = ${tableName}
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    const columns = Array.isArray(columnsResult) ? columnsResult : columnsResult.rows || []

    // Get primary key columns
    const pkResult = await db.execute(sql`
      SELECT a.attname as column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ${tableName}::regclass
        AND i.indisprimary
    `)
    const pkRows = Array.isArray(pkResult) ? pkResult : pkResult.rows || []
    const pkColumns = new Set(pkRows.map((row: any) => row.column_name))

    // Get foreign key columns
    const fkResult = await db.execute(sql`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ${tableName}
        AND tc.table_schema = 'public'
    `)
    const fkRows = Array.isArray(fkResult) ? fkResult : fkResult.rows || []
    const fkColumns = new Set(fkRows.map((row: any) => row.column_name))

    // Get unique key columns (excluding primary keys)
    const uniqueResult = await db.execute(sql`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_name = ${tableName}
        AND tc.table_schema = 'public'
    `)
    const uniqueRows = Array.isArray(uniqueResult) ? uniqueResult : uniqueResult.rows || []
    const uniqueColumns = new Set(uniqueRows.map((row: any) => row.column_name))

    // Get non-null and distinct counts for each column
    const fields = await Promise.all(
      columns.map(async (col: any) => {
        try {
          // Get non-null count and distinct count
          const statsResult = await db.execute(
            sql.raw(`
              SELECT
                COUNT(CASE WHEN "${col.column_name}" IS NOT NULL THEN 1 END)::integer as non_null_count,
                COUNT(DISTINCT "${col.column_name}")::integer as distinct_count
              FROM "${tableName}"
            `)
          )

          const statsRows = Array.isArray(statsResult) ? statsResult : statsResult.rows || []
          const stats = statsRows[0] || { non_null_count: 0, distinct_count: 0 }

          const isPK = pkColumns.has(col.column_name)
          const isUnique = uniqueColumns.has(col.column_name) && !isPK

          return {
            name: col.column_name,
            dataType: col.data_type,
            nonNullCount: stats.non_null_count || 0,
            distinctCount: stats.distinct_count || 0,
            isNullable: col.is_nullable === 'YES',
            isPrimaryKey: isPK,
            isForeignKey: fkColumns.has(col.column_name),
            isUnique,
          }
        } catch (err) {
          const isPK = pkColumns.has(col.column_name)
          const isUnique = uniqueColumns.has(col.column_name) && !isPK

          return {
            name: col.column_name,
            dataType: col.data_type,
            nonNullCount: 0,
            distinctCount: 0,
            isNullable: col.is_nullable === 'YES',
            isPrimaryKey: isPK,
            isForeignKey: fkColumns.has(col.column_name),
            isUnique,
          }
        }
      })
    )

    const response: TableDetailsResponse = {
      tableName,
      fields,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch table details' },
      { status: 500 }
    )
  }
}
