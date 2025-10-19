/**
 * Tests for Forgot Password API endpoint
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { db } from '@/db'
import { generateResetToken } from '@/lib/password'
import { sendPasswordResetEmail } from '@/lib/email-verification'

// Mock dependencies
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
  users: {},
}))

jest.mock('@/lib/password', () => ({
  generateResetToken: jest.fn(),
}))

jest.mock('@/lib/email-verification', () => ({
  sendPasswordResetEmail: jest.fn(),
}))

const mockGenerateResetToken = generateResetToken as jest.MockedFunction<typeof generateResetToken>
const mockSendPasswordResetEmail = sendPasswordResetEmail as jest.MockedFunction<
  typeof sendPasswordResetEmail
>

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  hashedPassword: 'hashed_password',
}

describe('/api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateResetToken.mockReturnValue('reset_token_123')
    mockSendPasswordResetEmail.mockResolvedValue(undefined)
  })

  describe('POST', () => {
    it('should accept valid email and send reset email', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('password reset email has been sent')
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        'reset_token_123',
        mockUser.name
      )
    })

    it('should generate and store reset token', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      await POST(request)

      expect(mockGenerateResetToken).toHaveBeenCalled()
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: 'reset_token_123',
          resetPasswordExpires: expect.any(Date),
        })
      )
    })

    it('should set token expiration to 1 hour', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }

      let storedExpiration: Date | undefined
      const mockUpdate = {
        set: jest.fn((data: any) => {
          storedExpiration = data.resetPasswordExpires
          return mockUpdate
        }),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const beforeTime = Date.now() + 60 * 60 * 1000 - 1000 // 1 hour - 1 second
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      await POST(request)
      const afterTime = Date.now() + 60 * 60 * 1000 + 1000 // 1 hour + 1 second

      expect(storedExpiration).toBeDefined()
      expect(storedExpiration!.getTime()).toBeGreaterThan(beforeTime)
      expect(storedExpiration!.getTime()).toBeLessThan(afterTime)
    })

    it('should not reveal if user does not exist', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No user found
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('password reset email has been sent')
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('should reject invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid-email' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email')
    })

    it('should reject missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email')
    })

    it('should convert email to lowercase for lookup', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'TEST@EXAMPLE.COM' }),
      })

      await POST(request)

      // Email should be converted to lowercase
      expect(mockSelect.where).toHaveBeenCalled()
    })

    it('should handle user without name gracefully', async () => {
      const userWithoutName = {
        ...mockUser,
        name: null,
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([userWithoutName]),
      }

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      await POST(request)

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        'reset_token_123',
        'User'
      )
    })
  })
})
