'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, CartState, ShippingMethod, CouponCode, USA_TAX_RATES } from '@/types/cart'
import { TwoPhaseCoolingProduct } from '@/types/product'
import { toast } from 'react-hot-toast'

interface CartActions {
  // Cart management
  addItem: (product: TwoPhaseCoolingProduct, quantity?: number, variantId?: string) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void

  // Pricing calculations
  calculateTotals: () => void
  applyCoupon: (coupon: CouponCode) => void
  removeCoupon: () => void
  updateShipping: (method: ShippingMethod) => void
  calculateTax: (state: string) => number
  calculateShipping: (state: string, method?: ShippingMethod) => number
}

type CartStore = CartState & CartActions

// Default shipping methods for USA
const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Free shipping on orders over $500',
    cost: 0, // Will be calculated based on order amount
    estimatedDays: '5-7 business days',
    carrier: 'UPS Ground',
    trackingAvailable: true,
  },
  {
    id: 'expedited',
    name: 'Expedited Shipping',
    description: 'Faster delivery with tracking',
    cost: 149.99,
    estimatedDays: '2-3 business days',
    carrier: 'UPS 2nd Day Air',
    trackingAvailable: true,
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next business day delivery',
    cost: 299.99,
    estimatedDays: '1 business day',
    carrier: 'UPS Next Day Air',
    trackingAvailable: true,
  },
]

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      appliedCoupon: null as any,
      estimatedDelivery: '5-7 business days',

      // Actions
      addItem: (product: TwoPhaseCoolingProduct, quantity = 1, variantId?: string) => {
        const state = get()
        const existingItemIndex = state.items.findIndex(
          item => item.productId === product.id && item.selectedVariantId === variantId
        )

        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...state.items]
          const existingItem = updatedItems[existingItemIndex]!
          const newQuantity = existingItem.quantity + quantity

          // Check stock limits
          if (newQuantity > product.stockQuantity) {
            toast.error(`Only ${product.stockQuantity} units available`)
            return
          }

          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            updatedAt: new Date(),
          }

          set({
            items: updatedItems,
            isOpen: true,
          })
        } else {
          // Add new item
          if (quantity > product.stockQuantity) {
            toast.error(`Only ${product.stockQuantity} units available`)
            return
          }

          const newItem: CartItem = {
            id: `${product.id}-${variantId || 'default'}-${Date.now()}`,
            productId: product.id,
            product,
            quantity,
            selectedVariantId: variantId || '',
            addedAt: new Date(),
            updatedAt: new Date(),
          }

          set({
            items: [...state.items, newItem],
            isOpen: true,
          })
        }

        get().calculateTotals()
        toast.success(`Added ${quantity}x ${product.name} to cart`)
      },

      removeItem: (itemId: string) => {
        const state = get()
        const item = state.items.find(item => item.id === itemId)

        set({
          items: state.items.filter(item => item.id !== itemId),
        })

        get().calculateTotals()

        if (item) {
          toast.success(`Removed ${item.product.name} from cart`)
        }
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        const state = get()
        const itemIndex = state.items.findIndex(item => item.id === itemId)

        if (itemIndex >= 0) {
          const item = state.items[itemIndex]!

          // Check stock limits
          if (quantity > item.product.stockQuantity) {
            toast.error(`Only ${item.product.stockQuantity} units available`)
            return
          }

          const updatedItems = [...state.items]
          updatedItems[itemIndex] = {
            ...item,
            quantity,
            updatedAt: new Date(),
          }

          set({ items: updatedItems })
          get().calculateTotals()
        }
      },

      clearCart: () => {
        set({
          items: [],
          appliedCoupon: null as any,
          isOpen: false,
        })
        get().calculateTotals()
        toast.success('Cart cleared')
      },

      toggleCart: () => {
        set(state => ({ isOpen: !state.isOpen }))
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      calculateTotals: () => {
        const state = get()

        // Calculate subtotal
        const subtotal = state.items.reduce((total, item) => {
          const price = item.selectedVariantId
            ? item.product.variants?.find(v => v.id === item.selectedVariantId)?.price ||
              item.product.price
            : item.product.price
          return total + price * item.quantity
        }, 0)

        // Calculate item count
        const itemCount = state.items.reduce((count, item) => count + item.quantity, 0)

        // Calculate shipping (free shipping over $500)
        const shippingCost = get().calculateShipping('CA') // Default to CA for demo

        // Calculate tax (default to CA rate for demo)
        const taxRate = USA_TAX_RATES['CA'] || 0.08
        const taxAmount = subtotal * taxRate

        // Apply coupon discount
        let discount = 0
        if (state.appliedCoupon) {
          if (state.appliedCoupon.type === 'percentage') {
            discount = subtotal * (state.appliedCoupon.value / 100)
          } else {
            discount = state.appliedCoupon.value
          }
        }

        const total = subtotal + taxAmount + shippingCost - discount

        set({
          itemCount,
          subtotal,
          tax: taxAmount,
          shipping: shippingCost,
          total: Math.max(0, total), // Ensure total is never negative
        })
      },

      applyCoupon: (coupon: CouponCode) => {
        const state = get()

        // Check minimum amount if required
        if (coupon.minimumAmount && state.subtotal < coupon.minimumAmount) {
          toast.error(`Minimum order amount of $${coupon.minimumAmount} required for this coupon`)
          return
        }

        // Check expiration
        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
          toast.error('This coupon has expired')
          return
        }

        set({ appliedCoupon: coupon })
        get().calculateTotals()
        toast.success(`Coupon ${coupon.code} applied!`)
      },

      removeCoupon: () => {
        set({ appliedCoupon: null as any })
        get().calculateTotals()
        toast.success('Coupon removed')
      },

      updateShipping: (method: ShippingMethod) => {
        set({
          shipping: method.cost,
          estimatedDelivery: method.estimatedDays,
        })
        get().calculateTotals()
      },

      calculateTax: (state: string) => {
        const taxRate = USA_TAX_RATES[state] || 0
        return get().subtotal * taxRate
      },

      calculateShipping: (state: string, method?: ShippingMethod) => {
        const subtotal = get().subtotal

        if (method) {
          return method.cost
        }

        // Free shipping over $500
        if (subtotal >= 500) {
          return 0
        }

        // Standard shipping rates based on location
        const shippingRates: Record<string, number> = {
          CA: 49.99,
          NY: 59.99,
          TX: 54.99,
          FL: 52.99,
          WA: 51.99,
        }

        return shippingRates[state] || 59.99 // Default shipping rate
      },
    }),
    {
      name: 'two-phase-cart-storage',
      partialize: state => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
        // Don't persist UI state like isOpen
      }),
    }
  )
)

// Helper functions for external use
export const getCartItemCount = () => useCartStore.getState().itemCount
export const getCartTotal = () => useCartStore.getState().total
export const getCartItems = () => useCartStore.getState().items

// Available shipping methods getter
export const getShippingMethods = (subtotal: number) => {
  return SHIPPING_METHODS.map(method => ({
    ...method,
    cost: method.id === 'standard' && subtotal >= 500 ? 0 : method.cost,
  }))
}
