/**
 * Common TypeScript type definitions
 * Shared types used across multiple components
 */

// Common component props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Loading states
export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

// API response wrapper
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

// Form validation states
export interface FormValidation {
  isValid: boolean
  errors: Record<string, string>
  touched: Record<string, boolean>
}

// Filter states
export interface FilterState {
  category?: string
  difficulty?: string
  searchTerm?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Pagination
export interface PaginationState {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
}

// Modal state
export interface ModalState {
  isOpen: boolean
  title?: string
  content?: React.ReactNode
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}
