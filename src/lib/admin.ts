/**
 * Admin Utilities
 * Functions and utilities for admin role management and authorization
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Session } from 'next-auth'

/**
 * Check if a user is an admin based on their role
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === 'admin'
}

/**
 * Check if a user is a customer (default role)
 */
export function isCustomer(session: Session | null): boolean {
  return session?.user?.role === 'customer'
}

/**
 * Get the current session on the server side
 */
export async function getSession(): Promise<Session | null> {
  return await getServerSession(authOptions)
}

/**
 * Require admin access - throws error if not admin
 * Use this in API routes and server components
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession()

  if (!session?.user) {
    throw new Error('Authentication required')
  }

  if (!isAdmin(session)) {
    throw new Error('Admin access required')
  }

  return session
}

/**
 * Check if the current user has admin access
 * Returns null if not authenticated or not admin
 */
export async function checkAdminAccess(): Promise<Session | null> {
  const session = await getSession()

  if (!session?.user || !isAdmin(session)) {
    return null
  }

  return session
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): 'admin' | 'customer' | null {
  return session?.user?.role || null
}
