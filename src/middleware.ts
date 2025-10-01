/**
 * Next.js Middleware - CSRF Protection
 * Validates CSRF tokens for state-changing requests
 */

import { NextRequest, NextResponse } from 'next/server'

// Routes that require CSRF protection (state-changing operations)
const PROTECTED_API_ROUTES = [
  '/api/orders',
  '/api/checkout/create-payment-intent',
  '/api/checkout/confirm',
  '/api/ai/chat',
]

// Routes that are excluded from CSRF protection (webhooks, etc.)
const CSRF_EXEMPT_ROUTES = [
  '/api/webhooks', // Stripe and other webhooks use their own signature verification
]

// Generate a random CSRF token
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Verify CSRF token
function verifyToken(token: string | null, cookieToken: string | null): boolean {
  if (!token || !cookieToken) return false
  return token === cookieToken
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip CSRF for exempt routes (webhooks with their own verification)
  const isExemptRoute = CSRF_EXEMPT_ROUTES.some(route => pathname.startsWith(route))
  if (isExemptRoute) {
    return NextResponse.next()
  }

  // For all requests, ensure CSRF cookie exists
  const existingCsrfToken = request.cookies.get('csrf-token')?.value
  let response = NextResponse.next()

  if (!existingCsrfToken) {
    const token = generateToken()
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  // Skip CSRF validation for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return response
  }

  // Check if this is a protected API route
  const isProtectedRoute = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Get CSRF token from header
    const csrfTokenFromHeader = request.headers.get('x-csrf-token')

    // Get CSRF token from cookie
    const csrfTokenFromCookie = request.cookies.get('csrf-token')?.value ?? null

    // Verify tokens match
    if (!verifyToken(csrfTokenFromHeader, csrfTokenFromCookie)) {
      console.warn(`[CSRF] Token mismatch for ${pathname}`)
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }
  }

  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all pages (to set CSRF cookie)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
