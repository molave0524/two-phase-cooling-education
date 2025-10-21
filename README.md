# Two-Phase Cooling E-Commerce Platform

A comprehensive e-commerce platform for revolutionary two-phase cooling technology, featuring educational content, interactive demonstrations, AI technical assistance, and full e-commerce capabilities with advanced inventory and order management.

## 🎯 Project Overview

This platform has evolved from an educational showcase into a complete e-commerce solution, providing:

- **Full E-Commerce System** - Complete shopping cart, checkout, and payment processing
- **Admin Dashboard** - Comprehensive inventory, orders, and customer management
- **Interactive Video Demonstrations** - Pre-recorded professional testing scenarios
- **AI Technical Assistant** - Instant expert guidance on cooling technology and order support
- **Educational Content** - Progressive learning from basics to advanced concepts
- **Performance Metrics** - Real-world testing data and comparisons
- **Multi-Environment Deployment** - Development, Staging (UAT), and Production environments

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PNPM 8+ (recommended) or npm 8+

### Installation

**Using PNPM (recommended):**

```bash
# Clone the repository
git clone <repository-url>
cd simple-todo

# Install dependencies with PNPM
pnpm install

# Setup environment
cp .env.local.example .env.local

# Run development server
pnpm dev
```

**Using npm:**

```bash
# Clone the repository
git clone <repository-url>
cd simple-todo

# Install dependencies with npm
npm install

# Setup environment
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
two-phase-cooling-education/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard pages
│   │   │   ├── inventory/     # Inventory management
│   │   │   ├── orders/        # Order management
│   │   │   ├── customers/     # Customer management
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   └── reservations/  # Inventory reservations
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin APIs
│   │   │   ├── auth/          # Authentication APIs
│   │   │   ├── account/       # User account APIs
│   │   │   └── checkout/      # Checkout & payment APIs
│   │   ├── auth/              # Authentication pages
│   │   │   ├── signin/        # Sign in
│   │   │   ├── signup/        # Sign up
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── products/          # Product pages
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout flow
│   │   ├── account/           # User account
│   │   ├── devops/            # DevOps utilities
│   │   │   └── schema-comparison/
│   │   └── order-confirmation/
│   ├── components/            # React components
│   │   ├── admin/            # Admin-specific components
│   │   └── [other components]/
│   ├── db/                    # Database
│   │   ├── schemas/          # Modular schemas
│   │   │   ├── auth.ts       # Auth tables
│   │   │   ├── catalog.ts    # Product catalog
│   │   │   └── store.ts      # Orders & cart
│   │   └── index.ts          # Database instance
│   ├── lib/                   # Libraries & utilities
│   │   ├── auth.ts           # Auth helpers
│   │   ├── admin.ts          # Admin helpers
│   │   └── [other libs]/
│   ├── services/             # Business logic
│   ├── types/                # TypeScript types
│   └── styles/               # Global styles
├── scripts/                   # Utility scripts
│   ├── migrate.ts            # Database migrations
│   ├── migrate-dryrun.ts     # Test migrations
│   ├── backup-database.ts    # Database backup
│   ├── compare-schemas.ts    # Schema comparison
│   └── deploy-safe.ps1       # Safe deployment
├── drizzle/                  # Drizzle ORM
│   └── postgres/             # PostgreSQL migrations
├── .github/                  # GitHub configuration
├── public/                   # Static assets
└── package.json              # Dependencies & scripts
```

## 🎨 Key Features

### 🛒 E-Commerce Platform

- **Complete Shopping Experience**
  - Product catalog with SKU-based and slug-based routing
  - Shopping cart with session persistence
  - Secure checkout process with Stripe integration
  - Order confirmation and tracking
  - Email prepopulation for authenticated users

- **Admin Dashboard Suite**
  - **Dashboard Overview** - Real-time metrics and alerts
  - **Inventory Management** - Stock tracking, low-stock alerts, adjustments, and cleanup
  - **Order Management** - Process orders, view order details, manage order items
  - **Customer Management** - View and manage registered users
  - **Analytics Dashboard** - Performance insights and sales metrics
  - **Reservations System** - Inventory holds with automatic expiration and cleanup

- **Payment Processing**
  - Stripe integration for secure payments
  - Automated webhook notifications
  - Email confirmations for orders
  - Centralized shipping rate management

### 🔐 Authentication & Authorization

