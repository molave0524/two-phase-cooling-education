/**
 * Validation utility functions
 * Pure functions for data validation
 */

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Check if string is not empty or only whitespace
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Check if string meets minimum length requirement
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength
}

/**
 * Check if string doesn't exceed maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength
}

/**
 * Check if number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Check if value is a valid positive number
 */
export function isPositiveNumber(value: any): boolean {
  const num = Number(value)
  return !isNaN(num) && isFinite(num) && num > 0
}

/**
 * Validate form data against rules
 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
  message: string
}

export interface ValidationRules {
  [field: string]: ValidationRule[]
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateForm(data: Record<string, any>, rules: ValidationRules): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field]

    for (const rule of fieldRules) {
      // Required check
      if (rule.required && (!value || (typeof value === 'string' && !isNotEmpty(value)))) {
        errors[field] = rule.message
        break
      }

      // Skip other validations if field is empty and not required
      if (!value && !rule.required) continue

      // Min length check
      if (rule.minLength && typeof value === 'string' && !hasMinLength(value, rule.minLength)) {
        errors[field] = rule.message
        break
      }

      // Max length check
      if (rule.maxLength && typeof value === 'string' && !hasMaxLength(value, rule.maxLength)) {
        errors[field] = rule.message
        break
      }

      // Pattern check
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors[field] = rule.message
        break
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors[field] = rule.message
        break
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
