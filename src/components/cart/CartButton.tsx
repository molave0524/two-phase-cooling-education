'use client'

import React from 'react'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/stores/cartStore'

export default function CartButton() {
  const { openCart, itemCount } = useCartStore()

  return (
    <button
      onClick={openCart}
      className='relative p-2 text-secondary-600 hover:text-primary-600 transition-colors'
      aria-label={`Open cart with ${itemCount} items`}
    >
      <ShoppingBagIcon className='w-6 h-6' />
      {itemCount > 0 && (
        <span className='absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium'>
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  )
}
