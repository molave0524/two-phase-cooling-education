/**
 * CSRF Token API Route
 * Returns the current CSRF token for client-side usage
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get CSRF token from cookie (set by middleware)
  const csrfToken = request.cookies.get('csrf-token')?.value

  if (!csrfToken) {
    return NextResponse.json({ error: 'CSRF token not found' }, { status: 404 })
  }

  return NextResponse.json({
    token: csrfToken,
  })
}
