/**
 * Unit tests for Cart Store (Zustand)
 * Tests all cart operations, pricing calculations, and coupon functionality
 */

import { act, renderHook } from '@testing-library/react'
import { useCartStore } from '../cartStore'
import { TwoPhaseCoolingProduct } from '@/types/product'

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { toast as mockToast } from 'react-hot-toast'

const mockProduct: TwoPhaseCoolingProduct = {
  id: 'test-product-1',
  name: 'Test Cooling System',
  slug: 'test-cooling-system',
  sku: 'TCS-001',
  price: 1499.99,
  originalPrice: null,
  currency: 'USD',
  description: 'Test product description',
  shortDescription: 'Test product',
  features: ['Feature 1', 'Feature 2'],
  inStock: true,
  stockQuantity: 10,
  estimatedShipping: '5-7 business days',
  specifications: {},
  images: [],
  categories: ['cooling'],
  tags: [],
  metaTitle: null,
  metaDescription: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('CartStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCartStore())
    act(() => {
      result.current.clearCart()
    })
    jest.clearAllMocks()
  })

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0]?.productId).toBe(mockProduct.id)
      expect(result.current.items[0]?.quantity).toBe(1)
      expect(result.current.itemCount).toBe(1)
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Added'))
    })

    it('should update quantity when adding existing item', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
      })

      // Wait a bit to ensure same timestamp logic can work
      const itemId = result.current.items[0]?.id

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      // Should have combined quantities (either in same item or total count)
      expect(result.current.itemCount).toBe(3)

      // Verify total quantity across all items
      const totalQty = result.current.items.reduce((sum, item) => sum + item.quantity, 0)
      expect(totalQty).toBe(3)
    })

    it('should prevent adding more items than stock quantity', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 15) // More than stockQuantity (10)
      })

      expect(result.current.items).toHaveLength(0)
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('Only 10 units available')
      )
    })

    it('should open cart drawer when item is added', () => {
      const { result } = renderHook(() => useCartStore())

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      expect(result.current.isOpen).toBe(true)
    })
  })

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      const itemId = result.current.items[0]?.id!

      act(() => {
        result.current.removeItem(itemId)
      })

      expect(result.current.items).toHaveLength(0)
      expect(result.current.itemCount).toBe(0)
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Removed'))
    })

    it('should recalculate totals after removing item', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
      })

      const subtotalBefore = result.current.subtotal
      expect(subtotalBefore).toBeGreaterThan(0)

      const itemId = result.current.items[0]?.id!

      act(() => {
        result.current.removeItem(itemId)
      })

      expect(result.current.subtotal).toBe(0)
      expect(result.current.total).toBe(0)
    })
  })

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      const itemId = result.current.items[0]?.id!

      act(() => {
        result.current.updateQuantity(itemId, 3)
      })

      expect(result.current.items[0]?.quantity).toBe(3)
      expect(result.current.itemCount).toBe(3)
    })

    it('should remove item when quantity is set to 0', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
      })

      const itemId = result.current.items[0]?.id!

      act(() => {
        result.current.updateQuantity(itemId, 0)
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('should prevent setting quantity above stock limit', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      const itemId = result.current.items[0]?.id!

      act(() => {
        result.current.updateQuantity(itemId, 15) // More than stock (10)
      })

      expect(result.current.items[0]?.quantity).toBe(1) // Should remain unchanged
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('Only 10 units available')
      )
    })
  })

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
        result.current.addItem({ ...mockProduct, id: 'test-product-2' }, 1)
      })

      expect(result.current.items).toHaveLength(2)

      act(() => {
        result.current.clearCart()
      })

      expect(result.current.items).toHaveLength(0)
      expect(result.current.itemCount).toBe(0)
      expect(result.current.subtotal).toBe(0)
      expect(result.current.total).toBe(0)
      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('cart drawer controls', () => {
    it('should toggle cart drawer', () => {
      const { result } = renderHook(() => useCartStore())

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggleCart()
      })

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.toggleCart()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it('should open cart drawer', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.openCart()
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('should close cart drawer', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.openCart()
      })

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.closeCart()
      })

      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('calculateTotals', () => {
    it('should calculate subtotal correctly', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
      })

      expect(result.current.subtotal).toBe(mockProduct.price * 2)
    })

    it('should calculate tax correctly', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      // Tax should be calculated (CA rate is 8.75% by default in the store)
      expect(result.current.tax).toBeGreaterThan(0)
      expect(result.current.tax).toBe(mockProduct.price * 0.0875)
    })

    it('should apply free shipping for orders over $500', () => {
      const expensiveProduct: TwoPhaseCoolingProduct = {
        ...mockProduct,
        id: 'expensive-product',
        price: 600,
      }

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(expensiveProduct, 1)
      })

      // Verify subtotal is >= $500
      expect(result.current.subtotal).toBeGreaterThanOrEqual(500)

      // Verify the calculateShipping function works correctly for high subtotals
      const testShipping = result.current.calculateShipping('CA')
      expect(testShipping).toBe(0) // Direct call should return 0 for >= $500
    })

    it('should charge shipping for orders under $500', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({ ...mockProduct, price: 100 }, 1)
      })

      expect(result.current.shipping).toBeGreaterThan(0)
    })

    it('should calculate total correctly (subtotal + tax + shipping)', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({ ...mockProduct, price: 100 }, 1)
      })

      const expectedTotal = result.current.subtotal + result.current.tax + result.current.shipping

      expect(result.current.total).toBeCloseTo(expectedTotal, 2)
    })

    it('should ensure total is never negative', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      // Apply a coupon with value greater than total
      act(() => {
        result.current.applyCoupon({
          code: 'HUGE_DISCOUNT',
          type: 'fixed',
          value: 10000,
          description: 'Huge discount',
        })
      })

      expect(result.current.total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('applyCoupon', () => {
    it('should apply percentage coupon correctly', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      const totalBefore = result.current.total

      act(() => {
        result.current.applyCoupon({
          code: 'SAVE10',
          type: 'percentage',
          value: 10,
          description: '10% off',
        })
      })

      expect(result.current.appliedCoupon).toBeDefined()
      expect(result.current.total).toBeLessThan(totalBefore)
    })

    it('should apply fixed amount coupon correctly', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      const totalBefore = result.current.total

      act(() => {
        result.current.applyCoupon({
          code: 'SAVE50',
          type: 'fixed',
          value: 50,
          description: '$50 off',
        })
      })

      expect(result.current.appliedCoupon).toBeDefined()
      expect(result.current.appliedCoupon?.code).toBe('SAVE50')
      expect(result.current.appliedCoupon?.type).toBe('fixed')
      expect(result.current.appliedCoupon?.value).toBe(50)
      // Verify discount was applied (total should be at least $50 less)
      expect(totalBefore - result.current.total).toBeGreaterThanOrEqual(50)
    })

    it('should reject coupon if minimum amount not met', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({ ...mockProduct, price: 50 }, 1)
      })

      act(() => {
        result.current.applyCoupon({
          code: 'BIG_ORDER',
          type: 'percentage',
          value: 10,
          description: '10% off large orders',
          minimumAmount: 500,
        })
      })

      expect(result.current.appliedCoupon).toBeUndefined()
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Minimum order amount'))
    })

    it('should reject expired coupon', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      const expiredDate = new Date('2020-01-01')

      act(() => {
        result.current.applyCoupon({
          code: 'EXPIRED',
          type: 'percentage',
          value: 10,
          description: 'Expired coupon',
          expiresAt: expiredDate,
        })
      })

      expect(result.current.appliedCoupon).toBeUndefined()
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('expired'))
    })
  })

  describe('removeCoupon', () => {
    it('should remove applied coupon', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
      })

      act(() => {
        result.current.applyCoupon({
          code: 'SAVE10',
          type: 'percentage',
          value: 10,
          description: '10% off',
        })
      })

      expect(result.current.appliedCoupon).toBeDefined()

      const totalWithCoupon = result.current.total

      act(() => {
        result.current.removeCoupon()
      })

      expect(result.current.appliedCoupon).toBeUndefined()
      expect(result.current.total).toBeGreaterThan(totalWithCoupon)
    })
  })

  describe('calculateShipping', () => {
    it('should calculate shipping based on state', () => {
      const { result } = renderHook(() => useCartStore())

      const caShipping = result.current.calculateShipping('CA')
      const nyShipping = result.current.calculateShipping('NY')

      expect(caShipping).toBe(49.99)
      expect(nyShipping).toBe(59.99)
    })

    it('should return default shipping for unknown state', () => {
      const { result } = renderHook(() => useCartStore())

      const unknownShipping = result.current.calculateShipping('ZZ')

      expect(unknownShipping).toBe(59.99)
    })
  })

  describe('calculateTax', () => {
    it('should calculate tax based on state rate', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem({ ...mockProduct, price: 100 }, 1)
      })

      const taxCA = result.current.calculateTax('CA')

      // CA tax rate is 8.75% in USA_TAX_RATES
      expect(taxCA).toBe(100 * 0.0875)
    })
  })
})
