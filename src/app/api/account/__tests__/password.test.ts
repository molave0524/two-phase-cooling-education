/**
 * Tests for Password Change API endpoint
 */

import { NextRequest } from 'next/server'
import { PATCH } from '../password/route'
import { getServerSession } from 'next-auth'
import { db } from '@/db'
import { verifyPassword, hashPassword } from '@/lib/password'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
}))
jest.mock('@/lib/password')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>

describe('/api/account/password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PATCH', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/account/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if current password is incorrect', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        hashedPassword: 'hashed_old_password',
      }

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)
      mockVerifyPassword.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/account/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword123',
        }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Current password is incorrect')
    })

    it('should update password if current password is correct', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        hashedPassword: 'hashed_old_password',
      }

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

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
      mockVerifyPassword.mockResolvedValue(true)
      mockHashPassword.mockResolvedValue('hashed_new_password')

      const request = new NextRequest('http://localhost:3000/api/account/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Password updated successfully')
      expect(mockHashPassword).toHaveBeenCalledWith('NewPassword123')
      expect(mockUpdate.set).toHaveBeenCalledWith({
        hashedPassword: 'hashed_new_password',
        updatedAt: expect.any(Date),
      })
    })

    it('should reject weak new password', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const request = new NextRequest('http://localhost:3000/api/account/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: 'OldPassword123',
          newPassword: 'weak',
        }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})
