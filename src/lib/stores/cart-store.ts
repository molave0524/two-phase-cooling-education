// Shopping Cart Store
// Two-Phase Cooling Education Center
//
// Zustand store for managing shopping cart state

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Products } from '@prisma/client'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CartItem {
  product: Products
  quantity: number
  addedAt: Date
  customOptions?: Record<string, any>
}

export interface CartSummary {
  subtotal: number
  tax: number
  shipping: number
  total: number
  itemCount: number
  currency: string
}

export interface CartState {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null

  // Checkout state
  isCheckingOut: boolean
  checkoutError: string | null

  // Shipping and tax calculations
  shippingAddress: {
    country: string
    state: string
    zipCode: string
  } | null
}

export interface CartActions {
  // Item management
  addItem: (product: Products, quantity?: number, options?: Record<string, any>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void

  // Calculations
  getCartSummary: () => CartSummary
  getItemCount: () => number
  getSubtotal: () => number

  // Persistence
  syncCart: () => Promise<void>
  loadCart: () => Promise<void>

  // Checkout
  startCheckout: () => void
  completeCheckout: (orderId: string) => void
  cancelCheckout: () => void

  // Address management
  setShippingAddress: (address: CartState['shippingAddress']) => void

  // Utilities
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export type CartStore = CartState & CartActions

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: CartState = {
  items: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  isCheckingOut: false,
  checkoutError: null,
  shippingAddress: null,
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // ITEM MANAGEMENT
      // ========================================================================

      addItem: (product: Products, quantity: number = 1, options?: Record<string, any>) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            item => item.product.id === product.id &&
            JSON.stringify(item.customOptions) === JSON.stringify(options)
          )

          let newItems: CartItem[]

          if (existingItemIndex >= 0) {
            // Update existing item
            newItems = [...state.items]
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: newItems[existingItemIndex].quantity + quantity,
            }
          } else {
            // Add new item
            const newItem: CartItem = {
              product,
              quantity,
              addedAt: new Date(),
              customOptions: options,
            }
            newItems = [...state.items, newItem]
          }

