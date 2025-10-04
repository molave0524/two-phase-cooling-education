/**
 * Tests for Guest Conversion API endpoint
 */

import { NextRequest } from 'next/server'
import { POST } from '../convert-guest/route'
import { db } from '@/db'
import { hashPassword } from '@/lib/password'

// Mock dependencies
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}))
jest.mock('@/lib/password')

const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>

describe('/api/account/convert-guest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should return 400 if email already exists', async () => {
      const mockExistingUser = {
        id: 1,
        email: 'existing@example.com',
      }

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockExistingUser]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/account/convert-guest', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'TestPassword123',
          name: 'Test User',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email already registered')
    })

    it('should create account and link orders', async () => {
      // Mock no existing user
      const mockSelectNoUser = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      }

      // Mock insert returns new user with ID
      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1 }]),
      }

      // Mock select for counting orders
      const mockSelectOrders = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      }

      // Mock update for linking orders
      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock)
        .mockReturnValueOnce(mockSelectNoUser)
        .mockReturnValueOnce(mockSelectOrders)
      ;(db.insert as jest.Mock).mockReturnValue(mockInsert)
      ;(db.update as jest.Mock).mockReturnValue(mockUpdate)
      mockHashPassword.mockResolvedValue('hashed_password')

      const request = new NextRequest('http://localhost:3000/api/account/convert-guest', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'TestPassword123',
          name: 'New User',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Account created successfully')
      expect(data.ordersLinked).toBe(2)
      expect(mockHashPassword).toHaveBeenCalledWith('TestPassword123')
    })

    it('should reject weak password', async () => {
      const request = new NextRequest('http://localhost:3000/api/account/convert-guest', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'weak',
          name: 'New User',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should reject invalid email', async () => {
      const request = new NextRequest('http://localhost:3000/api/account/convert-guest', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123',
          name: 'New User',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should reject missing name', async () => {
      const request = new NextRequest('http://localhost:3000/api/account/convert-guest', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'TestPassword123',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})
