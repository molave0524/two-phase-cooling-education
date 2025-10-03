/**
 * Order Access Token Utilities
 * Generates secure tokens for guest order access
 */

import crypto from 'crypto'

const SECRET_KEY =
  process.env.ORDER_TOKEN_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'fallback-secret-key-change-in-production'

/**
 * Generate a secure token for order access
 * Token is a hash of: orderId + customer email + secret
 * This allows guests to access their orders without authentication
 */
export function generateOrderToken(orderId: string, customerEmail: string): string {
  const data = `${orderId}:${customerEmail.toLowerCase()}`
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(data)
  return hmac.digest('hex')
}

/**
 * Verify an order access token
 * Returns true if the token matches the expected value
 */
export function verifyOrderToken(orderId: string, customerEmail: string, token: string): boolean {
  const expectedToken = generateOrderToken(orderId, customerEmail)
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
}
