# Product Catalog Improvements - Development Plan

**Document Date:** 2025-10-04
**Project:** TwoPhase Education E-commerce Platform
**Audience:** Development Team
**Status:** Planning Phase

---

## Overview

This document outlines planned improvements to the product catalog system, organized into three development phases. These features are designed to enhance the user shopping experience and provide rich data for an AI-powered shopping assistant.

The AI Assistant will passively analyze user behavior, shopping cart contents, and browsing patterns to provide intelligent product recommendations and guidance. Users will have the option to disable AI assistance if desired.

---

## Current System Architecture

### Technology Stack
- **Framework:** Next.js 14.2.33 with App Router
- **Database:** PostgreSQL (Neon serverless on Vercel, postgres-js locally)
- **ORM:** Drizzle ORM
- **State Management:** React hooks + localStorage for client-side persistence

### Key Database Tables
- `products` - Main product catalog with SKU-based versioning
- `product_components` - Junction table for product-component relationships
- `carts` & `cart_items` - Shopping cart persistence
- `users` & `accounts` - Authentication via NextAuth.js

### Product System Features (Already Implemented)
- SKU-based product versioning (V01, V02, etc.)
- Product lifecycle states: `active`, `sunset`, `discontinued`
- Product types: `standalone` (complete products) vs `component` (individual parts)
- Product-component relationships via junction table
- Image galleries on detail pages
- Component display sorted by price (DESC) then SKU (ASC)

---

## Phase 1: Data Foundation

**Goal:** Build essential data structures and user-facing features that provide immediate value and establish the foundation for AI Assistant integration.

### 1.1 Component Price Summary

**Purpose:** Display price breakdown showing component value vs. bundle price to highlight savings.

**Location:** Product detail pages for standalone products

**Requirements:**
- Calculate total component price from `product_components` junction table
- Display individual component prices
- Show total component value
- Calculate and display bundle savings (component total - product price)
- Show savings as both dollar amount and percentage

**Database Changes:**
None required. Use existing `product_components` table and `componentPrice` field on products.

**API Changes:**
Product API already returns components with prices. No changes needed.

**UI Implementation:**
Add price summary section to `/src/app/products/[slug]/page.tsx`:
```
Component Price Summary
- Premium Pump Assembly A2: $129.99
- Performance Radiator R2: $129.99
- RGB Controller C1: $39.99
─────────────────────────────────
Total Component Value: $299.97
Bundle Price: $999.99
YOU SAVE: $-700.02 (-70%)
```

**Notes:**
- Only display for standalone products with components
- Handle cases where bundle might cost more than components (display differently)
- Use inline styles (no Tailwind, no CSS modules)

---

### 1.2 Product Categories

**Purpose:** Organize products into hierarchical categories for easier browsing and filtering.

**Current State:**
Products have a `categories` JSON field with flat array of category names:
```json
"categories": ["cooling-systems", "complete-kits", "pro"]
```

**Enhancement Requirements:**
1. Create category hierarchy system
2. Add category filtering to products page
3. Display category breadcrumbs on product detail pages
4. Create category landing pages

**Category Hierarchy (Proposed):**
```
Cooling Systems (cooling-systems)
├── Complete Kits (complete-kits)
│   ├── Budget (budget)
│   ├── Standard (standard)
│   ├── Pro (pro)
│   └── Elite (elite)
├── Performance (performance)
└── Silent (silent)

Components (components)
├── Pumps (pumps)
│   └── Assemblies (assemblies)
├── Radiators (radiators)
├── Motors (motors)
├── Impellers (impellers)
└── RGB (rgb)
```

**Database Changes:**
Option A: Keep existing JSON field, add category metadata to app config
Option B: Create new `categories` table with hierarchy (recommended for scalability)

**Recommended Approach (Option B):**
```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES categories(id),
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_categories (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, category_id)
);
```

**API Endpoints:**
- `GET /api/categories` - List all categories with hierarchy
- `GET /api/categories/[slug]` - Get category with products
- `GET /api/products?category=[slug]` - Filter products by category

