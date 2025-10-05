/**
 * SKU Utilities
 *
 * SKU Format: XXX-XXXX-XXX-VXX (16 characters)
 * Example: TPC-PUMP-A01-V01
 *
 * Structure:
 * - PREFIX: 3 chars (TPC)
 * - CATEGORY: 4 chars (PUMP, MOTR, RADI, CLNT)
 * - PRODUCT_CODE: 3 chars (A01, M01, R02)
 * - VERSION: 3 chars (V01)
 */

export interface SKUComponents {
  prefix: string      // 3 chars: TPC
  category: string    // 4 chars: PUMP, MOTR, RADI, CLNT
  productCode: string // 3 chars: A01, M01, R02
  version: number     // 2 digits: 01, 02, etc.
}

export interface SKUGenerationOptions {
  prefix?: string
  category: string
  productCode: string
  version?: number
}

/**
 * Generate SKU from components
 */
export function generateSKU(options: SKUGenerationOptions): string {
  const {
    prefix = 'TPC',
    category,
    productCode,
    version = 1
  } = options

  // Validate lengths
  if (prefix.length !== 3) {
    throw new Error(`SKU prefix must be 3 characters, got: ${prefix}`)
  }
  if (category.length !== 4) {
    throw new Error(`SKU category must be 4 characters, got: ${category}`)
  }
  if (productCode.length !== 3) {
    throw new Error(`SKU product code must be 3 characters, got: ${productCode}`)
  }

  const versionStr = `V${version.toString().padStart(2, '0')}`
  return `${prefix}-${category}-${productCode}-${versionStr}`
}

/**
 * Parse SKU into components
 */
export function parseSKU(sku: string): SKUComponents {
  const pattern = /^([A-Z]{3})-([A-Z]{4})-([A-Z0-9]{3})-V(\d{2})$/
  const match = sku.match(pattern)

  if (!match) {
    throw new Error(`Invalid SKU format: ${sku}. Expected format: XXX-XXXX-XXX-VXX`)
  }

  return {
    prefix: match[1],
    category: match[2],
    productCode: match[3],
    version: parseInt(match[4], 10)
  }
}

/**
 * Increment SKU version
 */
export function incrementVersion(currentSKU: string): string {
  const components = parseSKU(currentSKU)
  return generateSKU({
    prefix: components.prefix,
    category: components.category,
    productCode: components.productCode,
    version: components.version + 1
  })
}

/**
 * Get base SKU (without version)
 */
export function getBaseSKU(sku: string): string {
  const components = parseSKU(sku)
  return `${components.prefix}-${components.category}-${components.productCode}`
}

/**
 * Check if two SKUs are versions of the same product
 */
export function isSameProduct(sku1: string, sku2: string): boolean {
  try {
    return getBaseSKU(sku1) === getBaseSKU(sku2)
  } catch {
    return false
  }
}

/**
 * Validate SKU format
 */
export function isValidSKU(sku: string): boolean {
  try {
    parseSKU(sku)
    return true
  } catch {
    return false
  }
}

/**
 * Get SKU version string (e.g., "V01")
 */
export function getVersionString(sku: string): string {
  const components = parseSKU(sku)
  return `V${components.version.toString().padStart(2, '0')}`
}

/**
 * Get SKU version number
 */
export function getVersionNumber(sku: string): number {
  const components = parseSKU(sku)
  return components.version
}
