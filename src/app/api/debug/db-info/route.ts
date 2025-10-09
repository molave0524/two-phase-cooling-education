import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!dbUrl) {
    return NextResponse.json({ error: 'No DATABASE_URL found' }, { status: 500 })
  }

  // Parse the URL to safely show connection info
  try {
    const url = new URL(dbUrl)

    return NextResponse.json({
      host: url.hostname,
      database: url.pathname.substring(1),
      port: url.port || '5432',
      username: url.username,
      hasPassword: !!url.password,
      sslMode: url.searchParams.get('sslmode'),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid DATABASE_URL format' }, { status: 500 })
  }
}
