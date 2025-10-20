# Inventory Management System

## Overview

This application includes a comprehensive inventory management system with automatic stock tracking, reservation management, and backorder support.

## Features

### 1. Stock Tracking

- Real-time inventory levels
- Configurable low stock thresholds (per product)
- Automatic stock decrementation on purchase
- Automatic stock restoration on cancellation/refund

### 2. Reservation System

- 15-minute hold on inventory during checkout
- Prevents overselling
- Automatic expiration of abandoned carts
- Tracks reservations by payment intent ID

### 3. Inventory Status Display

- **In Stock** - Normal availability
- **Low Stock** - Below threshold (shows quantity)
- **Out of Stock** - No available inventory
- **Backorder** - Available for pre-order

### 4. Backorder Support

- Customers can order out-of-stock items
- "Pre-Order" button for backorder items
- Special notification in cart

## Database Schema

### Products Table

- `stock_quantity` - Current inventory level
- `low_stock_threshold` - Configurable threshold (default: 5)
- `in_stock` - Boolean availability flag

### Inventory Reservations Table

- `product_id` - Product being reserved
- `quantity` - Reserved quantity
- `reserved_by` - User ID or session ID
- `stripe_payment_intent_id` - Payment tracking
- `expires_at` - Expiration timestamp
- `status` - active, expired, completed, cancelled

## API Endpoints

### Get Inventory Status

```typescript
GET /api/products
GET /api/products/[slug]

Response includes:
{
  ...product,
  inventory: {
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder',
    availableQuantity: number,
    stockQuantity: number,
    reservedQuantity: number,
    lowStockThreshold: number
  }
}
```

### Cleanup Endpoint

```typescript
POST /api/inventory/cleanup
Headers: Authorization: Bearer YOUR_CRON_SECRET

Response:
{
  success: true,
  data: {
    message: "Cleanup completed successfully",
    cleanedCount: 5,
    timestamp: "2025-01-20T..."
  }
}
```

## Inventory Management Functions

Located in `src/lib/inventory.ts`:

```typescript
// Get available quantity (stock - reservations)
await getAvailableQuantity(productId: string): Promise<number>

// Get full inventory status
await getInventoryStatus(productId: string): Promise<InventoryStatus>

// Reserve inventory during checkout (15min hold)
await reserveInventory({
  productId: string
  quantity: number
  reservedBy: string
  stripePaymentIntentId?: string
  expirationMinutes?: number // default: 15
})

// Complete reservation and decrement stock (on payment success)
await completeReservation(reservationId: number)

// Cancel reservation
await releaseReservation(reservationId: number)

// Restore stock (on cancellation/refund)
await incrementStock(productId: string, quantity: number)

// Cleanup expired reservations
await cleanupExpiredReservations(): Promise<number>
```

## Workflow

### Checkout Process

1. **User adds items to cart**
   - No reservation yet (just stored in cart)

2. **User initiates checkout**
   - Payment intent created
   - Inventory reserved for 15 minutes
   - Reservation tied to payment intent ID

3. **Payment succeeds**
   - Reservation marked as "completed"
   - Stock decremented by reserved quantity

4. **Payment fails or timeout**
   - Reservation expires automatically
   - Cleanup job marks as "expired"
   - Stock becomes available again

### Cancellation/Refund Process

1. **Order cancelled or refunded**
   - Stock incremented by order quantity
   - Inventory restored

## Setting Up Automatic Cleanup

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/inventory/cleanup",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use services like:

- **cron-job.org** (free, easy setup)
- **EasyCron**
- **GitHub Actions**

Example cron-job.org setup:

- URL: `https://yourdomain.com/api/inventory/cleanup`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Every 15 minutes (`*/15 * * * *`)

### Option 3: GitHub Actions

Create `.github/workflows/cleanup-inventory.yml`:

```yaml
name: Cleanup Inventory Reservations

on:
  schedule:
    - cron: '*/15 * * * *' # Every 15 minutes
  workflow_dispatch: # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cleanup
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yourdomain.com/api/inventory/cleanup
```

## Environment Variables

Add to `.env.local`:

```bash
# Optional: Dedicated cron secret (falls back to NEXTAUTH_SECRET)
CRON_SECRET=your-secure-random-secret-here
```

## Security Considerations

1. **Cron Endpoint Protection**
   - Requires Bearer token authentication
   - Open in development mode for testing
   - Protected in production

2. **Rate Limiting**
   - Cleanup endpoint should be rate-limited
   - Prevent abuse from unauthorized access

3. **Monitoring**
   - Log all cleanup operations
   - Track success/failure rates
   - Alert on repeated failures

## Testing

### Test Cleanup Endpoint (Development)

```bash
# In development (no auth required)
curl -X POST http://localhost:3000/api/inventory/cleanup

# In production (auth required)
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/inventory/cleanup
```

### Test Inventory Reservation

```typescript
// Create a test reservation
const result = await reserveInventory({
  productId: 'test-product-id',
  quantity: 1,
  reservedBy: 'test-user',
  expirationMinutes: 1, // 1 minute for testing
})

// Wait 2 minutes, then run cleanup
// Reservation should be marked as expired
```

## UI Components

### InventoryStatus Component

```tsx
import InventoryStatus from '@/components/product/InventoryStatus'

;<InventoryStatus
  status={product.inventory.status}
  availableQuantity={product.inventory.availableQuantity}
  showQuantity={true}
/>
```

### Product Card

Automatically displays:

- Inventory status badge
- "Pre-Order" button for backorders
- Available quantity for low stock items

## Monitoring and Maintenance

### Recommended Dashboards

1. **Inventory Metrics**
   - Total active reservations
   - Expired reservations (daily)
   - Low stock products
   - Backorder count

2. **Cleanup Job Metrics**
   - Last run timestamp
   - Items cleaned per run
   - Failure rate

### Database Queries

```sql
-- Active reservations
SELECT COUNT(*) FROM store.inventory_reservations
WHERE status = 'active' AND expires_at > NOW();

-- Expired but not cleaned up
SELECT COUNT(*) FROM store.inventory_reservations
WHERE status = 'active' AND expires_at < NOW();

-- Low stock products
SELECT id, name, stock_quantity, low_stock_threshold
FROM catalog.products
WHERE stock_quantity <= low_stock_threshold;

-- Products on backorder
SELECT p.id, p.name, p.stock_quantity,
       COALESCE(SUM(ir.quantity), 0) as reserved
FROM catalog.products p
LEFT JOIN store.inventory_reservations ir
  ON p.id = ir.product_id AND ir.status = 'active'
GROUP BY p.id, p.name, p.stock_quantity
HAVING stock_quantity - COALESCE(SUM(ir.quantity), 0) < 0;
```

## Troubleshooting

### Issue: Reservations not expiring

**Solution:** Check cleanup job is running regularly

```bash
# Check last cleanup
curl https://yourdomain.com/api/inventory/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Issue: Overselling (sold more than available)

**Possible causes:**

1. Cleanup job not running
2. Multiple concurrent checkouts
3. Reservation not properly completed

**Solution:**

- Ensure cleanup runs every 15 minutes
- Check reservation completion in payment webhook
- Review logs for failed reservations

### Issue: Stock not restoring on cancellation

**Solution:** Check `updatePaymentStatus` handler for refunded orders

## Future Enhancements

- [ ] Admin dashboard for inventory management
- [ ] Low stock email alerts
- [ ] Inventory history/audit log
- [ ] Multi-warehouse support
- [ ] Automatic reorder points
- [ ] Reserved quantity display in admin
- [ ] Backorder notification when back in stock
