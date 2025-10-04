/**
 * Unit tests for password utilities
 */

import { hashPassword, verifyPassword, validatePassword, generateResetToken } from '../password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('WrongPassword456', hash)

      expect(isValid).toBe(false)
    })

    it('should handle empty passwords', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('', hash)

      expect(isValid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should accept a valid password', () => {
      const result = validatePassword('TestPassword123')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Test123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('testpassword123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('TESTPASSWORD123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should reject password without number', () => {
      const result = validatePassword('TestPassword')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should return multiple errors for invalid password', () => {
      const result = validatePassword('test')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('generateResetToken', () => {
    it('should generate a token', () => {
      const token = generateResetToken()

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('should generate unique tokens', () => {
      const token1 = generateResetToken()
      const token2 = generateResetToken()

      expect(token1).not.toBe(token2)
    })

    it('should generate hex-only tokens', () => {
      const token = generateResetToken()

      expect(token).toMatch(/^[0-9a-f]+$/)
    })
  })
})
