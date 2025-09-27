/**
 * Application constants
 * Centralized constants to avoid magic numbers and strings
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

// UI constants
export const UI = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,
  MAX_CONTENT_WIDTH: 1200,
  HEADER_HEIGHT: 64,
  SIDEBAR_WIDTH: 256,
} as const

// Video player constants
export const VIDEO_PLAYER = {
  DEFAULT_VOLUME: 0.8,
  SEEK_STEP: 10, // seconds
  VOLUME_STEP: 0.1,
  PROGRESS_UPDATE_INTERVAL: 1000, // milliseconds
  CONTROLS_HIDE_DELAY: 3000, // milliseconds
} as const

// Performance metrics
export const METRICS = {
  MAX_TEMPERATURE: 100, // Celsius
  MIN_TEMPERATURE: 0,
  MAX_EFFICIENCY: 100, // percentage
  MIN_EFFICIENCY: 0,
  EXCELLENT_SCORE: 90,
  GOOD_SCORE: 70,
  POOR_SCORE: 50,
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

// Company information from environment variables
export const COMPANY_INFO = {
  NAME: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Thermal Education Center',
  EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@example.com',
  PHONE: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+1 (555) 123-4567',
  DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || 'example.com',
} as const

// Social media configuration
export const SOCIAL_MEDIA = {
  TWITTER: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@company',
  YOUTUBE: process.env.NEXT_PUBLIC_YOUTUBE_HANDLE || 'company',
} as const

// Product configuration
export const PRODUCT_CONFIG = {
  DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD',
  IMAGE_SERVICE: process.env.NEXT_PUBLIC_IMAGE_PLACEHOLDER_SERVICE || 'https://picsum.photos',
  CDN_URL: process.env.NEXT_PUBLIC_PRODUCT_IMAGE_CDN || '',
} as const

// Product pricing (server-side values for security)
export const PRICING = {
  PRO_CASE:
    typeof process.env.PRODUCT_PRO_PRICE !== 'undefined'
      ? parseFloat(process.env.PRODUCT_PRO_PRICE)
      : 1299.99,
  COMPACT_CASE:
    typeof process.env.PRODUCT_COMPACT_PRICE !== 'undefined'
      ? parseFloat(process.env.PRODUCT_COMPACT_PRICE)
      : 899.99,
} as const

// Technical specifications
export const TECHNICAL_SPECS = {
  GWP_RATING:
    typeof process.env.PRODUCT_GWP_RATING !== 'undefined'
      ? parseInt(process.env.PRODUCT_GWP_RATING)
      : 20,
  ODP_RATING:
    typeof process.env.PRODUCT_ODP_RATING !== 'undefined'
      ? parseInt(process.env.PRODUCT_ODP_RATING)
      : 0,
  COOLING_EFFICIENCY:
    typeof process.env.PRODUCT_COOLING_EFFICIENCY !== 'undefined'
      ? parseInt(process.env.PRODUCT_COOLING_EFFICIENCY)
      : 97,
  NOISE_LEVEL:
    typeof process.env.PRODUCT_NOISE_LEVEL !== 'undefined'
      ? parseInt(process.env.PRODUCT_NOISE_LEVEL)
      : 18,
} as const

// Cart and shipping configuration
export const CART_CONFIG = {
  FREE_SHIPPING_THRESHOLD:
    typeof process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD !== 'undefined'
      ? parseFloat(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD)
      : 500,
  TAX_RATE:
    typeof process.env.NEXT_PUBLIC_TAX_RATE !== 'undefined'
      ? parseFloat(process.env.NEXT_PUBLIC_TAX_RATE)
      : 0.08,
  MAX_QUANTITY_PER_ITEM:
    typeof process.env.NEXT_PUBLIC_MAX_QUANTITY_PER_ITEM !== 'undefined'
      ? parseInt(process.env.NEXT_PUBLIC_MAX_QUANTITY_PER_ITEM)
      : 10,
  LOW_STOCK_THRESHOLD:
    typeof process.env.NEXT_PUBLIC_LOW_STOCK_THRESHOLD !== 'undefined'
      ? parseInt(process.env.NEXT_PUBLIC_LOW_STOCK_THRESHOLD)
      : 5,
} as const
