# Tech Stack & Infrastructure

## Tech Stack Selection

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions.

| Category | Technology | Version | Rationale |
|----------|------------|---------|-----------|
| **Frontend Framework** | Next.js | 14.x | React Server Components, built-in optimization, excellent video handling |
| **UI Library** | React | 18.x | Component reusability, ecosystem maturity |
| **Styling** | Tailwind CSS | 3.x | Rapid development, consistent design system |
| **State Management** | Zustand | 4.x | Lightweight, TypeScript-first, perfect for video player state |
| **Video Player** | Video.js | 8.x | Customizable, reliable, extensive plugin ecosystem |
| **AI Integration** | OpenAI API | GPT-4 | Technical accuracy, conversation quality |
| **Backend Runtime** | Node.js | 20.x LTS | Serverless compatibility, ecosystem maturity |
| **API Framework** | Next.js API Routes | 14.x | Integrated with frontend, serverless-ready |
| **Database** | PostgreSQL | 15.x | ACID compliance, JSON support, performance |
| **ORM** | Prisma | 5.x | Type safety, excellent DX, migration management |
| **Authentication** | NextAuth.js | 4.x | Multiple providers, secure defaults |
| **File Storage** | AWS S3 | Latest | Video storage, CDN integration |
| **CDN** | AWS CloudFront | Latest | Global video delivery, caching optimization |
| **Hosting** | Vercel | Latest | Next.js optimization, edge functions |
| **Serverless Functions** | AWS Lambda | Latest | Scalability, cost efficiency |
| **Payment Processing** | Stripe | Latest API | Reliable, comprehensive features |
| **Email Service** | AWS SES | Latest | Cost-effective, deliverability |
| **Monitoring** | Vercel Analytics | Latest | Built-in performance monitoring |
| **Error Tracking** | Sentry | Latest | Comprehensive error handling |

## Infrastructure Architecture

### AWS Services Stack
- **CloudFront**: Global CDN for video delivery
- **S3**: Video storage and static assets
- **Lambda**: Serverless API functions
- **RDS**: PostgreSQL database hosting
- **SES**: Transactional email delivery
- **CloudWatch**: Logging and monitoring

### Development Tools
- **Package Manager**: PNPM 8.x (workspace support, performance)
- **Monorepo**: Turborepo (build optimization, caching)
- **TypeScript**: 5.x (type safety across stack)
- **ESLint**: 8.x (code quality)
- **Prettier**: 3.x (code formatting)
- **Husky**: 8.x (git hooks)
- **Testing**: Vitest + Playwright (unit + e2e testing)

## API Specifications

### Core API Endpoints

#### Video Management
```
GET /api/videos
- Returns list of educational videos with metadata
- Supports filtering by topic, difficulty level
- Includes CDN URLs for optimized delivery

GET /api/videos/[id]
- Returns specific video details
- Includes related educational content
- Provides analytics data (view count, engagement)

POST /api/videos/analytics
- Records video interaction events
- Tracks educational progression
- Supports A/B testing data collection
```

#### AI Technical Assistant
```
POST /api/ai/chat
- Processes technical questions
- Maintains conversation context
- Returns structured responses with citations

POST /api/ai/context
- Updates AI context with user interactions
- Tracks educational progression
- Personalizes response accuracy
```

#### E-commerce Integration
```
GET /api/products
- Returns available cooling cases
- Includes pricing, specifications
- Supports configuration options

POST /api/cart
- Manages shopping cart state
- Calculates pricing with taxes/shipping
- Validates product availability

POST /api/orders
- Processes purchase transactions
- Integrates with Stripe payment processing
- Triggers fulfillment workflows
```

#### User Progress Tracking
```
POST /api/progress/video
- Records video completion status
- Tracks learning milestones
- Updates educational pathway

GET /api/progress/dashboard
- Returns user learning analytics
- Shows educational advancement
- Recommends next content
```

### API Response Formats

#### Standard Success Response
```json
{
  "success": true,
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0"
}
```

#### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Integration Specifications

### AI Assistant Integration
- **Context Window**: 32k tokens for comprehensive technical discussions
- **Response Caching**: Redis cache for common technical questions
- **Knowledge Base**: Vector embeddings for cooling technology documentation
- **Safety Filtering**: Content moderation for technical accuracy

### Video Delivery Optimization
- **Adaptive Bitrate**: Multiple quality levels (480p, 720p, 1080p, 4K)
- **CDN Strategy**: Edge caching with 24-hour TTL
- **Progressive Loading**: Segment-based delivery for immediate playback
- **Analytics Integration**: Detailed engagement metrics collection

### Payment Processing Flow
1. **Cart Validation**: Server-side price verification
2. **Stripe Integration**: Secure payment intent creation
3. **Order Processing**: Inventory check and reservation
4. **Fulfillment**: Automated shipping integration
5. **Confirmation**: Email notifications with tracking

### Performance Requirements
- **Page Load**: < 3 seconds initial load
- **Video Start**: < 2 seconds first frame
- **API Response**: < 500ms average response time
- **Uptime**: 99.9% availability target
- **CDN Coverage**: Global edge locations for sub-200ms delivery