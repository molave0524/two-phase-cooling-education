import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!dbUrl) {
    return NextResponse.json({ error: 'No DATABASE_URL found' }, { status: 500 })
  }

  const pool = new Pool({ connectionString: dbUrl })

  try {
    // Test direct query
    const countResult = await pool.query('SELECT COUNT(*) FROM products')
    const sampleResult = await pool.query('SELECT id, name, slug, sku FROM products LIMIT 5')

    return NextResponse.json({
      totalProducts: countResult.rows[0].count,
      sampleProducts: sampleResult.rows,
      connectionInfo: {
        host: new URL(dbUrl).hostname,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  } finally {
    await pool.end()
  }
}
