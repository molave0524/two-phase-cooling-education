/**
 * Debug endpoint to verify environment variables
 * REMOVE IN PRODUCTION - FOR DEBUGGING ONLY
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Only allow in non-production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set ✓' : 'Not set ✗',
    NEXTAUTH_URL_value: process.env.NEXTAUTH_URL || 'empty',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      ? `Set ✓ (${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...)`
      : 'Not set ✗',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set ✓' : 'Not set ✗',
    NODE_ENV: process.env.NODE_ENV,
  })
}
