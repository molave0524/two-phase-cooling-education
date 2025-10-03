# Guest Order Tracking Implementation Guide

**Document ID**: 20251002_guest-order-tracking-implementation
**Date**: October 2, 2025
**Author**: Development Team
**Purpose**: Implement order tracking functionality for guest customers

---

## 1. Executive Summary

### Current State

Guest customers can only view their order confirmation page once, immediately after checkout, using a secure token in the URL. If they lose this URL or navigate away, they cannot access their order details again.

### Proposed Solution

Implement a guest order tracking system that allows customers to retrieve their order details by entering their order number and email address. The system will generate a new secure access token and either:

1. Display the order details directly, or
2. Send a secure link via email

### Benefits

- Improved customer experience for guest checkouts
- Reduced support requests for lost order confirmations
- Maintains security while providing convenient access

---

## 2. Technical Architecture

### 2.1 Current Security Implementation

The existing system uses HMAC-SHA256 tokens for order access:

**File**: `src/lib/order-token.ts`

```typescript
export function generateOrderToken(orderId: string, customerEmail: string): string {
  const data = `${orderId}:${customerEmail.toLowerCase()}`
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(data)
  return hmac.digest('hex')
}

export function verifyOrderToken(orderId: string, customerEmail: string, token: string): boolean {
  const expectedToken = generateOrderToken(orderId, customerEmail)
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
}
```

**Security Features**:

- Token is cryptographically secure (HMAC-SHA256)
- Cannot be forged without the secret key
- Timing-safe comparison prevents timing attacks
- Email is normalized to lowercase for consistency

### 2.2 Current Authorization Flow

**File**: `src/app/api/orders/update-payment/route.ts`

```typescript
// Allow access if:
// 1. Valid access token is provided (for guest checkout)
// 2. User is authenticated AND their email matches the order's customer email
// 3. User is an admin
const hasValidToken = token && verifyOrderToken(orderId, customerData.email, token)
const isCustomer = session?.user?.email === customerData.email
const isAdmin = session?.user?.role === 'admin'

if (!hasValidToken && !isCustomer && !isAdmin) {
  // Return 403 Forbidden
}
```

---

## 3. Implementation Options

### Option A: Direct Order Display (Recommended)

**User Flow**:

1. Customer visits `/track-order` page
2. Enters order number and email
3. System generates secure token
4. Redirects to `/order-confirmation?id={orderId}&token={token}`

**Pros**:

- Instant access to order details
- No email dependency
- Simple implementation
- Works even if email delivery fails

**Cons**:

- No audit trail of access requests
- Token visible in URL (browser history)

### Option B: Email Link Delivery

**User Flow**:

1. Customer visits `/track-order` page
2. Enters order number and email
3. System sends email with secure link
4. Customer clicks link to view order

**Pros**:

- More secure (token not in browser history)
- Audit trail of access requests
- Prevents unauthorized guessing

**Cons**:

- Dependent on email delivery
- Delayed access
- Requires email service integration

### Option C: Hybrid Approach (Best Practice)

**User Flow**:

1. Customer visits `/track-order` page
2. Enters order number and email
3. System validates and shows two options:
   - "View Now" - Direct access with token
   - "Email Me" - Send secure link
4. Customer chooses preferred method

**Pros**:

- Flexibility for customer preference
- Best of both options
- Graceful fallback if email fails

**Cons**:

- More complex implementation
- Requires email service

---

## 4. Detailed Implementation Steps

### Step 1: Create Track Order Page

