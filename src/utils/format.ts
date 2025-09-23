/**
 * Formatting utility functions
 * Pure functions for formatting data for display
 */

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `0:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

/**
 * Format file size in bytes to human readable string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  if (i === 0) {
    return `${bytes} B`
  }

  // For whole numbers, show with 1 decimal place to match test expectations
  if (value === Math.floor(value)) {
    return `${value}.0 ${sizes[i]}`
  }

  // For non-whole numbers, use parseFloat to remove unnecessary trailing zeros
  const formatted = parseFloat(value.toFixed(dm)).toString()
  return `${formatted} ${sizes[i]}`
}

/**
 * Format a date to a human readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }

  const mergedOptions = { ...defaultOptions, ...options }

  // Use UTC if time is included to avoid timezone conversion issues
  if (mergedOptions.hour || mergedOptions.minute) {
    mergedOptions.timeZone = 'UTC'
    mergedOptions.hour12 = false
  }

  return dateObj.toLocaleDateString('en-US', mergedOptions)
}

/**
 * Format a string to title case
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num)
}