          return {
            items: newItems,
            lastUpdated: new Date(),
            error: null,
          }
        })
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId),
          lastUpdated: new Date(),
          error: null,
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
          lastUpdated: new Date(),
          error: null,
        }))
      },

      clearCart: () => {
        set({
          items: [],
          lastUpdated: new Date(),
          error: null,
          isCheckingOut: false,
          checkoutError: null,
        })
      },

      // ========================================================================
      // CALCULATIONS
      // ========================================================================

      getCartSummary: (): CartSummary => {
        const state = get()
        const items = state.items

        const subtotal = items.reduce((total, item) => {
          return total + (item.product.price_cents * item.quantity)
        }, 0)

        const itemCount = items.reduce((total, item) => total + item.quantity, 0)

        // Calculate tax (simplified - 8.5% for demo)
        const taxRate = 0.085
        const tax = Math.round(subtotal * taxRate)

        // Calculate shipping (simplified - free over $500, otherwise $15)
        const shipping = subtotal >= 50000 ? 0 : 1500 // $500 threshold, $15 shipping

        const total = subtotal + tax + shipping

        // Get currency from first item (assume all items same currency)
        const currency = items.length > 0 ? items[0].product.currency : 'USD'

        return {
          subtotal: subtotal / 100, // Convert to dollars
          tax: tax / 100,
          shipping: shipping / 100,
          total: total / 100,
          itemCount,
          currency,
        }
      },

      getItemCount: (): number => {
        const state = get()
        return state.items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: (): number => {
        const state = get()
        const subtotalCents = state.items.reduce((total, item) => {
          return total + (item.product.price_cents * item.quantity)
        }, 0)
        return subtotalCents / 100
      },

      // ========================================================================
      // PERSISTENCE
      // ========================================================================

      syncCart: async () => {
        const state = get()

        try {
          set({ isLoading: true, error: null })

          // In production, sync cart with backend
          const response = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: state.items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                customOptions: item.customOptions,
              })),
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to sync cart')
          }

          console.log('Cart synced successfully')
        } catch (error) {
          console.error('Failed to sync cart:', error)
          set({ error: 'Failed to sync cart' })
        } finally {
          set({ isLoading: false })
        }
      },

      loadCart: async () => {
        try {
          set({ isLoading: true, error: null })

          // In production, load cart from backend
          const response = await fetch('/api/cart')

          if (!response.ok) {
            throw new Error('Failed to load cart')
          }

          const cartData = await response.json()

          // Transform backend data to cart items
          const items: CartItem[] = cartData.items?.map((item: any) => ({
            product: item.product,
            quantity: item.quantity,
            addedAt: new Date(item.addedAt),
            customOptions: item.customOptions,
          })) || []

          set({
            items,
            lastUpdated: new Date(),
          })

        } catch (error) {
          console.error('Failed to load cart:', error)
          set({ error: 'Failed to load cart' })
        } finally {
          set({ isLoading: false })
        }
      },

      // ========================================================================
      // CHECKOUT
      // ========================================================================

      startCheckout: () => {
        set({
          isCheckingOut: true,
          checkoutError: null,
        })
      },

      completeCheckout: (orderId: string) => {
        set({
          items: [],
          isCheckingOut: false,
          checkoutError: null,
          lastUpdated: new Date(),
        })
      },

      cancelCheckout: () => {
        set({
          isCheckingOut: false,
          checkoutError: null,
        })
      },

      // ========================================================================
      // ADDRESS MANAGEMENT
      // ========================================================================

      setShippingAddress: (address: CartState['shippingAddress']) => {
        set({
          shippingAddress: address,
          lastUpdated: new Date(),
        })
      },

      // ========================================================================
      // UTILITIES
      // ========================================================================

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => localStorage),

      // Only persist specific keys
      partialize: (state) => ({
        items: state.items,
        shippingAddress: state.shippingAddress,
        lastUpdated: state.lastUpdated,
      }),

      // Merge strategy for hydration
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...persistedState }

        // Ensure dates are Date objects
        if (merged.lastUpdated && typeof merged.lastUpdated === 'string') {
          merged.lastUpdated = new Date(merged.lastUpdated)
        }

        if (merged.items) {
          merged.items = merged.items.map((item: any) => ({
            ...item,
            addedAt: typeof item.addedAt === 'string' ? new Date(item.addedAt) : item.addedAt,
          }))
        }

        return merged
      },
    }
  )
)

// ============================================================================
// SELECTORS
// ============================================================================

// Helper selectors for common use cases
export const selectCartItemCount = (state: CartStore) => state.getItemCount()
export const selectCartSubtotal = (state: CartStore) => state.getSubtotal()
export const selectCartSummary = (state: CartStore) => state.getCartSummary()
export const selectIsInCart = (state: CartStore, productId: string) =>
  state.items.some(item => item.product.id === productId)
export const selectCartItem = (state: CartStore, productId: string) =>
  state.items.find(item => item.product.id === productId)

// ============================================================================
// HOOKS
// ============================================================================

// Custom hooks for component usage
export const useCartItem = (productId: string) => {
  const store = useCartStore()
  return {
    item: selectCartItem(store, productId),
    isInCart: selectIsInCart(store, productId),
    addItem: (product: Products, quantity?: number) => store.addItem(product, quantity),
    updateQuantity: (quantity: number) => store.updateQuantity(productId, quantity),
    removeItem: () => store.removeItem(productId),
  }
}

export const useCartSummary = () => {
  const store = useCartStore()
  return {
    summary: selectCartSummary(store),
    itemCount: selectCartItemCount(store),
    subtotal: selectCartSubtotal(store),
    isEmpty: store.items.length === 0,
  }
}