**File**: `src/app/track-order/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateOrderToken } from '@/lib/order-token'

export default function TrackOrderPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate order exists and email matches
      const response = await fetch(
        `/api/orders/validate?orderNumber=${orderNumber}&email=${encodeURIComponent(email)}`
      )
      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || 'Order not found or email does not match')
        return
      }

      // Generate token and redirect
      const orderId = result.data.orderId
      const token = generateOrderToken(orderId, email)
      router.push(`/order-confirmation?id=${orderId}&token=${token}`)
    } catch (err) {
      setError('Failed to track order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">
          Track Your Order
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="orderNumber" className="block text-sm font-medium text-secondary-700 mb-2">
              Order Number
            </label>
            <input
              type="text"
              id="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g., ORD-001"
              required
              className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary"
          >
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-secondary-600">
          <p>Enter the order number from your confirmation email and the email address you used at checkout.</p>
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Create Order Validation API Endpoint

**File**: `src/app/api/orders/validate/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { getOrderByNumber } from '@/lib/orders'
import { apiSuccess, apiError, apiNotFound, ERROR_CODES } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const email = searchParams.get('email')

    if (!orderNumber || !email) {
      return apiError(ERROR_CODES.INVALID_INPUT, 'Order number and email are required', {
        status: 400,
      })
    }

    // Fetch order by order number
    const order = await getOrderByNumber(orderNumber)

    if (!order) {
      logger.warn('Order validation failed - order not found', { orderNumber })
      return apiNotFound('Order')
    }

    // Parse customer data
    const customerData =
      typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer

    // Verify email matches (case-insensitive)
    if (customerData.email.toLowerCase() !== email.toLowerCase()) {
      logger.warn('Order validation failed - email mismatch', {
        orderNumber,
        providedEmail: email,
      })
      return apiError(ERROR_CODES.UNAUTHORIZED, 'Email does not match order', { status: 403 })
    }

    // Return order ID (not full order details)
    return apiSuccess({
      orderId: order.id,
      message: 'Order validated successfully',
    })
  } catch (error) {
    logger.error('Order validation error', error)
    return apiError(ERROR_CODES.INTERNAL_ERROR, 'Failed to validate order', { status: 500 })
  }
}
```

### Step 3: Add Helper Function to Orders Library

**File**: `src/lib/orders.ts`

Add this function to the existing orders library:

```typescript
/**
 * Get order by order number
 * @param orderNumber - The order number (e.g., "ORD-001")
 * @returns Order object or null if not found
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1)

    if (!order) {
      return null
    }

    // Fetch order items with product details
    const items = await db
      .select({
        id: orderItemsTable.id,
        productId: orderItemsTable.productId,
        quantity: orderItemsTable.quantity,
        unitPrice: orderItemsTable.unitPrice,
        totalPrice: orderItemsTable.totalPrice,
        product: productsTable,
      })
      .from(orderItemsTable)
      .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(orderItemsTable.orderId, order.id))

    return {
      ...order,
      items,
    }
  } catch (error) {
    logger.error('Failed to fetch order by number', error, { orderNumber })
    return null
  }
}
```

### Step 4: Add Navigation Link

**File**: `src/components/layout/Header.tsx` (or appropriate navigation component)

Add a "Track Order" link to the header:

```typescript
<Link
  href="/track-order"
  className="text-secondary-600 hover:text-secondary-900"
>
  Track Order
</Link>
```

### Step 5: Update Order Confirmation Page

**File**: `src/app/order-confirmation/page.tsx`

Add a note about tracking orders in the future:

```typescript
{/* Help Section - Add this after the order details */}
<div className="bg-info-50 border border-info-200 rounded-lg p-6 mt-6">
  <h3 className="font-semibold text-info-800 mb-2">Need to Track This Order Later?</h3>
  <p className="text-sm text-info-700">
    Bookmark this page or save the link from your confirmation email.
    You can also track your order anytime using your order number and email at{' '}
    <Link href="/track-order" className="font-medium underline">
      Track Order
    </Link>
  </p>
</div>
```

---

## 5. Enhanced Implementation (Option C - Hybrid)

### Additional API Endpoint for Email Delivery

**File**: `src/app/api/orders/send-tracking-link/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { getOrderByNumber } from '@/lib/orders'
import { generateOrderToken } from '@/lib/order-token'
import { sendEmail } from '@/lib/email' // You'll need to implement this
import { apiSuccess, apiError, apiNotFound, ERROR_CODES } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, email } = await request.json()

    if (!orderNumber || !email) {
      return apiError(ERROR_CODES.INVALID_INPUT, 'Order number and email are required', {
        status: 400,
      })
    }

    const order = await getOrderByNumber(orderNumber)

    if (!order) {
      return apiNotFound('Order')
    }

    const customerData =
      typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer

    if (customerData.email.toLowerCase() !== email.toLowerCase()) {
      return apiError(ERROR_CODES.UNAUTHORIZED, 'Email does not match order', { status: 403 })
    }

    // Generate token
    const token = generateOrderToken(order.id, email)
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/order-confirmation?id=${order.id}&token=${token}`

    // Send email with tracking link
    await sendEmail({
      to: email,
      subject: `Track Your Order ${orderNumber}`,
      template: 'order-tracking',
      data: {
        orderNumber,
        trackingUrl,
        customerName: `${customerData.firstName} ${customerData.lastName}`,
      },
    })

    logger.info('Order tracking link sent', { orderNumber, email })

    return apiSuccess({
      message: 'Tracking link sent to your email',
    })
  } catch (error) {
    logger.error('Failed to send tracking link', error)
    return apiError(ERROR_CODES.INTERNAL_ERROR, 'Failed to send tracking link', { status: 500 })
  }
}
```

