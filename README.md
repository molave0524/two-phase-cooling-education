# Two-Phase Cooling Education Center

An innovative educational platform showcasing revolutionary two-phase cooling technology through interactive demonstrations, AI technical assistance, and comprehensive learning resources.

## 🎯 Project Overview

This platform transforms how cooling technology is understood by providing:
- **Interactive Video Demonstrations** - Pre-recorded professional testing scenarios
- **AI Technical Assistant** - Instant expert guidance on cooling technology
- **Educational Content** - Progressive learning from basics to advanced concepts
- **Performance Metrics** - Real-world testing data and comparisons
- **E-commerce Integration** - Direct product access with educational foundation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd simple-todo

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Homepage
│   └── providers.tsx      # Context providers
├── components/            # React components
│   ├── ai/               # AI assistant components
│   ├── layout/           # Header, Footer
│   ├── product/          # Product showcase
│   ├── sections/         # Homepage sections
│   └── video/            # Video player
├── lib/                  # Utilities and services
│   ├── ai/              # AI service integration
│   ├── database/        # Database client and services
│   ├── stores/          # Zustand state management
│   └── monitoring/      # Performance monitoring
└── hooks/               # Custom React hooks
```

## 🎨 Key Features

### Educational Philosophy: "Experience Over Selling"
- Video demonstrations take priority over product marketing
- Progressive disclosure of technical complexity
- AI assistant provides educational support, not sales pressure
- Data-driven credibility through performance metrics

### Technical Highlights
- **Next.js 14** with App Router and Server Components
- **TypeScript** for type safety
- **Tailwind CSS** with custom design system
- **Prisma** for database management
- **Zustand** for state management
- **OpenAI Integration** with circuit breaker pattern
- **Responsive Design** optimized for all devices

### Environmental Responsibility
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

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests

# Performance
npm run cdn-test            # Test CDN performance
npm run performance-monitor # Start performance monitoring
```

## 🌍 Environment Configuration

### Demo Mode (Default)
- Uses sample data and mock services
- AI assistant falls back to FAQ system
- No external service dependencies

### Production Mode
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for AI assistant
- `AWS_*` - AWS credentials for CDN and monitoring
- `STRIPE_*` - Stripe keys for payment processing

See `.env.example` for complete configuration options.

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker
```bash
# Build image
docker build -t two-phase-cooling .

# Run container
docker run -p 3000:3000 two-phase-cooling
```

### Static Export
```bash
# Generate static files
npm run build
# Deploy /out directory to any static host
```

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

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, Custom Design System
- **State:** Zustand, React Context
- **Database:** PostgreSQL, Prisma ORM
- **AI:** OpenAI GPT-4 with circuit breaker
- **Video:** Video.js with adaptive streaming
- **Payments:** Stripe integration
- **Deployment:** Vercel, AWS services
- **Monitoring:** Custom performance tracking

## 📄 License

Private repository - All rights reserved.

## 🤝 Contributing

This is a private educational project. For questions or contributions, please contact the development team.

---

**Built with passion for thermal innovation and environmental responsibility** 🌿⚡