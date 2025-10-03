/**
 * Orders Section Component
 * Displays user order history with tracking information
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface OrderItem {
  id: number
  productName: string
  productImage: string
  quantity: number
  price: number
}

interface Order {
  id: number
  orderNumber: string
  status: string
  total: number
  createdAt: string
  trackingNumber?: string
  trackingUrl?: string
  items: OrderItem[]
}

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/account/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading orders...</div>
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No orders yet</p>
        <Link href="/products" className="text-blue-600 hover:underline">
          Start shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Order History</h2>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-6">
            {/* Order Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-gray-900">Order #{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <p className="mt-2 font-medium text-gray-900">${order.total.toFixed(2)}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3 mb-4 border-t pt-4">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="border-t pt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">Tracking Information</p>
                  <p className="text-sm text-gray-600">
                    Tracking Number: <strong>{order.trackingNumber}</strong>
                  </p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Track shipment →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
