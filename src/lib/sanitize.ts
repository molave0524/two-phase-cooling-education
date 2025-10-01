/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input
 */

// Dynamic import to avoid SSR issues
let DOMPurify: any = null

// Initialize DOMPurify lazily
function getDOMPurify() {
  if (DOMPurify) return DOMPurify

  // Server-side: use a minimal sanitizer
  if (typeof window === 'undefined') {
    DOMPurify = {
      sanitize: (dirty: string) => {
        // Basic server-side sanitization - remove all HTML tags
        return String(dirty).replace(/<[^>]*>/g, '')
      },
    }
  } else {
    // Client-side: use full DOMPurify (will be imported when needed)
    try {
      DOMPurify = require('isomorphic-dompurify')
    } catch {
      // Fallback if import fails
      DOMPurify = {
        sanitize: (dirty: string) => String(dirty).replace(/<[^>]*>/g, ''),
      }
    }
  }

  return DOMPurify
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  const purify = getDOMPurify()

  // Server-side or fallback
  if (typeof window === 'undefined') {
    return purify.sanitize(dirty)
  }

  // Client-side with full DOMPurify
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Sanitize plain text (remove all HTML)
 */
export function sanitizeText(text: string): string {
  const purify = getDOMPurify()

  // Server-side or fallback - already removes all HTML
  if (typeof window === 'undefined') {
    return purify.sanitize(text)
  }

  // Client-side with full DOMPurify
  return purify.sanitize(text, { ALLOWED_TAGS: [] })
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  const cleaned = email.trim().toLowerCase()
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleaned)) {
    throw new Error('Invalid email format')
  }
  return cleaned
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters except + for country code
  return phone.replace(/[^\d+\-() ]/g, '').trim()
}

/**
 * Sanitize address field
 */
export function sanitizeAddress(address: string): string {
  // Remove HTML but allow basic alphanumeric and common address characters
  const cleaned = sanitizeText(address)
  // Remove potentially dangerous characters
  return cleaned.replace(/[<>{}]/g, '').trim()
}

/**
 * Sanitize name (first name, last name, etc.)
 */
export function sanitizeName(name: string): string {
  const cleaned = sanitizeText(name)
  // Only allow letters, spaces, hyphens, and apostrophes
  return cleaned.replace(/[^a-zA-Z\s\-']/g, '').trim()
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol')
    }
    return parsed.toString()
  } catch {
    throw new Error('Invalid URL')
  }
}

/**
 * Sanitize order customer data
 */
export function sanitizeCustomerData(data: {
  firstName: string
  lastName: string
  email: string
  phone?: string | undefined
  company?: string | undefined
}): {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
} {
  const result: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
  } = {
    firstName: sanitizeName(data.firstName),
    lastName: sanitizeName(data.lastName),
    email: sanitizeEmail(data.email),
  }

  if (data.phone !== undefined) {
    result.phone = sanitizePhone(data.phone)
  }

  if (data.company !== undefined) {
    result.company = sanitizeText(data.company)
  }

  return result
}

/**
 * Sanitize shipping address data
 */
export function sanitizeAddressData(data: {
  addressLine1: string
  addressLine2?: string | undefined
  city: string
  state: string
  zipCode: string
  country: string
}): {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
} {
  const result: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    zipCode: string
    country: string
  } = {
    addressLine1: sanitizeAddress(data.addressLine1),
    city: sanitizeAddress(data.city),
    state: sanitizeAddress(data.state),
    zipCode: sanitizeText(data.zipCode).replace(/[^a-zA-Z0-9\s-]/g, ''),
    country: sanitizeAddress(data.country),
  }

  if (data.addressLine2 !== undefined) {
    result.addressLine2 = sanitizeAddress(data.addressLine2)
  }

  return result
}

/**
 * Sanitize AI chat message
 */
export function sanitizeChatMessage(message: string): string {
  // Remove HTML but preserve newlines
  const cleaned = sanitizeText(message)
  // Limit length to prevent DoS
  const maxLength = 10000
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength)
  }
  return cleaned.trim()
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePaginationParams(params: { page?: number; limit?: number }) {
  const page = Math.max(1, Math.floor(Number(params.page) || 1))
  const limit = Math.min(100, Math.max(1, Math.floor(Number(params.limit) || 10)))

  if (isNaN(page) || isNaN(limit)) {
    throw new Error('Invalid pagination parameters')
  }

  return { page, limit }
}
