/**
 * Tests for Products API endpoint
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { db } from '@/db'
import type { Product } from '@/db/schemas/catalog'

// Mock dependencies
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
  products: {},
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

const mockActiveProduct: Partial<Product> = {
  id: '1',
  name: 'Active Product',
  slug: 'active-product',
  sku: 'ACT-001',
  status: 'active',
  isAvailableForPurchase: true,
  price: 1499.99,
  inStock: true,
  stockQuantity: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSunsettedProduct: Partial<Product> = {
  id: '2',
  name: 'Sunsetted Product',
  slug: 'sunsetted-product',
  sku: 'SUN-001',
  status: 'sunsetted',
  isAvailableForPurchase: false,
  price: 999.99,
  inStock: false,
  stockQuantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockDiscontinuedProduct: Partial<Product> = {
  id: '3',
  name: 'Discontinued Product',
  slug: 'discontinued-product',
  sku: 'DIS-001',
  status: 'discontinued',
  isAvailableForPurchase: false,
  price: 799.99,
  inStock: false,
  stockQuantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('/api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return all active products', async () => {
      const mockSelect = {
        from: jest
          .fn()
          .mockResolvedValue([
            mockActiveProduct,
            { ...mockActiveProduct, id: '2', name: 'Active Product 2' },
          ]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.meta.count).toBe(2)
    })

    it('should filter out sunsetted products', async () => {
      const mockSelect = {
        from: jest.fn().mockResolvedValue([mockActiveProduct, mockSunsettedProduct]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe(mockActiveProduct.id)
      expect(data.meta.filtered).toBe(1)
    })

    it('should filter out discontinued products', async () => {
      const mockSelect = {
        from: jest.fn().mockResolvedValue([mockActiveProduct, mockDiscontinuedProduct]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe(mockActiveProduct.id)
    })

    it('should return empty array when no active products exist', async () => {
      const mockSelect = {
        from: jest.fn().mockResolvedValue([mockSunsettedProduct, mockDiscontinuedProduct]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0)
      expect(data.meta.count).toBe(0)
      expect(data.meta.total).toBe(2)
      expect(data.meta.filtered).toBe(2)
    })

    it('should return metadata with correct counts', async () => {
      const mockSelect = {
        from: jest
          .fn()
          .mockResolvedValue([
            mockActiveProduct,
            { ...mockActiveProduct, id: '2' },
            mockSunsettedProduct,
            mockDiscontinuedProduct,
          ]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const response = await GET()
      const data = await response.json()

      expect(data.meta.count).toBe(2) // Active products
      expect(data.meta.total).toBe(4) // All products
      expect(data.meta.filtered).toBe(2) // Filtered out
    })

    it('should handle database errors gracefully', async () => {
      const mockSelect = {
        from: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch products')
    })

    it('should only show products where isAvailableForPurchase is true', async () => {
      const unavailableProduct = {
        ...mockActiveProduct,
        id: '4',
        status: 'active',
        isAvailableForPurchase: false,
      }

      const mockSelect = {
        from: jest.fn().mockResolvedValue([mockActiveProduct, unavailableProduct]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const response = await GET()
      const data = await response.json()

      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe(mockActiveProduct.id)
      expect(data.data[0].isAvailableForPurchase).toBe(true)
    })

    it('should return products with all required fields', async () => {
      const fullProduct: Partial<Product> = {
        id: '1',
        name: 'Full Product',
        slug: 'full-product',
        sku: 'FULL-001',
        status: 'active',
        isAvailableForPurchase: true,
        price: 1499.99,
        originalPrice: 1999.99,
        currency: 'USD',
        description: 'Full description',
        shortDescription: 'Short desc',
        features: ['Feature 1'],
        inStock: true,
        stockQuantity: 10,
        estimatedShipping: '5-7 days',
        specifications: { cpu: 'Intel i9' },
        images: ['image1.jpg'],
        categories: ['cooling'],
        tags: ['tag1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = {
        from: jest.fn().mockResolvedValue([fullProduct]),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const response = await GET()
      const data = await response.json()

      expect(data.data[0]).toMatchObject({
        id: fullProduct.id,
        name: fullProduct.name,
        slug: fullProduct.slug,
        sku: fullProduct.sku,
        price: fullProduct.price,
        status: fullProduct.status,
        isAvailableForPurchase: fullProduct.isAvailableForPurchase,
      })
    })
  })
})