### Updated Track Order Page (Hybrid)

```typescript
// Add to the form
const [deliveryMethod, setDeliveryMethod] = useState<'view' | 'email'>('view')

// ... in the form JSX:
<div className="space-y-3">
  <label className="block text-sm font-medium text-secondary-700">
    How would you like to access your order?
  </label>
  <div className="space-y-2">
    <label className="flex items-center">
      <input
        type="radio"
        value="view"
        checked={deliveryMethod === 'view'}
        onChange={(e) => setDeliveryMethod('view')}
        className="mr-2"
      />
      <span>View now (immediate access)</span>
    </label>
    <label className="flex items-center">
      <input
        type="radio"
        value="email"
        checked={deliveryMethod === 'email'}
        onChange={(e) => setDeliveryMethod('email')}
        className="mr-2"
      />
      <span>Send me a secure link via email</span>
    </label>
  </div>
</div>

// Update handleSubmit to support both methods
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  try {
    if (deliveryMethod === 'email') {
      // Send email
      const response = await fetch('/api/orders/send-tracking-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || 'Failed to send tracking link')
        return
      }

      setSuccess('Tracking link sent! Check your email.')
    } else {
      // Direct view
      const response = await fetch(
        `/api/orders/validate?orderNumber=${orderNumber}&email=${encodeURIComponent(email)}`
      )
      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || 'Order not found or email does not match')
        return
      }

      const orderId = result.data.orderId
      const token = generateOrderToken(orderId, email)
      router.push(`/order-confirmation?id=${orderId}&token=${token}`)
    }
  } catch (err) {
    setError('Failed to track order. Please try again.')
  } finally {
    setLoading(false)
  }
}
```

---

## 6. Security Considerations

### 6.1 Rate Limiting

Implement rate limiting to prevent brute force attacks:

```typescript
// Add to validation endpoint
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function GET(request: NextRequest) {
  try {
    await limiter.check(request, 5) // 5 requests per minute
    // ... rest of validation logic
  } catch {
    return apiError(ERROR_CODES.TOO_MANY_REQUESTS, 'Too many attempts. Please try again later.', {
      status: 429,
    })
  }
}
```

### 6.2 Token Expiration

Consider adding token expiration for enhanced security:

```typescript
// In order-token.ts
export function generateOrderToken(
  orderId: string,
  customerEmail: string,
  expiresInHours = 72 // 3 days default
): string {
  const expiryTime = Date.now() + expiresInHours * 60 * 60 * 1000
  const data = `${orderId}:${customerEmail.toLowerCase()}:${expiryTime}`
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(data)
  return `${hmac.digest('hex')}:${expiryTime}`
}

export function verifyOrderToken(orderId: string, customerEmail: string, token: string): boolean {
  const [tokenHash, expiryStr] = token.split(':')
  const expiryTime = parseInt(expiryStr, 10)

  // Check if expired
  if (Date.now() > expiryTime) {
    return false
  }

  const data = `${orderId}:${customerEmail.toLowerCase()}:${expiryTime}`
  const expectedHash = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(expectedHash))
}
```

---

## 7. Testing Checklist

### Unit Tests

- [ ] Test `generateOrderToken()` generates consistent tokens
- [ ] Test `verifyOrderToken()` correctly validates tokens
- [ ] Test `getOrderByNumber()` fetches correct order
- [ ] Test email validation (case-insensitive)
- [ ] Test token expiration logic

### Integration Tests

- [ ] Test `/api/orders/validate` endpoint with valid data
- [ ] Test `/api/orders/validate` with invalid order number
- [ ] Test `/api/orders/validate` with mismatched email
- [ ] Test rate limiting on validation endpoint
- [ ] Test `/track-order` page renders correctly
- [ ] Test form submission and redirect
- [ ] Test error handling and display

