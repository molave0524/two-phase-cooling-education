/**
 * Next.js Middleware - CSRF Protection & Route Protection
 * Validates CSRF tokens for state-changing requests
 * Protects authenticated routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { logger } from '@/lib/logger'

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

// Routes that require authentication
const PROTECTED_ROUTES = ['/account']

// Auth routes that should redirect to home if already authenticated
const AUTH_ROUTES = ['/auth/signin', '/auth/signup']

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

  // Skip middleware entirely for NextAuth routes to prevent worker issues
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Get authentication token with error handling
  let token = null
  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || '' })
  } catch (error) {
    logger.warn('Failed to get auth token in middleware', { error })
    // Continue without token - treat as unauthenticated
  }

  // Check if user is trying to access a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (isProtectedRoute && !token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Check if authenticated user is trying to access auth routes
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

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
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))

  if (isProtectedApiRoute) {
    // Get CSRF token from header
    const csrfTokenFromHeader = request.headers.get('x-csrf-token')

    // Get CSRF token from cookie
    const csrfTokenFromCookie = request.cookies.get('csrf-token')?.value ?? null

    // Verify tokens match
    if (!verifyToken(csrfTokenFromHeader, csrfTokenFromCookie)) {
      logger.warn('CSRF token mismatch', { pathname })
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
