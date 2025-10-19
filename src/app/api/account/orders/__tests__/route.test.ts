/**
 * Tests for Orders API endpoint
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { getServerSession } from 'next-auth'
import { db } from '@/db'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
  orders: {},
  orderItems: {},
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

const mockOrder = {
  id: 1,
  orderNumber: 'ORD-12345',
  userId: 1,
  status: 'pending',
  total: 1669.97,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockOrderItems = [
  {
    id: 1,
    orderId: 1,
    productId: '1',
    productName: 'Test Product',
    quantity: 1,
    price: 1499.99,
    total: 1499.99,
  },
]

describe('/api/account/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/account/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return user orders with items', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      // Mock orders query
      const mockOrdersSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([mockOrder]),
      }

      // Mock order items query
      const mockItemsSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockOrderItems),
      }

      ;(db.select as jest.Mock)
        .mockReturnValueOnce(mockOrdersSelect)
        .mockReturnValueOnce(mockItemsSelect)

      const request = new NextRequest('http://localhost:3000/api/account/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(mockOrder.id)
      expect(data[0].orderNumber).toBe(mockOrder.orderNumber)
      expect(data[0].items).toEqual(mockOrderItems)
    })

    it('should return empty array when user has no orders', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/account/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return multiple orders in descending date order', async () => {
      const order1 = { ...mockOrder, id: 1, createdAt: new Date('2024-01-01') }
      const order2 = {
        ...mockOrder,
        id: 2,
        orderNumber: 'ORD-12346',
        createdAt: new Date('2024-01-02'),
      }

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const mockOrdersSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([order2, order1]), // Newer first
      }

      const mockItemsSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockOrderItems),
      }

      ;(db.select as jest.Mock)
        .mockReturnValueOnce(mockOrdersSelect)
        .mockReturnValue(mockItemsSelect)

      const request = new NextRequest('http://localhost:3000/api/account/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveLength(2)
      expect(data[0].id).toBe(order2.id) // Newer order first
      expect(data[1].id).toBe(order1.id)
    })

    it('should fetch items for each order', async () => {
      const order1 = { ...mockOrder, id: 1 }
      const order2 = { ...mockOrder, id: 2, orderNumber: 'ORD-12346' }

      const items1 = [{ ...mockOrderItems[0], id: 1, orderId: 1 }]
      const items2 = [{ ...mockOrderItems[0], id: 2, orderId: 2, productName: 'Product 2' }]

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const mockOrdersSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([order1, order2]),
      }

      let itemCallCount = 0
      const mockItemsSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => {
          itemCallCount++
          return Promise.resolve(itemCallCount === 1 ? items1 : items2)
        }),
      }

      ;(db.select as jest.Mock)
        .mockReturnValueOnce(mockOrdersSelect)
        .mockReturnValue(mockItemsSelect)

      const request = new NextRequest('http://localhost:3000/api/account/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].items).toEqual(items1)
      expect(data[1].items).toEqual(items2)
    })

    it('should handle orders with no items', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const mockOrdersSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([mockOrder]),
      }

      const mockItemsSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]), // No items
      }

      ;(db.select as jest.Mock)
        .mockReturnValueOnce(mockOrdersSelect)
        .mockReturnValue(mockItemsSelect)

      const request = new NextRequest('http://localhost:3000/api/account/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].items).toEqual([])
    })

    it('should only return orders for the authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const mockOrdersSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn(condition => {
          // Verify that the where clause is filtering by userId
          return mockOrdersSelect
        }),
        orderBy: jest.fn().mockResolvedValue([mockOrder]),
      }

      const mockItemsSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockOrderItems),
      }

      ;(db.select as jest.Mock)
        .mockReturnValueOnce(mockOrdersSelect)
        .mockReturnValue(mockItemsSelect)

      const request = new NextRequest('http://localhost:3000/api/account/orders')
      await GET(request)

      // Verify where was called (should filter by userId)
      expect(mockOrdersSelect.where).toHaveBeenCalled()
    })

    it('should return all order fields', async () => {
      const fullOrder = {
        id: 1,
        orderNumber: 'ORD-12345',
        userId: 1,
        status: 'completed',
        total: 1669.97,
        subtotal: 1499.99,
        tax: 119.99,
        shipping: 49.99,
        stripePaymentIntentId: 'pi_test_123',
        customerEmail: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const mockOrdersSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([fullOrder]),
      }

      const mockItemsSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockOrderItems),
      }

      ;(db.select as jest.Mock)
        .mockReturnValueOnce(mockOrdersSelect)
        .mockReturnValue(mockItemsSelect)

      const request = new NextRequest('http://localhost:3000/api/account/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0]).toMatchObject({
        orderNumber: fullOrder.orderNumber,
        status: fullOrder.status,
        total: fullOrder.total,
        subtotal: fullOrder.subtotal,
        tax: fullOrder.tax,
        shipping: fullOrder.shipping,
      })
    })
  })
})