- **Multi-Provider Authentication**
  - Google OAuth (fully configured for multi-environment)
  - Email/password authentication
  - Password reset and forgot password flows
  - NextAuth.js session management

- **Role-Based Access Control**
  - Admin role implementation
  - Protected routes with middleware
  - User role management scripts

### 📚 Educational Philosophy: "Experience Over Selling"

- Video demonstrations take priority over product marketing
- Progressive disclosure of technical complexity
- AI assistant provides educational support, order status, and maintenance guidance
- Data-driven credibility through performance metrics

### 🛠️ Technical Highlights

- **Next.js 14** with App Router and Server Components
- **TypeScript** for type safety and better DX
- **Tailwind CSS** with custom design system
- **Drizzle ORM** with PostgreSQL (modular schemas)
- **Zustand** for state management
- **Google Generative AI** integration
- **Stripe** for payment processing
- **NextAuth.js** for authentication
- **Sentry** for error tracking and performance monitoring
- **Responsive Design** optimized for all devices

### 🗄️ Database & Infrastructure

- **Modular Schema Architecture**
  - Separate schemas for auth, catalog, and store
  - Drizzle ORM with PostgreSQL
  - Neon serverless database

- **DevOps Tools**
  - Schema comparison utility
  - Database migration scripts (dry-run and production)
  - Backup system
  - Health monitoring endpoints

### 🌱 Environmental Responsibility

- **GWP 20** cooling fluid (equivalent to gasoline)
- **Zero ODP** (ozone depletion potential)
- **98.6% reduction** in environmental impact vs traditional refrigerants

## 🛠️ Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database Management
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed database with sample data
npm run db:compare       # Compare local and deployed schemas
npm run db:backup        # Backup database
npm run db:migrate:dryrun # Test migrations without applying
npm run db:migrate:run    # Apply migrations to database
npm run db:fix-dev       # Fix development schema issues
npm run db:migrate:dev   # Apply migrations to dev environment

# Deployment
npm run deploy:safe      # Safe deployment with validation (PowerShell)
npm run deploy:check     # Check current branch before deploy

# Git Hooks
npm run prepare          # Set up Husky git hooks
```

## 🌍 Environment Configuration

### Multi-Environment Setup

The platform supports three environments:

- **Development** - Local development with hot reload
- **Staging (UAT)** - User acceptance testing environment
- **Production** - Live production environment

### Required Environment Variables

#### Authentication (NextAuth.js)

- `NEXTAUTH_URL` - Auto-detected from `VERCEL_BRANCH_URL` or set manually
- `NEXTAUTH_SECRET` - Secret for session encryption (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (separate for DEV/UAT/PROD)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

#### Database

- `DATABASE_URL` - PostgreSQL/Neon connection string

#### Payment Processing

- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

#### AI Assistant

- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Generative AI API key

#### Monitoring

- `SENTRY_DSN` - Sentry error tracking DSN
- `SENTRY_AUTH_TOKEN` - Sentry authentication token
- `NEXT_PUBLIC_SENTRY_DSN` - Public Sentry DSN

#### Rate Limiting

- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token

See `.env.local.example` for complete configuration template.

## 🚀 Deployment

### Vercel (Primary Platform)

#### Safe Deployment (Recommended)

```bash
# Use the safe deployment script with validation
npm run deploy:safe
```

This script:

- Validates you're on the correct branch
- Checks for uncommitted changes
- Confirms environment
- Safely deploys to Vercel

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy to preview/staging
vercel
```

#### Environment-Specific Deployments

```bash
# Staging/UAT environment
vercel --env staging

# Production environment
vercel --prod --env production
```

### OAuth Configuration

When deploying to new environments, ensure Google OAuth redirect URIs are configured:

```
https://your-deployment-url.vercel.app/api/auth/callback/google
```

**Tip:** Use wildcards in Google Console for flexible deployments:

```
https://your-project-*.vercel.app/api/auth/callback/google
```

### Database Migrations

Before deploying, ensure database is migrated:

```bash
# Test migration (dry-run)
npm run db:migrate:dryrun

# Apply migration
npm run db:migrate:run
```

## 🔑 Admin Access

### Setting Up Admin User

To grant admin access to a user, use the provided script:

```bash
# Run the set-admin-role script
npm run tsx scripts/set-admin-role.ts
```

This script will:

1. Prompt for the user's email address
2. Verify the user exists in the database
3. Set the user's role to 'admin'

### Accessing Admin Dashboard

Once a user has admin role:

1. Sign in to the application
2. Navigate to `/admin` route
3. Access admin features:
   - Dashboard overview at `/admin`
   - Inventory management at `/admin/inventory`
   - Order management at `/admin/orders`
   - Customer management at `/admin/customers`
   - Analytics at `/admin/analytics`
   - Reservations at `/admin/reservations`

### Admin Features

- **Real-time Metrics:** Product count, low stock alerts, pending orders, active reservations
- **Inventory Control:** Adjust stock levels, monitor low stock, manage product lifecycle
- **Order Processing:** View orders, update status, manage order items
- **Customer Insights:** View registered users and customer data
- **Reservations:** Monitor and cleanup expired inventory reservations

## 📊 Performance Targets

- **Page Load:** <3 seconds initial load
- **Video Streaming:** 1080p 60fps with adaptive quality
- **AI Response:** <2 seconds query response time
- **Uptime:** 99.9% availability
- **Concurrent Users:** 1000+ without degradation

## 🎓 Educational Goals

Transform cooling technology understanding through:

- **Visual Learning** - "Circuits getting wet" demonstrations
- **Scientific Credibility** - FLIR thermal imaging comparisons
- **Progressive Complexity** - From basic principles to advanced concepts
- **Interactive Support** - AI-powered technical assistance
- **Data-Driven Proof** - Real performance metrics and comparisons

## 🌱 Environmental Impact

Two-phase cooling technology offers:

- **47% lower peak temperatures** vs air cooling
- **33% higher thermal efficiency** vs liquid cooling
- **60% quieter operation** vs traditional systems
- **Superior performance** with minimal environmental footprint

## 🔗 Technology Stack

### Frontend

- **Framework:** Next.js 14 with App Router
- **UI Library:** React 18
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.x with custom design system
- **Icons:** Heroicons 2.x
- **Animations:** Framer Motion
- **State Management:** Zustand 4.x
- **Form Validation:** Zod

### Backend & Database

- **Database:** PostgreSQL 15+ (Neon Serverless)
- **ORM:** Drizzle ORM with modular schemas
- **Schema Management:** Drizzle Kit
- **Migrations:** Custom migration scripts with dry-run support

### Authentication & Security

- **Auth Framework:** NextAuth.js 4.x
- **OAuth Providers:** Google OAuth
- **Session Management:** JWT with secure cookies
- **Encryption:** bcryptjs for password hashing
- **Sanitization:** isomorphic-dompurify

### Payments & E-Commerce

- **Payment Processor:** Stripe 18+
- **Payment UI:** @stripe/react-stripe-js
- **Webhooks:** Automated order notifications

### AI & ML

- **AI Provider:** Google Generative AI (@google/generative-ai)
- **Use Cases:** Technical assistance, order support, maintenance guidance

### Data Fetching & Caching

- **Client Queries:** TanStack React Query 5.x
- **Rate Limiting:** Upstash Rate Limit with Redis

### Monitoring & Error Tracking

- **Error Tracking:** Sentry 10+ (Frontend & Backend)
- **Performance Monitoring:** Sentry Performance
- **Logging:** Custom audit logging system

### DevOps & Deployment

- **Hosting:** Vercel (multi-environment)
- **CI/CD:** Custom deployment scripts with validation
- **Version Control:** Git with Husky hooks
- **Code Quality:** ESLint, Prettier, TypeScript strict mode
- **Testing:** Jest 30+, React Testing Library

### Development Tools

- **Package Manager:** npm 8+ / pnpm 8+
- **Linting:** ESLint with Next.js config
- **Formatting:** Prettier
- **Git Hooks:** Husky + lint-staged
- **Database Studio:** Drizzle Studio

## 📈 Recent Major Improvements

### Platform Evolution (Q4 2025)

The platform has undergone significant expansion from an educational showcase to a full-featured e-commerce platform:

#### ✅ E-Commerce Infrastructure

- Complete shopping cart and checkout system
- Stripe payment integration with webhook automation
- Order management and tracking
- Inventory reservations with automatic expiration

#### ✅ Admin Dashboard Suite

- Real-time dashboard with metrics and alerts
- Comprehensive inventory management with low-stock monitoring
- Order processing and customer management
- Analytics and reporting capabilities
- Inventory reservations cleanup system

