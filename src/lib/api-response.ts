/**
 * Standardized API Response Utilities
 * Provides consistent response formats and error handling across all API routes
 *
 * Security Benefits:
 * - Prevents information leakage through standardized error messages
 * - Ensures consistent HTTP status code usage
 * - Provides type-safe response handling
 * - Includes request ID for error tracking and debugging
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { ZodError } from 'zod'

/**
 * Standard success response structure
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: {
    requestId?: string
    timestamp?: string
    [key: string]: unknown
  }
}

/**
 * Standard error response structure
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
    requestId?: string
    timestamp?: string
  }
}

/**
 * HTTP status codes with semantic meanings
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

/**
 * Error codes for consistent error identification
 */
export const ERROR_CODES = {
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Authentication/Authorization Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Resource Errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business Logic Errors
  INSUFFICIENT_INVENTORY: 'INSUFFICIENT_INVENTORY',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INVALID_STATE: 'INVALID_STATE',

  // External Service Errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_PROVIDER_ERROR: 'PAYMENT_PROVIDER_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Generic Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number
    meta?: Record<string, unknown>
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  }

  return NextResponse.json(response, {
    status: options?.status ?? HTTP_STATUS.OK,
  })
}

/**
 * Create a standardized error response
 */
export function apiError(
  code: string,
  message: string,
  options?: {
    status?: number
    details?: unknown
    logError?: boolean
    error?: unknown
  }
): NextResponse<ApiErrorResponse> {
  const requestId = generateRequestId()
  const timestamp = new Date().toISOString()

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      requestId,
      timestamp,
      ...(options?.details !== undefined && { details: options.details }),
    },
  }

  // Log error if requested
  if (options?.logError) {
    logger.error(`API Error [${code}]: ${message}`, {
      requestId,
      code,
      message,
      details: options?.details,
      error: options?.error,
    })
  }

  return NextResponse.json(response, {
    status: options?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR,
  })
}

/**
 * Handle validation errors (Zod errors)
 */
export function apiValidationError(
  error: ZodError,
  options?: { logError?: boolean }
): NextResponse<ApiErrorResponse> {
  const details = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))

  return apiError(ERROR_CODES.VALIDATION_ERROR, 'Invalid request data', {
    status: HTTP_STATUS.BAD_REQUEST,
    details,
    logError: options?.logError ?? true,
    error,
  })
}

/**
 * Handle "Not Found" errors
 */
export function apiNotFound(
  resource: string,
  options?: { details?: unknown; logError?: boolean }
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.NOT_FOUND, `${resource} not found`, {
    status: HTTP_STATUS.NOT_FOUND,
    details: options?.details,
    logError: options?.logError ?? false,
  })
}

/**
 * Handle unauthorized errors
 */
export function apiUnauthorized(
  message = 'Authentication required',
  options?: { logError?: boolean }
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.UNAUTHORIZED, message, {
    status: HTTP_STATUS.UNAUTHORIZED,
    logError: options?.logError ?? true,
  })
}

/**
 * Handle forbidden errors
 */
export function apiForbidden(
  message = 'You do not have permission to perform this action',
  options?: { logError?: boolean }
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.FORBIDDEN, message, {
    status: HTTP_STATUS.FORBIDDEN,
    logError: options?.logError ?? true,
  })
}

/**
 * Handle rate limit errors
 */
export function apiRateLimitExceeded(
  message = 'Too many requests. Please try again later.',
  options?: { retryAfter?: number; logError?: boolean }
): NextResponse<ApiErrorResponse> {
  const response = apiError(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, {
    status: HTTP_STATUS.TOO_MANY_REQUESTS,
    details: options?.retryAfter ? { retryAfter: options.retryAfter } : undefined,
    logError: options?.logError ?? true,
  })

  // Add Retry-After header if specified
  if (options?.retryAfter) {
    response.headers.set('Retry-After', options.retryAfter.toString())
  }

  return response
}

/**
 * Handle internal server errors
 */
export function apiInternalError(
  message = 'An unexpected error occurred. Please try again later.',
  options?: { error?: unknown; details?: unknown }
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.INTERNAL_ERROR, message, {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details: options?.details,
    logError: true,
    error: options?.error,
  })
}

/**
 * Handle external service errors
 */
export function apiExternalServiceError(
  service: string,
  options?: { error?: unknown; details?: unknown }
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.EXTERNAL_SERVICE_ERROR, `External service error: ${service}`, {
    status: HTTP_STATUS.BAD_GATEWAY,
    details: options?.details,
    logError: true,
    error: options?.error,
  })
}

/**
 * Handle conflict errors (e.g., duplicate resource)
 */
export function apiConflict(
  message: string,
  options?: { details?: unknown; logError?: boolean }
): NextResponse<ApiErrorResponse> {
  return apiError(ERROR_CODES.CONFLICT, message, {
    status: HTTP_STATUS.CONFLICT,
    details: options?.details,
    logError: options?.logError ?? false,
  })
}

/**
 * Type guard to check if a response is a success response
 */
export function isApiSuccessResponse<T>(
  response: ApiSuccessResponse<T> | ApiErrorResponse
): response is ApiSuccessResponse<T> {
  return response.success === true
}

/**
 * Type guard to check if a response is an error response
 */
export function isApiErrorResponse(
  response: ApiSuccessResponse<unknown> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false
}
