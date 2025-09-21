# Frontend & Backend Architecture

## Frontend Architecture

### Next.js 14 Application Structure

#### App Router Structure
```
src/app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Landing page with video demonstrations
├── globals.css                # Global styles and Tailwind imports
├── loading.tsx                # Global loading UI
├── error.tsx                  # Global error handling
├── not-found.tsx              # 404 page
│
├── education/
│   ├── layout.tsx             # Educational section layout
│   ├── page.tsx               # Educational hub
│   ├── videos/
│   │   ├── page.tsx           # Video library
│   │   └── [slug]/
│   │       └── page.tsx       # Individual video pages
│   ├── topics/
│   │   ├── page.tsx           # Topic explorer
│   │   └── [topic]/
│   │       └── page.tsx       # Topic-specific content
│   └── progress/
│       └── page.tsx           # Learning progress dashboard
│
├── products/
│   ├── layout.tsx             # E-commerce layout
│   ├── page.tsx               # Product catalog
│   └── [slug]/
│       └── page.tsx           # Product detail pages
│
├── cart/
│   └── page.tsx               # Shopping cart page
│
├── checkout/
│   ├── page.tsx               # Checkout form
│   └── success/
│       └── page.tsx           # Order confirmation
│
└── api/
    ├── videos/
    │   ├── route.ts           # Video CRUD operations
    │   ├── [id]/
    │   │   └── route.ts       # Individual video operations
    │   └── analytics/
    │       └── route.ts       # Video analytics
    ├── ai/
    │   ├── chat/
    │   │   └── route.ts       # AI chat endpoint
    │   └── context/
    │       └── route.ts       # Context management
    ├── products/
    │   ├── route.ts           # Product operations
    │   └── [id]/
    │       └── route.ts       # Individual product operations
    ├── cart/
    │   └── route.ts           # Cart management
    ├── orders/
    │   └── route.ts           # Order processing
    └── progress/
        └── route.ts           # User progress tracking
```

#### Component Library Structure
```
src/components/
├── ui/                        # Base UI components (shadcn/ui style)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/
│   ├── header.tsx
│   ├── navigation.tsx
│   ├── footer.tsx
│   └── sidebar.tsx
├── video/
│   ├── video-player.tsx       # Main video player component
│   ├── video-controls.tsx     # Custom controls
│   ├── video-overlay.tsx      # Loading/error states
│   ├── video-metadata.tsx     # Title, description, related
│   └── quality-selector.tsx   # Video quality options
├── education/
│   ├── progress-tracker.tsx   # Learning progress visualization
│   ├── topic-card.tsx         # Topic overview cards
│   ├── milestone-badge.tsx    # Achievement indicators
│   └── recommendation-list.tsx # Next video suggestions
├── ai/
│   ├── ai-assistant.tsx       # Main AI chat interface
│   ├── chat-message.tsx       # Individual message component
│   ├── typing-indicator.tsx   # AI typing animation
│   ├── context-panel.tsx      # Current context display
│   └── suggested-questions.tsx # Question suggestions
├── ecommerce/
│   ├── product-card.tsx       # Product display card
│   ├── product-grid.tsx       # Product listing grid
│   ├── cart-item.tsx          # Shopping cart item
│   ├── cart-summary.tsx       # Cart totals
│   ├── checkout-form.tsx      # Checkout form
│   └── payment-form.tsx       # Stripe payment form
└── providers/
    ├── theme-provider.tsx     # Theme context
    ├── video-provider.tsx     # Video player context
    ├── cart-provider.tsx      # Shopping cart context
    └── ai-provider.tsx        # AI assistant context
```

### State Management Architecture

#### Zustand Store Configuration
```typescript
// src/stores/video-store.ts
export const useVideoStore = create<VideoState>((set, get) => ({
  currentVideo: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  quality: 'auto',

  setCurrentVideo: (video) => set({ currentVideo: video }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seekTo: (time) => set({ currentTime: time }),
  updateProgress: () => {
    // Auto-save progress to database
    const { currentVideo, currentTime, duration } = get();
    if (currentVideo && currentTime > 0) {
      saveProgress(currentVideo.id, currentTime, duration);
    }
  }
}));

// src/stores/ai-store.ts
export const useAIStore = create<AIState>((set, get) => ({
  isOpen: false,
  messages: [],
  isTyping: false,
  context: {},

  sendMessage: async (content) => {
    set({ isTyping: true });
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: content, context: get().context })
    });
    const data = await response.json();
    set(state => ({
      messages: [...state.messages, { type: 'user', content }, data.message],
      isTyping: false
    }));
  }
}));
```

### Rendering Strategy

#### Server Components (RSC)
- **Landing Page**: Server-rendered for SEO and performance
- **Product Catalog**: Static generation with ISR for product updates
- **Educational Content**: Server-rendered with client hydration for video players
- **SEO Pages**: Fully server-rendered for search engine optimization

#### Client Components
- **Video Player**: Interactive video controls and progress tracking
- **AI Assistant**: Real-time chat interface with WebSocket connections
- **Shopping Cart**: Dynamic cart updates and calculations
- **User Progress**: Interactive progress tracking and analytics

#### Hybrid Approach
```typescript
// Server Component for initial data
export default async function VideoPage({ params }: { params: { slug: string } }) {
  const video = await getVideo(params.slug);
  const relatedVideos = await getRelatedVideos(video.topic);

  return (
    <div>
      <VideoMetadata video={video} /> {/* Server Component */}
      <VideoPlayer video={video} />    {/* Client Component */}
      <RelatedVideos videos={relatedVideos} /> {/* Server Component */}
    </div>
  );
}
```

