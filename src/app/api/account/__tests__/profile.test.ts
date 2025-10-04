/**
 * Tests for Profile API endpoint
 */

import { NextRequest } from 'next/server'
import { GET, PATCH } from '../profile/route'
import { getServerSession } from 'next-auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/account/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/account/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return user profile if authenticated', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        hashedPassword: 'hashed',
        newEmail: null,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      const request = new NextRequest('http://localhost:3000/api/account/profile')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(1)
      expect(data.email).toBe('test@example.com')
      expect(data.name).toBe('Test User')
    })
  })

  describe('PATCH', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should update user profile', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)

      const request = new NextRequest('http://localhost:3000/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name', image: 'https://example.com/image.jpg' }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Profile updated successfully')
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          image: 'https://example.com/image.jpg',
        })
      )
    })

    it('should reject empty name', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const request = new NextRequest('http://localhost:3000/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: '' }),
      })
      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})
