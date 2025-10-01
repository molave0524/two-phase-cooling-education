/**
 * CSRF-Protected API Client
 * Automatically includes CSRF tokens in API requests
 */

// Cache for CSRF token
let csrfToken: string | null = null

/**
 * Fetch CSRF token from server
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken

  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token')
    }

    const data = await response.json()
    csrfToken = data.token
    return csrfToken
  } catch (error) {
    console.error('[CSRF] Failed to get token:', error)
    throw error
  }
}

/**
 * Fetch wrapper with automatic CSRF protection
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET'

  // For state-changing methods, include CSRF token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const token = await getCsrfToken()

      options.headers = {
        ...options.headers,
        'x-csrf-token': token,
      }
    } catch (error) {
      console.error('[CSRF] Failed to add token to request:', error)
    }
  }

  // Always include credentials for cookie handling
  options.credentials = 'include'

  return fetch(url, options)
}

/**
 * Clear cached CSRF token (useful after logout or token expiry)
 */
export function clearCsrfToken() {
  csrfToken = null
}