### E2E Tests

- [ ] Complete guest checkout flow
- [ ] Navigate away and return via track order
- [ ] Test with expired token (if implemented)
- [ ] Test email delivery flow (if implemented)
- [ ] Test rate limiting behavior

---

## 8. Deployment Steps

1. **Development**
   - Implement track order page
   - Implement validation API endpoint
   - Add navigation links
   - Test locally

2. **Staging**
   - Deploy to staging environment
   - Run full test suite
   - Test email delivery (if implemented)
   - Verify rate limiting

3. **Production**
   - Set environment variable `ORDER_TOKEN_SECRET` (if not using `NEXTAUTH_SECRET`)
   - Deploy changes
   - Monitor error logs
   - Verify customer flow

---

## 9. Environment Variables

Add to `.env.local` and production:

```bash
# Optional: Dedicated secret for order tokens (defaults to NEXTAUTH_SECRET)
ORDER_TOKEN_SECRET=your-super-secret-key-change-in-production

# Required for hybrid option: Email service configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Required: Application URL for email links
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 10. Future Enhancements

1. **SMS Notifications**
   - Send tracking link via SMS
   - Integrate with Twilio or similar service

2. **QR Code**
   - Generate QR code for order tracking
   - Include in confirmation email

3. **Order History for Registered Users**
   - Show all past orders in account dashboard
   - No token needed for authenticated users

4. **Enhanced Analytics**
   - Track how often customers use order tracking
   - Monitor failed validation attempts
   - Measure customer satisfaction

---

## 11. Support Documentation

### Customer-Facing Documentation

**Help Article: "How to Track Your Order"**

1. Go to [Track Order](https://your-domain.com/track-order)
2. Enter your order number (found in your confirmation email)
3. Enter the email address you used at checkout
4. Click "Track Order"

**FAQ**:

- **Q: I lost my order confirmation email. What should I do?**
  A: Visit our Track Order page and enter your order number and email to retrieve your order details.

- **Q: The tracking link isn't working.**
  A: Links expire after 72 hours for security. Request a new tracking link from our Track Order page.

---

## 12. Maintenance & Monitoring

### Metrics to Track

- Number of tracking requests per day
- Failed validation attempts
- Token expiration rate
- Customer support tickets reduced

### Log Monitoring

```typescript
// Key log events to monitor:
;-'Order validation failed - order not found' -
  'Order validation failed - email mismatch' -
  'Order tracking link sent' -
  'Unauthorized order access attempt'
```

### Alerts

- High rate of failed validations (potential attack)
- Email delivery failures
- API endpoint errors

---

## 13. Summary

This implementation provides a secure, user-friendly way for guest customers to track their orders. The recommended approach is **Option A (Direct Display)** for immediate implementation, with future migration to **Option C (Hybrid)** once email infrastructure is in place.

**Key Benefits**:

- ✅ Maintains security with HMAC-SHA256 tokens
- ✅ Improved customer experience
- ✅ Reduced support burden
- ✅ No database schema changes required
- ✅ Scalable and maintainable

**Estimated Implementation Time**:

- Option A (Direct): 4-6 hours
- Option B (Email): 8-10 hours (including email service setup)
- Option C (Hybrid): 10-12 hours

---

## Appendix A: File Structure

```
src/
├── app/
│   ├── track-order/
│   │   └── page.tsx (NEW)
│   ├── api/
│   │   └── orders/
│   │       ├── validate/
│   │       │   └── route.ts (NEW)
│   │       └── send-tracking-link/
│   │           └── route.ts (NEW - Optional for email)
│   └── order-confirmation/
│       └── page.tsx (UPDATE - Add tracking info)
├── lib/
│   ├── order-token.ts (EXISTS - May need expiration updates)
│   ├── orders.ts (UPDATE - Add getOrderByNumber function)
│   └── email.ts (NEW - For email option)
└── components/
    └── layout/
        └── Header.tsx (UPDATE - Add Track Order link)
```

---

## Appendix B: References

- **Current Token Implementation**: `src/lib/order-token.ts`
- **Current Auth Flow**: `src/app/api/orders/update-payment/route.ts`
- **Order Data Models**: `src/lib/orders.ts`
- **Existing Order Confirmation**: `src/app/order-confirmation/page.tsx`

---

**End of Document**
