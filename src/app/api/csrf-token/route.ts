/**
 * CSRF Token API Route
 * Returns the current CSRF token for client-side usage
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiNotFound } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  // Get CSRF token from cookie (set by middleware)
  const csrfToken = request.cookies.get('csrf-token')?.value

  if (!csrfToken) {
    return apiNotFound('CSRF token')
  }

  return apiSuccess({
    token: csrfToken,
  })
}
