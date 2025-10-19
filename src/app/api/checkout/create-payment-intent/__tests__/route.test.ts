/**
 * Tests for Checkout Payment Intent API endpoint
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { getServerSession } from 'next-auth'
import { createPaymentIntent, createCustomer } from '@/lib/stripe'
import { createOrder, validateOrderInventory, reserveInventory } from '@/lib/orders'
import { db } from '@/db'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/stripe')
jest.mock('@/lib/orders')
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  orders: {},
  addresses: {},
}))
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))
jest.mock('@/lib/with-rate-limit', () => ({
  withRateLimit: jest.fn((_config, handler) => handler),
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockCreatePaymentIntent = createPaymentIntent as jest.MockedFunction<
  typeof createPaymentIntent
>
const mockCreateCustomer = createCustomer as jest.MockedFunction<typeof createCustomer>
const mockCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>
const mockValidateOrderInventory = validateOrderInventory as jest.MockedFunction<
  typeof validateOrderInventory
>
const mockReserveInventory = reserveInventory as jest.MockedFunction<typeof reserveInventory>

const validCheckoutData = {
  customer: {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-1234',
  },
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'US',
  },
  order: {
    items: [
      {
        productId: '1',
        quantity: 1,
        price: 1499.99,
      },
    ],
    totals: {
      subtotal: 1499.99,
      tax: 119.99,
      taxRate: 0.08,
      shipping: 49.99,
      shippingMethod: 'standard',
      discount: 0,
      total: 1669.97,
    },
  },
}

const mockOrder = {
  id: '1',
  orderNumber: 'ORD-12345',
  items: validCheckoutData.order.items,
}

const mockPaymentIntent = {
  id: 'pi_test_123',
  client_secret: 'pi_test_123_secret_456',
}

const mockStripeCustomer = {
  id: 'cus_test_123',
  email: validCheckoutData.customer.email,
}

describe('/api/checkout/create-payment-intent', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default successful mocks
    mockGetServerSession.mockResolvedValue(null)
    mockValidateOrderInventory.mockResolvedValue({ valid: true, errors: [] })
    mockCreateCustomer.mockResolvedValue(mockStripeCustomer as any)
    mockCreateOrder.mockResolvedValue(mockOrder as any)
    mockReserveInventory.mockResolvedValue(undefined)
    mockCreatePaymentIntent.mockResolvedValue(mockPaymentIntent as any)

    // Mock database operations
    ;(db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    })
    ;(db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockResolvedValue([]),
    })
    ;(db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    })
  })

  describe('POST', () => {
    it('should create payment intent with valid guest checkout data', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.clientSecret).toBe(mockPaymentIntent.client_secret)
      expect(data.data.orderId).toBe(mockOrder.id)
      expect(data.data.orderNumber).toBe(mockOrder.orderNumber)
    })

    it('should create payment intent for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
        })
      )
    })

    it('should validate inventory before creating payment intent', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      await POST(request)

      expect(mockValidateOrderInventory).toHaveBeenCalledWith(validCheckoutData.order.items)
    })

    it('should return error when inventory validation fails', async () => {
      mockValidateOrderInventory.mockResolvedValue({
        valid: false,
        errors: [{ productId: '1', message: 'Insufficient stock' }],
      })

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Inventory validation failed')
    })

    it('should reserve inventory after order creation', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      await POST(request)

      expect(mockReserveInventory).toHaveBeenCalledWith(mockOrder.items)
    })

    it('should create Stripe customer with correct data', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      await POST(request)

      expect(mockCreateCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validCheckoutData.customer.email,
          name: `${validCheckoutData.customer.firstName} ${validCheckoutData.customer.lastName}`,
          phone: validCheckoutData.customer.phone,
          address: expect.objectContaining({
            line1: validCheckoutData.shippingAddress.addressLine1,
            city: validCheckoutData.shippingAddress.city,
            state: validCheckoutData.shippingAddress.state,
            postal_code: validCheckoutData.shippingAddress.zipCode,
          }),
        })
      )
    })

    it('should create payment intent with correct amount in cents', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      await POST(request)

      expect(mockCreatePaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: Math.round(validCheckoutData.order.totals.total * 100),
          currency: 'usd',
        })
      )
    })

    it('should return validation error for missing required fields', async () => {
      const invalidData = {
        customer: {
          email: 'invalid-email', // Invalid email
        },
      }

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return error when cart is empty', async () => {
      const emptyCartData = {
        ...validCheckoutData,
        order: {
          items: [],
          totals: validCheckoutData.order.totals,
        },
      }

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(emptyCartData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Cart is empty')
    })

    it('should return error when totals are missing', async () => {
      const noTotalsData = {
        ...validCheckoutData,
        order: {
          items: validCheckoutData.order.items,
        },
      }

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(noTotalsData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('totals are missing')
    })

    it('should validate ZIP code format', async () => {
      const invalidZipData = {
        ...validCheckoutData,
        shippingAddress: {
          ...validCheckoutData.shippingAddress,
          zipCode: 'INVALID',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(invalidZipData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should accept valid 5-digit ZIP code', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should accept valid ZIP+4 format', async () => {
      const zip4Data = {
        ...validCheckoutData,
        shippingAddress: {
          ...validCheckoutData.shippingAddress,
          zipCode: '94102-1234',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(zip4Data),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should save shipping address for authenticated users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      await POST(request)

      expect(db.insert).toHaveBeenCalled()
    })

    it('should not duplicate existing addresses for authenticated users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        expires: '2024-12-31',
      })

      // Mock existing address
      ;(db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ id: 1, address1: '123 Main St' }]),
      })

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      await POST(request)

      expect(db.insert).not.toHaveBeenCalled()
    })

    it('should handle Stripe customer creation failure gracefully', async () => {
      mockCreateCustomer.mockRejectedValue(new Error('Stripe API error'))

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      const response = await POST(request)

      // Should still succeed as guest payment
      expect(response.status).toBe(200)
      expect(mockCreatePaymentIntent).toHaveBeenCalled()
    })

    it('should update order with payment intent ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      await POST(request)

      expect(db.update).toHaveBeenCalled()
    })

    it('should handle payment intent creation failure', async () => {
      mockCreatePaymentIntent.mockRejectedValue(new Error('Payment intent failed'))

      const request = new NextRequest('http://localhost:3000/api/checkout/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(validCheckoutData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
