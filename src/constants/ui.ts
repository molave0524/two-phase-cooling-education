/**
 * UI and Layout Constants
 * Centralized UI-related constants for consistent theming and layout
 */

// UI Breakpoints and Layout
export const UI = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,
  MAX_CONTENT_WIDTH: 1200,
  HEADER_HEIGHT: 60,
  SIDEBAR_WIDTH: 256,
} as const

// Dimension Constants (commonly used sizes)
export const DIMENSIONS = {
  ICON_SM: 20,
  ICON_MD: 32,
  ICON_LG: 40,
  BUTTON_HEIGHT: 40,
  BUTTON_MIN_WIDTH: 80,
  CART_BADGE_SIZE: 18,
  MENU_MAX_WIDTH: 300,
} as const

// Z-Index Constants
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 5000,
  HEADER: 9999,
  MOBILE_MENU_OVERLAY: 99999,
  MOBILE_MENU_PANEL: 100000,
} as const

// Border Radius Constants (in pixels)
export const BORDER_RADIUS = {
  SM: 4,
  MD: 6,
  LG: 8,
  XL: 12,
} as const

// Animation Duration Constants (in milliseconds)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  VERY_SLOW: 500,
} as const

// Cart Badge Constants
export const CART_BADGE = {
  MAX_DISPLAY_COUNT: 99,
  BADGE_SIZE: 18,
  BADGE_FONT_SIZE: 11,
} as const
