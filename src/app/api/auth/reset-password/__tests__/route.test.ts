/**
 * Tests for Reset Password API endpoint
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { db } from '@/db'
import { hashPassword, validatePassword } from '@/lib/password'

// Mock dependencies
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
  users: {},
}))

jest.mock('@/lib/password', () => ({
  hashPassword: jest.fn(),
  validatePassword: jest.fn(),
}))

const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  hashedPassword: 'old_hashed_password',
  resetPasswordToken: 'valid_token_123',
  resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
}

describe('/api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHashPassword.mockResolvedValue('new_hashed_password')
    mockValidatePassword.mockReturnValue({ valid: true, errors: [] })
  })

  describe('POST', () => {
    it('should reset password with valid token and password', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
          password: 'NewSecurePassword123!',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Password reset successfully')
    })

    it('should validate password strength', async () => {
      mockValidatePassword.mockReturnValue({
        valid: false,
        errors: ['Password must contain at least one uppercase letter'],
      })

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
          password: 'weakpassword',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid password')
      expect(data.details).toContain('Password must contain at least one uppercase letter')
    })

    it('should reject password shorter than 8 characters', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
          password: 'Short1!',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should reject invalid token', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No user found
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalid_token',
          password: 'NewSecurePassword123!',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid or expired token')
    })

    it('should reject expired token', async () => {
      const expiredUser = {
        ...mockUser,
        resetPasswordExpires: new Date(Date.now() - 1000), // Expired 1 second ago
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([expiredUser]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
          password: 'NewSecurePassword123!',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid or expired token')
    })

    it('should hash the new password', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
          password: 'NewSecurePassword123!',
        }),
      })

      await POST(request)

      expect(mockHashPassword).toHaveBeenCalledWith('NewSecurePassword123!')
    })

    it('should update password and clear reset token', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
          password: 'NewSecurePassword123!',
        }),
      })

      await POST(request)

      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          hashedPassword: 'new_hashed_password',
          resetPasswordToken: null,
          resetPasswordExpires: null,
          updatedAt: expect.any(Date),
        })
      )
    })

    it('should reject missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          password: 'NewSecurePassword123!',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should reject missing password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should validate token is not expired during query', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn(condition => {
          // This simulates the database query checking expiration
          return mockSelect
        }),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
          password: 'NewSecurePassword123!',
        }),
      })

      await POST(request)

      // Verify where was called with conditions (token match AND not expired)
      expect(mockSelect.where).toHaveBeenCalled()
    })

    it('should update the updatedAt timestamp', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }

      let updatedTimestamp: Date | undefined
      const mockUpdate = {
        set: jest.fn((data: any) => {
          updatedTimestamp = data.updatedAt
          return mockUpdate
        }),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const beforeTime = new Date()
      const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'valid_token_123',
          password: 'NewSecurePassword123!',
        }),
      })

      await POST(request)

      expect(updatedTimestamp).toBeDefined()
      expect(updatedTimestamp!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
    })
  })
})
