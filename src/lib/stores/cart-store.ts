// Mock cart store for demo mode
import { create } from 'zustand'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  itemCount: number
  total: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  itemCount: 0,
  total: 0,

  addItem: (item) => set((state) => {
    const existingItem = state.items.find(i => i.id === item.id)
    if (existingItem) {
      const updatedItems = state.items.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      )
      return {
        items: updatedItems,
        itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
        total: updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
      }
    } else {
      const newItems = [...state.items, { ...item, quantity: 1 }]
      return {
        items: newItems,
        itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        total: newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
      }
    }
  }),

  removeItem: (id) => set((state) => {
    const newItems = state.items.filter(i => i.id !== id)
    return {
      items: newItems,
      itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
      total: newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
    }
  }),

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id)
      return
    }
    set((state) => {
      const newItems = state.items.map(i =>
        i.id === id ? { ...i, quantity } : i
      )
      return {
        items: newItems,
        itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
        total: newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
      }
    })
  },

  clearCart: () => set({ items: [], itemCount: 0, total: 0 }),

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen }))
}))