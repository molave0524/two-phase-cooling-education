'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/stores/cartStore'

export default function CartButton() {
  const { itemCount } = useCartStore()

  return (
    <Link
      href='/cart'
      className='relative p-2 text-secondary-600 hover:text-primary-600 transition-colors'
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <div className='relative'>
        <ShoppingBagIcon className='w-6 h-6' />

        {itemCount > 0 && (
          <span className='absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/2 bg-primary-600 text-white text-xs font-bold rounded-full min-w-[1rem] h-4 flex items-center justify-center text-[10px]'>
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </Link>
  )
}