**UI Components:**
1. Category navigation menu (header or sidebar)
2. Category filter on products page
3. Category breadcrumbs on product detail pages
4. Category landing pages (`/categories/[slug]`)

**Migration Strategy:**
1. Create categories table and seed with existing category names
2. Populate product_categories junction table from existing JSON data
3. Keep JSON field for backward compatibility initially
4. Update product creation/edit forms to use new category system

---

### 1.3 Side-by-Side Product Comparison

**Purpose:** Allow users to compare specifications, features, and pricing between two products from the same category.

**Requirements:**
- Compare exactly 2 products at a time
- Products must be from the same category
- Show side-by-side comparison of:
  - Basic info (name, SKU, price, image)
  - Features (checkmarks for availability)
  - Specifications (aligned rows)
  - Component breakdown (if standalone)
  - Stock availability
  - Shipping estimates

**UI Flow:**
1. User selects "Compare" button on product card or detail page
2. Product added to comparison (stored in localStorage)
3. When 2 products selected, show "View Comparison" button
4. Navigate to `/compare?products=slug1,slug2`
5. Display side-by-side comparison table
6. Allow swapping products or adding different ones

**Comparison Page Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Product 1              vs.        Product 2        │
├─────────────────────────────────────────────────────┤
│ [Image]                          [Image]            │
│ Cooling System Pro               Cooling System Std │
│ $999.99                          $599.99            │
├─────────────────────────────────────────────────────┤
│ Features                                            │
│ Premium pump          ✓                      ✗      │
│ 360mm radiator        ✓             240mm radiator  │
│ RGB lighting          ✓                      ✓      │
│ 3-year warranty       ✓             2-year warranty │
├─────────────────────────────────────────────────────┤
│ Specifications                                      │
│ Cooling Capacity      350W TDP              200W TDP│
│ Fluid Type            Dielectric            Dielectric│
│ Noise Level           22dBA                 25dBA   │
├─────────────────────────────────────────────────────┤
│ Included Components                                 │
│ Pump Assembly         A2 ($129.99)          A1 ($89.99)│
│ Radiator              R2 ($129.99)          R1 ($79.99)│
│ RGB Controller        C1 ($39.99)           C1 ($39.99)│
│ Total Value           $299.97               $209.97 │
│ YOU SAVE              $-700.02              $-390.02│
└─────────────────────────────────────────────────────┘
```

**State Management:**
```typescript
// localStorage structure
{
  "productComparison": {
    "products": ["cooling-system-pro", "cooling-system-standard"],
    "category": "cooling-systems",
    "addedAt": "2025-10-04T23:30:00Z"
  }
}
```

**API Requirements:**
- `GET /api/products/compare?slugs=slug1,slug2` - Returns both products with normalized comparison data
- Validate products are from same category
- Return structured comparison data (aligned specifications, feature matrix)

**Validation Rules:**
- Maximum 2 products in comparison
- Products must share at least one category
- If products have different specification fields, show all fields (mark N/A for missing)

**AI Assistant Integration:**
- AI can suggest comparison when user views similar products
- AI can explain key differences highlighted in comparison
- AI can recommend which product better fits user's stated needs

---

### 1.4 Wishlist

**Purpose:** Allow users to save products for later purchase and receive notifications about price changes or stock availability.

**Storage Strategy:**
- **Anonymous Users:** localStorage only
- **Authenticated Users:** Database persistence with localStorage sync

**Database Schema:**
```sql
CREATE TABLE wishlists (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE wishlist_items (
  id SERIAL PRIMARY KEY,
  wishlist_id INTEGER NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(wishlist_id, product_id)
);
```

**localStorage Structure (Anonymous Users):**
```typescript
{
  "wishlist": {
    "items": [
      {
        "productId": "cool_pro_v1",
        "slug": "cooling-system-pro",
        "addedAt": "2025-10-04T23:30:00Z",
        "notes": "For gaming PC build"
      }
    ]
  }
}
```

**API Endpoints:**
- `GET /api/wishlist` - Get user's wishlist (requires auth, falls back to localStorage)
- `POST /api/wishlist/items` - Add item to wishlist
- `DELETE /api/wishlist/items/[productId]` - Remove item
- `PUT /api/wishlist/items/[productId]` - Update notes

**UI Components:**
1. **Wishlist Button** - Heart icon on product cards and detail pages
2. **Wishlist Page** (`/wishlist`) - Display all saved items
3. **Wishlist Badge** - Show count in header
4. **Quick Add to Cart** - Convert wishlist items to cart items

**Features:**
- One-click add/remove from wishlist
- Visual indicator when product is in wishlist (filled heart)
- Optional notes per item
- Move to cart functionality
- Share wishlist (future enhancement)

**Sync Strategy (Authenticated Users):**
1. On login: Merge localStorage wishlist with DB wishlist
2. On logout: Keep localStorage copy for session continuity
3. Real-time sync: Update both localStorage and DB on changes

**AI Assistant Integration:**
- AI can reference wishlist items in recommendations
- AI can suggest when wishlist items go on sale
- AI can notify when out-of-stock wishlist items are back
- AI can suggest completing wishlist items based on cart contents

---

### 1.5 Recently Viewed Products

**Purpose:** Track user browsing history to provide personalized recommendations and quick access to previously viewed items.

**Storage Strategy:**
- **All Users:** localStorage (immediate access, no auth required)
- **Authenticated Users:** Optional DB persistence for cross-device history

**localStorage Structure:**
```typescript
{
  "recentlyViewed": {
    "products": [
      {
        "productId": "cool_pro_v1",
        "slug": "cooling-system-pro",
        "viewedAt": "2025-10-04T23:30:00Z",
        "viewDuration": 45000 // milliseconds spent on page
      }
    ],
    "maxItems": 10
  }
}
```

**Database Schema (Optional):**
```sql
CREATE TABLE product_views (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT, -- for anonymous tracking
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  view_duration INTEGER, -- seconds
  referrer TEXT,
  INDEX idx_user_viewed (user_id, viewed_at DESC),
  INDEX idx_session_viewed (session_id, viewed_at DESC)
);
```

**Implementation:**
1. Track product views on detail page mount
2. Store in localStorage (FIFO queue, max 10 items)
3. Optionally send to analytics endpoint for DB persistence
4. Display in sidebar or dedicated section

**UI Display Locations:**
1. **Product Detail Pages** - "Recently Viewed" carousel at bottom
2. **Homepage** - "Continue Shopping" section
3. **Empty Cart Page** - Suggest recently viewed items

**Tracking Logic:**
```typescript
// On product detail page mount
useEffect(() => {
  const startTime = Date.now()

  // Add to recently viewed
  addToRecentlyViewed({
    productId: product.id,
    slug: product.slug,
    viewedAt: new Date().toISOString()
  })

  // Track view duration on unmount
  return () => {
    const duration = Date.now() - startTime
    updateViewDuration(product.id, duration)
  }
}, [product.id])
```

**Features:**
- Auto-remove when product is purchased
- Show last 10 unique products
- Exclude current product from carousel
- Show product thumbnail, name, price
- Click to navigate to product detail

**Privacy Considerations:**
- Clear recently viewed option
- Respect "Do Not Track" browser setting
- Anonymous session tracking uses temporary session ID
- Authenticated tracking requires user consent

**AI Assistant Integration:**
- AI can understand user interests from browsing patterns
- AI can suggest products based on viewing history
- AI can identify when user is comparison shopping (multiple views in same category)
- AI can suggest "You were looking at X, it's now on sale"

---

## Phase 2: AI Assistant Foundation

**Goal:** Build backend infrastructure and APIs that enable intelligent AI-powered shopping assistance.

### 2.1 Shopping Cart Analysis API

**Purpose:** Provide structured data about cart contents for AI to analyze and make recommendations.

**Endpoint:** `GET /api/cart/analysis`

**Response Structure:**
```json
{
  "cart": {
    "itemCount": 3,
    "totalValue": 1599.97,
    "items": [
      {
        "product": { /* full product details */ },
        "quantity": 1,
        "subtotal": 999.99
      }
    ]
  },
  "analysis": {
    "categories": ["cooling-systems", "components"],
    "productTypes": {
      "standalone": 1,
      "component": 2
    },
    "totalSavings": 100.02,
    "compatibility": {
      "issues": [],
      "warnings": [
        "Pump A2 is already included in Cooling System Pro"
      ]
    },
    "recommendations": {
      "complements": ["TPC-FAN-F01-V01"], // Products that work well with cart items
      "upgrades": ["TPC-COOL-PRO-V02"], // Newer versions
      "bundles": ["TPC-COOL-ELT-V01"] // Complete kits that include cart items
    }
  }
}
```

**Analysis Logic:**
1. **Compatibility Check** - Detect duplicate components or incompatible parts
2. **Value Analysis** - Calculate if buying bundle would be cheaper
3. **Completeness Check** - Identify missing required components
4. **Upgrade Detection** - Find newer versions of products in cart

**AI Use Cases:**
- "I notice you have Pump A2 in your cart, but it's already included in the Cooling System Pro you added"
- "You could save $200 by purchasing the Elite bundle instead of these individual components"
- "This radiator requires 3x 120mm fans - would you like me to suggest compatible options?"

---

### 2.2 Enhanced Product Comparison API

**Purpose:** Provide AI-readable comparison data for explaining product differences.

**Endpoint:** `GET /api/products/compare?slugs=slug1,slug2&format=ai`

**Response Structure:**
```json
{
  "products": [ /* full product objects */ ],
  "comparison": {
    "pricesDiffer": true,
    "priceDifference": 400.00,
    "percentDifference": 40.0,
    "keyDifferences": [
      {
        "field": "specifications.cooling.capacity",
        "product1": "350W TDP",
        "product2": "200W TDP",
        "significance": "high"
      },
      {
        "field": "specifications.warranty.duration",
        "product1": "3 years",
        "product2": "2 years",
        "significance": "medium"
      }
    ],
    "featuresOnlyIn": {
      "product1": ["Premium pump assembly", "360mm radiator"],
      "product2": []
    },
    "recommendation": {
      "betterValue": "product2", // Based on price-to-feature ratio
      "betterPerformance": "product1",
      "reasoning": "Product 1 offers 75% higher cooling capacity and longer warranty, but costs 67% more"
    }
  }
}
```

**AI Use Cases:**
- "The Pro model has 75% higher cooling capacity, but costs $400 more. For your stated needs (gaming PC), the Standard model should be sufficient."
- "The main difference is the radiator size - 360mm vs 240mm. The larger radiator provides better cooling but requires more case space."

---

### 2.3 Bulk Operations System

**Purpose:** Enable administrators to manage products across environments (dev → staging → prod) using primary key-based promotion.

**Requirements:**
1. Bulk update product prices, status, availability
2. Export product data with relationships
3. Import product data preserving primary keys
4. Validate data before import
5. Audit trail for all changes

**Database Tables:**
```sql
CREATE TABLE bulk_operations (
  id SERIAL PRIMARY KEY,
  operation_type TEXT NOT NULL, -- 'export', 'import', 'update', 'promote'
  user_id TEXT NOT NULL REFERENCES users(id),
  environment TEXT NOT NULL, -- 'development', 'staging', 'production'
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
  items_count INTEGER,
  success_count INTEGER,
  error_count INTEGER,
  data JSONB, -- Operation details
  errors JSONB, -- Error details if failed
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE bulk_operation_items (
  id SERIAL PRIMARY KEY,
  operation_id INTEGER NOT NULL REFERENCES bulk_operations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'product', 'category', 'component_relationship'
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  old_data JSONB,
  new_data JSONB,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  error_message TEXT,
  processed_at TIMESTAMP
);
```

**Admin UI Features:**

**1. Bulk Price Update**
- Select multiple products (checkbox selection or filter-based)
- Apply percentage increase/decrease or flat amount
- Preview changes before applying
- Schedule changes for future date

**2. Bulk Status Change**
- Change multiple products from active → sunset
- Set sunset date and reason
- Optionally link to replacement products

**3. Export/Import Operations**
- Export products with all relationships (components, categories, images)
- Export format: JSON with PK preservation
- Import validates:
  - PK conflicts
  - Foreign key references
  - Data type compliance
  - Business rules (e.g., no self-referencing components)

**4. Environment Promotion**
- Select products to promote from dev → staging → prod
- Validates dependencies (all referenced components exist in target)
- Creates promotion package with all related data
- Dry-run mode to preview changes
- Rollback capability

**Export Format (JSON):**
```json
{
  "version": "1.0",
  "environment": "development",
  "exportedAt": "2025-10-04T23:30:00Z",
  "exportedBy": "user@example.com",
  "entities": {
    "products": [
      {
        "id": "cool_pro_v1",
        "name": "Cooling System Pro",
        // ... all product fields
      }
    ],
    "categories": [ /* ... */ ],
    "productCategories": [ /* junction table data */ ],
    "productComponents": [ /* junction table data */ ]
  },
  "dependencies": {
    "requiredProducts": ["pump_a02_v1", "radi_r02_v1"],
    "requiredCategories": ["cooling-systems", "pro"]
  }
}
```

**API Endpoints:**
- `POST /api/admin/bulk/export` - Export selected products
- `POST /api/admin/bulk/import` - Import product data
- `POST /api/admin/bulk/validate` - Validate import data without applying
- `POST /api/admin/bulk/promote` - Promote products to next environment
- `GET /api/admin/bulk/operations` - List bulk operation history
- `GET /api/admin/bulk/operations/[id]` - Get operation details

**Security:**
- Require admin role
- Log all operations with user ID
- Email notifications for completed operations
- Backup before destructive operations

**CLI Tool (Optional):**
```bash
# Export products
npm run bulk export --products="cool_pro_v1,cool_std_v1" --output=export.json

# Import products
npm run bulk import --file=export.json --validate-only

# Promote to production
npm run bulk promote --file=export.json --target=production --dry-run
```

---

## Phase 3: User Engagement

### 3.1 Product Availability Alerts

**Purpose:** Notify users when out-of-stock products they're interested in become available.

**Database Schema:**
```sql
CREATE TABLE stock_alerts (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notified_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'notified', 'cancelled'
  UNIQUE(product_id, email)
);
```

**Features:**
1. **Alert Signup** - "Notify me when available" button on out-of-stock products
2. **Email Notifications** - Send email when stock status changes to in-stock
3. **Alert Management** - Users can view/cancel their alerts
4. **One-time Notifications** - Alert auto-cancelled after notification sent

**Workflow:**
1. User clicks "Notify Me" on out-of-stock product
2. Modal prompts for email (pre-filled if authenticated)
3. Alert created in database
4. Background job monitors stock changes
5. When product restocked, send email to all subscribers
6. Mark alerts as notified

**Background Job (Cron):**
```typescript
// Run every 5 minutes
async function checkStockAlerts() {
  // Find products that recently came back in stock
  const restockedProducts = await db.query.products.findMany({
    where: and(
      eq(products.inStock, true),
      gt(products.updatedAt, sql`NOW() - INTERVAL '5 minutes'`)
    )
  })

  for (const product of restockedProducts) {
    // Find active alerts for this product
    const alerts = await db.query.stockAlerts.findMany({
      where: and(
        eq(stockAlerts.productId, product.id),
        eq(stockAlerts.status, 'active')
      )
    })

    // Send notifications
    for (const alert of alerts) {
      await sendStockAlertEmail(alert.email, product)
      await markAlertNotified(alert.id)
    }
  }
}
```

**Email Template:**
```
Subject: [Product Name] is Back in Stock!

Hi there,

Good news! The product you were waiting for is now available:

[Product Image]
[Product Name]
[Price]
[Stock Status: In Stock]

[View Product] [Add to Cart]

This is a one-time notification. If you'd like to be notified again in the future, please visit the product page.

Thanks,
TwoPhase Education Team
```

**API Endpoints:**
- `POST /api/stock-alerts` - Create alert
- `GET /api/stock-alerts` - List user's alerts (requires auth)
- `DELETE /api/stock-alerts/[id]` - Cancel alert

**AI Assistant Integration:**
- AI can suggest creating alerts for out-of-stock items
- AI can remind user about active alerts
- AI can suggest alternatives while waiting for restocking

---

## Technical Implementation Notes

### Code Style Guidelines
- **No Tailwind CSS** - Use inline styles or CSS modules
- **No CSS Frameworks** - All styles written manually
- **TypeScript** - Strict type checking enabled
- **API Responses** - Use standardized response format from `@/lib/api-response`

### Data Migration Strategy
1. Create new tables/columns
2. Seed with existing data
3. Update APIs to use new structure
4. Update UI components
5. Deprecate old fields after validation
6. Remove deprecated fields in future release

### Testing Requirements
- Unit tests for business logic
- API integration tests
- E2E tests for critical user flows
- Performance tests for bulk operations

### Performance Considerations
- Cache category hierarchy (Redis or in-memory)
- Index frequently queried fields
- Paginate product lists
- Lazy load images
- Optimize database queries (avoid N+1)

### Accessibility
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance (WCAG AA)

---

## AI Assistant Design Principles

### Data Structure
- All API responses should be structured and consistent
- Include metadata for AI context (e.g., "significance" of differences)
- Provide reasoning data, not just raw numbers

### Integration Points
- Cart analysis for proactive suggestions
- Product comparison for explaining differences
- Wishlist for personalized recommendations
- Recently viewed for understanding user interests
- Category data for contextual navigation

### Privacy & Control
- Users can disable AI assistance
- AI doesn't make purchases without user confirmation
- Clear about when AI is analyzing user data
- Transparent about recommendation reasoning

---

## Success Metrics

### Phase 1
- **Component Price Summary:** Increase in bundle purchases vs. individual components
- **Product Categories:** Reduction in bounce rate on product pages
- **Product Comparison:** Engagement with comparison tool (% of users who compare before buying)
- **Wishlist:** Conversion rate from wishlist to purchase
- **Recently Viewed:** Return visit rate, re-engagement with previously viewed items

### Phase 2
- **Cart Analysis:** Reduction in cart abandonment due to compatibility issues
- **Bulk Operations:** Time saved on product management tasks
- **AI Recommendations:** Click-through rate on AI suggestions

### Phase 3
- **Stock Alerts:** Email open rate, conversion rate from alert to purchase
- **Overall:** Customer satisfaction score, average order value, repeat purchase rate

---

## Development Timeline (Estimates)

### Phase 1: Data Foundation
- Component Price Summary: 2-3 days
- Product Categories: 5-7 days (including migration)
- Product Comparison: 5-7 days
- Wishlist: 3-5 days
- Recently Viewed: 2-3 days
**Total: 3-4 weeks**

### Phase 2: AI Assistant Foundation
- Shopping Cart Analysis: 3-5 days
- Enhanced Comparison API: 2-3 days
- Bulk Operations: 7-10 days
**Total: 2-3 weeks**

### Phase 3: User Engagement
- Stock Alerts: 3-5 days
- Email notifications setup: 2-3 days
**Total: 1 week**

**Overall Timeline: 6-8 weeks for complete implementation**

---

## Next Steps

1. Review and approve this plan
2. Prioritize features within each phase
3. Set up project tracking (GitHub issues, project board)
4. Begin Phase 1 implementation starting with Component Price Summary
5. Schedule regular progress reviews

---

## Questions & Decisions Needed

1. **Category System:** Confirm approval for new category tables vs. keeping JSON field
2. **Wishlist Sync:** Should anonymous wishlists merge on login or replace?
3. **Comparison Limit:** Keep at 2 products or expand to 3-4?
4. **Email Service:** Which email provider (SendGrid, AWS SES, Resend)?
5. **AI Assistant:** Timeline for AI integration after Phase 2 completion?
6. **Performance Budget:** Page load time targets? API response time targets?

---

**Document Version:** 1.0
**Last Updated:** 2025-10-04
**Next Review:** After Phase 1 completion
