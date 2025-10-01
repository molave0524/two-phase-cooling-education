/**
 * API and Network Constants
 * Centralized API endpoints and network-related configuration
 */

// Timing constants (in milliseconds)
export const TIMING = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 500,
  TOAST_DURATION: 3000,
  AUTO_ADVANCE_DELAY: 2000,
  TYPING_SIMULATION_DELAY: 2000,
  REQUEST_TIMEOUT: 30000,
  RETRY_DELAY: 1000,
} as const

// API endpoints
export const API_ENDPOINTS = {
  VIDEOS: '/api/videos',
  CHAT: '/api/chat',
  ANALYTICS: '/api/analytics',
  FEEDBACK: '/api/feedback',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  VIDEO_PROGRESS: 'video_progress',
  CHAT_HISTORY: 'chat_history',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const

// Validation limits
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MAX_MESSAGE_LENGTH: 500,
  MAX_FILE_SIZE_MB: 10,
  MAX_UPLOAD_FILES: 5,
} as const

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully',
  UPLOADED: 'File uploaded successfully',
  DELETED: 'Item deleted successfully',
  UPDATED: 'Item updated successfully',
  SENT: 'Message sent successfully',
} as const

// Application routes
export const ROUTES = {
  HOME: '/',
  VIDEOS: '/videos',
  CHAT: '/chat',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  HELP: '/help',
} as const
