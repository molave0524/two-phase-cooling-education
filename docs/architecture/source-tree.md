# Source Tree Structure

## Project Organization (Turborepo Monorepo)

```
two-phase-cooling-education/
├── .bmad-core/                    # BMad methodology configuration
│   └── core-config.yaml
├── .github/                       # GitHub workflows and templates
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   └── security-scan.yml
│   └── ISSUE_TEMPLATE/
├── .husky/                        # Git hooks configuration
│   ├── pre-commit
│   └── pre-push
├── apps/                          # Application packages
│   ├── web/                       # Main Next.js application
│   ├── admin/                     # Admin dashboard (future)
│   └── docs/                      # Documentation site (future)
├── packages/                      # Shared packages
│   ├── ui/                        # Shared UI components
│   ├── database/                  # Prisma schema and migrations
│   ├── api-client/                # API SDK
│   ├── config/                    # Shared configuration
│   └── types/                     # TypeScript type definitions
├── tools/                         # Development tooling
│   ├── eslint-config/
│   ├── tailwind-config/
│   └── typescript-config/
├── docs/                          # Project documentation
│   ├── architecture/              # Technical architecture docs
│   ├── prd/                       # Product requirements (sharded)
│   └── *.md                       # Main documentation files
├── turbo.json                     # Turborepo configuration
├── package.json                   # Root package configuration
├── pnpm-workspace.yaml           # PNPM workspace configuration
└── README.md                      # Project overview
```

## Main Application Structure (`apps/web/`)

```
apps/web/
├── public/                        # Static assets
│   ├── videos/                    # Video thumbnails and samples
│   ├── images/                    # Product images and marketing assets
│   ├── icons/                     # Custom icons and favicons
│   └── manifest.json              # PWA manifest
├── src/
│   ├── app/                       # Next.js 14 App Router
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page
│   │   ├── loading.tsx            # Global loading UI
│   │   ├── error.tsx              # Global error page
│   │   ├── not-found.tsx          # 404 page
│   │   │
│   │   ├── education/             # Educational content section
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Educational hub
│   │   │   ├── videos/
│   │   │   │   ├── page.tsx       # Video library
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx   # Individual video pages
│   │   │   ├── topics/
│   │   │   │   ├── page.tsx       # Topic explorer
│   │   │   │   └── [topic]/
│   │   │   │       └── page.tsx   # Topic-specific content
│   │   │   └── progress/
│   │   │       └── page.tsx       # Learning dashboard
│   │   │
│   │   ├── products/              # E-commerce section
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Product catalog
│   │   │   └── [slug]/
│   │   │       └── page.tsx       # Product detail pages
│   │   │
│   │   ├── cart/
│   │   │   └── page.tsx           # Shopping cart
│   │   │
│   │   ├── checkout/
│   │   │   ├── page.tsx           # Checkout form
│   │   │   └── success/
│   │   │       └── page.tsx       # Order confirmation
│   │   │
│   │   ├── auth/                  # Authentication pages
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                   # API routes
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── videos/
│   │       │   ├── route.ts
│   │       │   ├── [id]/
│   │       │   │   └── route.ts
│   │       │   └── analytics/
│   │       │       └── route.ts
│   │       ├── ai/
│   │       │   ├── chat/
│   │       │   │   └── route.ts
│   │       │   └── context/
│   │       │       └── route.ts
│   │       ├── products/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── cart/
│   │       │   └── route.ts
│   │       ├── orders/
│   │       │   └── route.ts
│   │       ├── progress/
│   │       │   ├── video/
│   │       │   │   └── route.ts
│   │       │   └── dashboard/
│   │       │       └── route.ts
│   │       └── health/
│   │           └── route.ts
│   │
│   ├── components/                # React components
│   │   ├── ui/                    # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   └── index.ts           # Re-exports
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── navigation.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── mobile-menu.tsx
│   │   │
│   │   ├── video/                 # Video-related components
│   │   │   ├── video-player.tsx
│   │   │   ├── video-controls.tsx
│   │   │   ├── video-overlay.tsx
│   │   │   ├── video-metadata.tsx
│   │   │   ├── quality-selector.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   └── related-videos.tsx
│   │   │
│   │   ├── education/             # Educational components
│   │   │   ├── progress-tracker.tsx
│   │   │   ├── topic-card.tsx
│   │   │   ├── learning-path.tsx
│   │   │   ├── milestone-badge.tsx
│   │   │   ├── difficulty-indicator.tsx
│   │   │   └── recommendation-list.tsx
│   │   │
│   │   ├── ai/                    # AI Assistant components
│   │   │   ├── ai-assistant.tsx
│   │   │   ├── chat-interface.tsx
│   │   │   ├── chat-message.tsx
│   │   │   ├── typing-indicator.tsx
│   │   │   ├── context-panel.tsx
│   │   │   ├── suggested-questions.tsx
│   │   │   └── chat-history.tsx
│   │   │
│   │   ├── ecommerce/             # E-commerce components
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   ├── product-gallery.tsx
│   │   │   ├── cart-item.tsx
│   │   │   ├── cart-summary.tsx
│   │   │   ├── checkout-form.tsx
│   │   │   ├── payment-form.tsx
│   │   │   ├── shipping-form.tsx
│   │   │   └── order-summary.tsx
│   │   │
│   │   ├── monitoring/            # Monitoring components
│   │   │   ├── rum-collector.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── performance-monitor.tsx
│   │   │
│   │   └── providers/             # Context providers
│   │       ├── theme-provider.tsx
│   │       ├── video-provider.tsx
│   │       ├── cart-provider.tsx
│   │       ├── ai-provider.tsx
│   │       └── auth-provider.tsx
│   │
│   ├── stores/                    # Zustand state management
│   │   ├── video-store.ts
│   │   ├── ai-store.ts
│   │   ├── cart-store.ts
│   │   ├── user-progress-store.ts
│   │   └── index.ts               # Store combinations
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── auth/                  # Authentication utilities
│   │   │   ├── config.ts
│   │   │   ├── permissions.ts
│   │   │   └── middleware.ts
│   │   │
│   │   ├── services/              # Service layer
│   │   │   ├── video-service.ts
│   │   │   ├── ai-service.ts
│   │   │   ├── commerce-service.ts
│   │   │   ├── analytics-service.ts
│   │   │   └── user-service.ts
│   │   │
│   │   ├── security/              # Security utilities
│   │   │   ├── encryption.ts
│   │   │   ├── validation.ts
│   │   │   └── sanitization.ts
│   │   │
│   │   ├── monitoring/            # Monitoring utilities
│   │   │   ├── logger.ts
│   │   │   ├── metrics.ts
│   │   │   └── error-handler.ts
│   │   │
│   │   ├── utils/                 # General utilities
│   │   │   ├── format-duration.ts
│   │   │   ├── video-helpers.ts
│   │   │   ├── api-helpers.ts
│   │   │   ├── date-helpers.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── db.ts                  # Database connection
│   │   ├── cache.ts               # Redis caching
│   │   └── env.ts                 # Environment validation
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-video-progress.ts
│   │   ├── use-ai-chat.ts
│   │   ├── use-shopping-cart.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-debounce.ts
│   │   └── use-intersection-observer.ts
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── video.ts
│   │   ├── user.ts
│   │   ├── ai.ts
│   │   ├── commerce.ts
│   │   ├── api.ts
│   │   └── global.d.ts
│   │
│   └── styles/                    # Styling files
│       ├── globals.css
│       ├── components.css
│       └── themes.css
│
├── __tests__/                     # Test files
│   ├── components/
│   ├── api/
│   ├── integration/
│   └── fixtures/
│
├── prisma/                        # Database schema and migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── vitest.config.ts               # Vitest testing configuration
├── playwright.config.ts           # Playwright E2E configuration
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc.js                 # Prettier configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Package dependencies
└── .env.example                   # Environment variables template
```

