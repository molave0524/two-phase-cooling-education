# Development Roadmap - Next Steps

**Date:** October 2, 2025
**Project:** Two-Phase Cooling Education Center
**Current Status:** SKU feature completed and deployed

---

## Recently Completed (October 2, 2025)

### SKU Implementation - COMPLETED ✅

- **What was done:**
  - Added `sku` field to database schema (src/db/schema.ts:84)
  - Added SKU column to production Postgres database
  - Populated all 11 products with unique SKU values (TPC-CASE-XXX-###)
  - Added SKU display across the entire application:
    - Homepage product showcase (src/components/sections/ProductShowcase.tsx)
    - Products listing page (src/app/products/page.tsx)
    - Product detail pages (src/app/products/[slug]/page.tsx)
    - Product cards - all variants (src/components/product/ProductCard.tsx)
    - Shopping cart drawer (src/components/cart/CartDrawer.tsx)
    - Shopping cart page (src/app/cart/page.tsx)
  - All SKU displays use consistent styling: 12px monospace gray font
  - Changes committed and deployed to production

- **Database Details:**
  - Production database: Neon Postgres
  - Connection string stored in Vercel environment variables
  - All 11 products have SKU values populated
  - SKU format: TPC-CASE-{TYPE}-{NUMBER} (e.g., TPC-CASE-PRO-001)

- **Files Modified:**
  - src/db/schema.ts
  - src/app/products/[slug]/page.tsx
  - src/components/product/ProductCard.tsx
  - src/components/sections/ProductShowcase.tsx
  - src/components/cart/CartDrawer.tsx
  - src/app/cart/page.tsx
  - src/app/products/page.tsx

---

## Recommended Next Steps (Prioritized)

### 1. Order System Enhancement - HIGHEST PRIORITY

**Why this is important:**

- Critical for customer service and order tracking
- Customers need SKU in their order confirmations
- Required for fulfillment and shipping
- Builds on existing checkout flow

**What needs to be done:**

- Add SKU to order confirmation page
- Include SKU in order confirmation emails
- Display SKU in order history/details
- Add SKU to admin order management views
- Include SKU in packing slips/invoices

**Files to modify:**

- src/app/checkout/success/page.tsx (order confirmation)
- Email templates (if they exist)
- src/app/orders/[id]/page.tsx (order details)
- Order-related API routes

**Technical notes:**

- Order items already store productId and productName
- Need to add productSku field to order_items table
- Should capture SKU at time of order (in case it changes later)
- May need database migration for order_items table

---

### 2. Product Management Admin Interface

**Why this is important:**

- Allows you to manage products without touching the database directly
- Can edit SKU, pricing, inventory, descriptions, etc.
- Reduces risk of errors from manual database updates
- Enables non-technical team members to manage products

**What needs to be done:**

- Create admin dashboard at /admin or /dashboard
- Add authentication/authorization for admin access
- Build product CRUD interface:
  - List all products
  - Edit product details (including SKU)
  - Add new products
  - Delete/archive products
  - Manage inventory levels
  - Upload/manage product images

**Files to create:**

- src/app/admin/page.tsx (admin dashboard)
- src/app/admin/products/page.tsx (product list)
- src/app/admin/products/[id]/edit/page.tsx (edit product)
- src/app/admin/products/new/page.tsx (create product)
- src/app/api/admin/products/route.ts (API endpoints)

**Technical notes:**

- Need admin role/permission system
- Should use NextAuth.js for authentication (already implemented)
- Consider using React Hook Form for forms
- Need file upload for product images
- Should validate SKU uniqueness
- Add confirmation dialogs for destructive actions

---

### 3. Inventory Tracking System

**Why this is important:**

- Prevents overselling
- Tracks stock levels by SKU
- Enables low-stock alerts
- Automatic stock updates when orders are placed

**What needs to be done:**

- Enhance stockQuantity tracking
- Add inventory history/audit log
- Create low-stock alerts
- Build inventory dashboard
- Add bulk inventory updates
- Track inventory movements (sales, restocks, adjustments)

**Database changes needed:**

- Add inventory_history table to track changes
- Fields: id, product_id, sku, quantity_change, reason, timestamp, user_id
- Add inventory alert thresholds to products table

**Files to create:**

- src/app/admin/inventory/page.tsx
- src/app/api/admin/inventory/route.ts
- src/lib/inventory.ts (inventory management logic)

**Technical notes:**

- Stock should decrease when order is placed
- Consider reserved stock for pending orders
- Need transaction support to prevent race conditions
- Should send alerts when stock falls below threshold
- Track who made inventory adjustments

---

### 4. Analytics Dashboard

**Why this is important:**

- Understand which products are selling
- Track revenue by SKU
- Make data-driven business decisions
- Identify trends and patterns

**What needs to be done:**

- Build analytics dashboard
- Track metrics:
  - Sales by SKU
  - Revenue by product
  - Most viewed products
  - Conversion rates
  - Cart abandonment by product
  - Average order value
- Add date range filters
- Export reports to CSV
- Create visualizations (charts/graphs)

**Files to create:**

- src/app/admin/analytics/page.tsx
- src/app/api/admin/analytics/route.ts
- src/lib/analytics.ts

**Technical notes:**

- May want to use charting library (recharts, chart.js, etc.)
- Consider aggregating data for performance
- Add caching for expensive queries
- Track events client-side and server-side
- Consider using Google Analytics or Mixpanel integration

---

### 5. Export Features (Lower Priority)

**What needs to be done:**

- Export products to CSV with SKU
- Export orders to CSV with SKU
- Generate inventory reports
- Create printable packing slips

**Technical notes:**

- Use csv-writer or similar library
- Include all relevant fields
- Format properly for Excel compatibility

---

## Additional Context

### Current Tech Stack

- **Frontend:** Next.js 14.2.33 (App Router), React 18, TypeScript
- **Styling:** CSS Modules, Tailwind CSS
- **Database:**
  - Development: SQLite (better-sqlite3)
  - Production: PostgreSQL (Neon/Vercel Postgres)
  - ORM: Drizzle ORM
- **Authentication:** NextAuth.js with OAuth (Google)
- **Payments:** Stripe
- **State Management:** Zustand (cart store)
- **Deployment:** Vercel

### Environment Setup

- Development: localhost:3000
- Production: https://two-phase-cooling-education.vercel.app
- Database connection: Stored in .env.local (POSTGRES_URL)
- OAuth only configured for localhost:3000 in development

### Product SKU List (Current)

1. TPC-CASE-PRO-001 - Two-Phase Cooling Case Pro
2. TPC-CASE-COMPACT-002 - Two-Phase Cooling Case Compact
3. TPC-CASE-ELITE-003 - Two-Phase Cooling Case Elite
4. TPC-CASE-GAMING-004 - Two-Phase Cooling Case Gaming Edition
5. TPC-CASE-WS-005 - Two-Phase Cooling Case Workstation
6. TPC-CASE-SILENT-006 - Two-Phase Cooling Case Silent Pro
7. TPC-CASE-OC-007 - Two-Phase Cooling Case Overclock Edition
8. TPC-CASE-ECO-008 - Two-Phase Cooling Case Eco-Friendly
9. TPC-CASE-MINI-009 - Two-Phase Cooling Case Mini-ITX
10. TPC-CASE-CREATOR-010 - Two-Phase Cooling Case Creator Studio
11. TPC-CASE-SERVER-011 - Two-Phase Cooling Case Server Rack

### Database Migration Scripts (Available)

- `migrate-sku.js` - Adds SKU column and updates first 3 products
- `update-all-skus.js` - Updates all 11 products with SKU values
- `check-production-db.js` - Verifies database schema and data

### Git Repository

- Remote: https://github.com/molave0524/two-phase-cooling-education.git
- Main branch: main
- Production branch: master (used for PRs)
- Recent commits include all SKU implementation

---

## Notes for Next Session

### User Preferences

- Search by SKU is **lowest priority** (not needed soon)
- Focus on order system first
- Need practical features for business operations
- Prefer features that reduce manual work

### Known Issues/Considerations

- None currently - SKU feature is fully functional
- All tests should pass
- Production deployment is working correctly

### Quick Start Commands

```bash
# Start development server
npm run dev

# Run database migrations
npm run db:push

# Connect to production database
node check-production-db.js

# Run type checking
npm run type-check

# Run tests
npm test
```

---

## Success Criteria for Next Features

### Order System Enhancement

- [ ] SKU appears on order confirmation page
- [ ] SKU included in order confirmation emails
- [ ] SKU visible in order history
- [ ] SKU stored in database with order items
- [ ] Can filter/search orders by SKU (if search is added later)

### Admin Interface

- [ ] Secure admin-only access
- [ ] Can view all products with SKU
- [ ] Can edit SKU and validate uniqueness
- [ ] Can manage inventory levels
- [ ] Changes reflect immediately in database
- [ ] Proper error handling and validation

### Inventory Tracking

- [ ] Stock decreases when order placed
- [ ] Low stock alerts triggered at threshold
- [ ] Inventory history tracked
- [ ] Can view inventory movements
- [ ] Dashboard shows current stock levels

### Analytics

- [ ] See top selling products by SKU
- [ ] Revenue tracking by product
- [ ] Date range filtering works
- [ ] Can export data to CSV
- [ ] Charts/graphs display correctly

---

**End of Document**