## Backend Architecture

### API Layer Design

#### Next.js API Routes Structure
```typescript
// src/app/api/videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVideos, createVideo } from '@/lib/video-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic');
  const difficulty = searchParams.get('difficulty');

  try {
    const videos = await getVideos({ topic, difficulty });
    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const video = await createVideo(body);
    return NextResponse.json({ success: true, data: video }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create video' },
      { status: 400 }
    );
  }
}
```

#### Service Layer Architecture
```typescript
// src/lib/services/video-service.ts
export class VideoService {
  private db: PrismaClient;
  private s3: S3Client;

  constructor() {
    this.db = new PrismaClient();
    this.s3 = new S3Client({ region: 'us-east-1' });
  }

  async getVideos(filters: VideoFilters): Promise<Video[]> {
    return this.db.video.findMany({
      where: {
        topic_category: filters.topic,
        difficulty_level: filters.difficulty,
        published_at: { not: null }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getVideoWithAnalytics(id: string): Promise<VideoWithAnalytics> {
    const video = await this.db.video.findUnique({ where: { id } });
    const analytics = await this.getVideoAnalytics(id);
    return { ...video, analytics };
  }

  private async getVideoAnalytics(videoId: string) {
    return this.db.userProgress.aggregate({
      where: { video_id: videoId },
      _avg: { completion_percentage: true },
      _count: { user_id: true }
    });
  }
}

// src/lib/services/ai-service.ts
export class AIService {
  private openai: OpenAI;
  private knowledgeBase: VectorStore;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.knowledgeBase = new VectorStore();
  }

  async processMessage(message: string, context: AIContext): Promise<AIResponse> {
    const relevantDocs = await this.knowledgeBase.search(message);
    const systemPrompt = this.buildSystemPrompt(context, relevantDocs);

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return {
      content: response.choices[0].message.content,
      citations: relevantDocs.map(doc => doc.source),
      confidence: this.calculateConfidence(response)
    };
  }
}
```

### Database Layer

#### Prisma Schema Configuration
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Video {
  id              String   @id @default(cuid())
  title           String
  description     String?
  slug            String   @unique
  difficulty_level DifficultyLevel
  topic_category  String
  duration_seconds Int
  file_url        String
  thumbnail_url   String?
  cdn_url         String?
  view_count      Int      @default(0)
  engagement_score Decimal  @default(0.0)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  published_at    DateTime?
  is_featured     Boolean  @default(false)
  metadata        Json?

  user_progress   UserProgress[]

  @@map("videos")
}

model UserProgress {
  id                    String   @id @default(cuid())
  user_id               String
  video_id              String
  completion_percentage Decimal  @default(0.0)
  watch_time_seconds    Int      @default(0)
  completed_at          DateTime?
  last_position_seconds Int      @default(0)
  interaction_count     Int      @default(0)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  video                 Video    @relation(fields: [video_id], references: [id])

  @@unique([user_id, video_id])
  @@map("user_progress")
}

enum DifficultyLevel {
  beginner
  intermediate
  advanced
}
```

#### Database Connection Management
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Connection pooling configuration
export const dbConfig = {
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};
```

### Authentication & Authorization

#### NextAuth.js Configuration
```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  }
};

export default NextAuth(authOptions);
```

### Caching Strategy

#### Multi-Layer Caching
```typescript
// src/lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  // Video metadata caching (1 hour TTL)
  async cacheVideo(video: Video): Promise<void> {
    await redis.setex(`video:${video.id}`, 3600, JSON.stringify(video));
  }

  // User progress caching (5 minutes TTL)
  async cacheUserProgress(userId: string, progress: UserProgress[]): Promise<void> {
    await redis.setex(`progress:${userId}`, 300, JSON.stringify(progress));
  }

  // AI response caching (24 hours TTL)
  async cacheAIResponse(query: string, response: string): Promise<void> {
    const key = `ai:${Buffer.from(query).toString('base64')}`;
    await redis.setex(key, 86400, response);
  }

  // Product catalog caching (30 minutes TTL)
  async cacheProducts(products: Product[]): Promise<void> {
    await redis.setex('products:catalog', 1800, JSON.stringify(products));
  }
}

// CDN caching headers
export const setCacheHeaders = (res: NextResponse, maxAge: number) => {
  res.headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  res.headers.set('CDN-Cache-Control', `public, max-age=${maxAge}`);
  res.headers.set('Vercel-CDN-Cache-Control', `public, max-age=${maxAge}`);
};
```

### Error Handling & Monitoring

#### Centralized Error Handling
```typescript
// src/lib/error-handler.ts
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleApiError = (error: Error): NextResponse => {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
};

// Global error boundary
export const withErrorHandling = (handler: Function) => {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return handleApiError(error as Error);
    }
  };
};
```

### Performance Optimization

#### Database Query Optimization
```typescript
// src/lib/optimizations.ts
export const optimizedVideoQuery = {
  // Include related data in single query
  include: {
    user_progress: {
      where: { user_id: 'current_user_id' },
      select: { completion_percentage: true, last_position_seconds: true }
    }
  },

  // Order by engagement for better recommendations
  orderBy: [
    { is_featured: 'desc' },
    { engagement_score: 'desc' },
    { created_at: 'desc' }
  ],

  // Limit results for pagination
  take: 20,
  skip: 0
};

// Connection pooling for high concurrency
export const dbPool = {
  max: 20,
  min: 5,
  acquire: 30000,
  idle: 10000
};
```