#### ✅ Authentication & Security

- Multi-provider authentication (Google OAuth + credentials)
- Fixed OAuth configuration for multi-environment deployments
- Role-based access control with admin privileges
- Session management with NextAuth.js
- Password reset and forgot password flows

#### ✅ Database & Infrastructure

- Migration from Prisma to Drizzle ORM
- Modular schema architecture (auth, catalog, store)
- Database comparison and migration utilities
- Backup and restore capabilities
- Health monitoring and diagnostics

#### ✅ DevOps & Deployment

- Safe deployment script with validation
- Multi-environment configuration (Dev, Staging, Production)
- Automated git hooks with Husky and lint-staged
- Schema comparison tools for deployment safety

#### ✅ Code Quality & Monitoring

- Sentry integration for error tracking and performance
- API standardization (46% complete - 17 of 37 routes)
- Comprehensive error handling and validation
- Security hardening (removed hardcoded credentials)
- Type safety improvements (user_id migration to TEXT)

#### ✅ User Experience

- Email prepopulation for authenticated users during checkout
- Order status and maintenance guidance in AI assistant
- Improved error messaging and handling
- Responsive admin interface
- Centralized shipping rate management

### Ongoing Work

- Completing API standardization across remaining routes
- Enhanced analytics and reporting features
- Performance optimizations
- Additional payment method support
- Extended admin capabilities

## 🔧 Troubleshooting

### Common Issues

#### OAuth Redirect URI Mismatch

**Problem:** Error 400: redirect_uri_mismatch when using Google OAuth

**Solution:**

1. Check your deployment URL in Vercel
2. Add the exact redirect URI to Google Cloud Console:
   ```
   https://your-deployment-url.vercel.app/api/auth/callback/google
   ```
3. Ensure environment variables don't have trailing newlines:
   ```bash
   # Use echo -n to prevent newlines
   echo -n "your-client-id" | vercel env add GOOGLE_CLIENT_ID production
   ```

#### Database Connection Issues

**Problem:** Unable to connect to database

**Solution:**

1. Verify DATABASE_URL is set correctly:
   ```bash
   vercel env ls | grep DATABASE_URL
   ```
2. Check database is accessible from your environment
3. Run database diagnostics:
   ```bash
   npm run db:compare
   ```

#### Migration Failures

**Problem:** Database migration fails

**Solution:**

1. Run dry-run first to test:
   ```bash
   npm run db:migrate:dryrun
   ```
2. Check schema comparison:
   ```bash
   npm run db:compare
   ```
3. Review migration logs for specific errors
4. Use fix-dev script for development environments:
   ```bash
   npm run db:fix-dev
   ```

#### Environment Variables Not Loading

**Problem:** Environment variables not available at runtime

**Solution:**

1. Ensure variables are set for correct environment (development/staging/production)
2. Redeploy after adding new variables:
   ```bash
   vercel redeploy <deployment-url>
   ```
3. Check for typos in variable names
4. Verify `NEXT_PUBLIC_` prefix for client-side variables

#### Admin Access Issues

**Problem:** Cannot access admin dashboard

**Solution:**

1. Verify user has admin role:
   ```bash
   npm run tsx scripts/check-user-role-column.ts
   ```
2. Set admin role if needed:
   ```bash
   npm run tsx scripts/set-admin-role.ts
   ```
3. Clear browser cookies and sign in again
4. Check middleware configuration in `src/middleware.ts`

### Getting Help

For additional support:

- Check the documentation in `/docs`
- Review recent commits for similar issues
- Check Sentry error logs for production issues
- Review OAuth configuration documentation: `OAUTH_SUCCESS_REPORT.md`

## 📄 License

Private repository - All rights reserved.

## 🤝 Contributing

This is a private e-commerce project. For questions or contributions, please contact the development team.

---

## 📞 Support & Contact

For technical support or business inquiries:

- Technical Issues: Check Sentry error logs or Troubleshooting section
- OAuth Issues: See `OAUTH_SUCCESS_REPORT.md` for configuration details
- Database Issues: Use provided diagnostic scripts in `scripts/` directory

---

**Built with passion for thermal innovation, environmental responsibility, and exceptional e-commerce experiences** 🌿⚡🛒

**Platform Status:** Production-ready with ongoing enhancements
**Version:** 0.1.1
**Last Major Update:** Q4 2025
