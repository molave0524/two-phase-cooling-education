/**
 * Database Connection Test Endpoint
 * Tests if database is accessible and returns diagnostic info
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        isVercel: process.env.VERCEL === '1',
        nodeEnv: process.env.NODE_ENV,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
      },
      connectionTest: null as any,
      error: null as any,
    }

    // Try to connect and query
    try {
      const { db, products } = await import('@/db')
      const result = await db.select().from(products).limit(1)
      diagnostics.connectionTest = {
        success: true,
        productCount: result.length,
        sampleProduct: result[0]
          ? {
              id: result[0].id,
              name: result[0].name,
              hasImages: !!result[0].images,
            }
          : null,
      }
    } catch (dbError: any) {
      diagnostics.error = {
        message: dbError?.message || 'Unknown database error',
        name: dbError?.name,
        code: dbError?.code,
        stack: dbError?.stack?.split('\n').slice(0, 5),
      }
    }

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error?.message || 'Unknown error',
          name: error?.name,
          stack: error?.stack?.split('\n').slice(0, 5),
        },
      },
      { status: 500 }
    )
  }
}