## Shared Packages Structure

### UI Package (`packages/ui/`)
```
packages/ui/
├── src/
│   ├── components/
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   ├── button.stories.tsx
│   │   │   └── button.test.tsx
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Database Package (`packages/database/`)
```
packages/database/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── client.ts
│   └── types.ts
└── package.json
```

### API Client Package (`packages/api-client/`)
```
packages/api-client/
├── src/
│   ├── video-client.ts
│   ├── ai-client.ts
│   ├── commerce-client.ts
│   ├── types.ts
│   └── index.ts
└── package.json
```

## Configuration Files Location

### Root Configuration
- `turbo.json` - Turborepo build configuration
- `pnpm-workspace.yaml` - PNPM workspace definition
- `.gitignore` - Git ignore patterns
- `.env.example` - Environment variable template

### Application Configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `vitest.config.ts` - Unit testing configuration
- `playwright.config.ts` - E2E testing configuration

### Development Tools
- `.eslintrc.js` - Code linting rules
- `.prettierrc.js` - Code formatting rules
- `tsconfig.json` - TypeScript compilation settings
- `.husky/` - Git hooks for quality gates

## Build Output Structure

### Development Build
```
.next/
├── cache/
├── server/
├── static/
└── trace
```

### Production Build
```
.vercel/
├── output/
│   ├── functions/
│   ├── static/
│   └── config.json
└── project.json
```

This source tree structure follows modern Next.js 14 conventions with the App Router, implements clean architecture principles, and supports the educational platform's specific requirements for video delivery, AI integration, and e-commerce functionality.