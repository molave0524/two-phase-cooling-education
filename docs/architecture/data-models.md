# Data Models & Component Architecture

## Database Schema

### Core Educational Content Models

#### Videos Table
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  topic_category VARCHAR(50) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  cdn_url VARCHAR(500),
  view_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB -- Additional video metadata
);

CREATE INDEX idx_videos_topic_difficulty ON videos(topic_category, difficulty_level);
CREATE INDEX idx_videos_published ON videos(published_at) WHERE published_at IS NOT NULL;
```

#### Educational Topics
```sql
CREATE TABLE educational_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  learning_objectives TEXT[],
  prerequisite_topics UUID[],
  order_sequence INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Progress & Analytics Models

#### User Progress Tracking
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES videos(id),
  completion_percentage DECIMAL(5,2) DEFAULT 0.0,
  watch_time_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_position_seconds INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_completion ON user_progress(completion_percentage);
```

#### AI Chat Sessions
```sql
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  context_data JSONB,
  total_messages INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id),
  message_type VARCHAR(20) CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### E-commerce Models

#### Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  specifications JSONB,
  images JSONB, -- Array of image URLs
  inventory_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Orders & Transactions
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  shipping_address JSONB,
  billing_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);
```

## Component Architecture

### Frontend Component Hierarchy

#### Core Layout Components
```
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── SearchBar
│   │   └── UserMenu
│   ├── Main
│   │   └── [Page Components]
│   └── Footer
│       ├── Links
│       └── ContactInfo
```

#### Educational Content Components
```
VideoPlayer
├── VideoControls
│   ├── PlayPauseButton
│   ├── ProgressBar
│   ├── VolumeControl
│   └── QualitySelector
├── VideoOverlay
│   ├── LoadingSpinner
│   ├── ErrorMessage
│   └── EducationalAnnotations
└── VideoMetadata
    ├── Title
    ├── Description
    └── RelatedVideos

EducationalDashboard
├── ProgressTracker
│   ├── CompletionMeter
│   ├── MilestoneIndicators
│   └── NextRecommendations
├── TopicExplorer
│   ├── TopicCard[]
│   └── PrerequisiteMap
└── AchievementBadges
```

#### AI Assistant Components
```
AIAssistant
├── ChatInterface
│   ├── MessageList
│   │   ├── UserMessage
│   │   └── AIMessage
│   ├── InputBox
│   │   ├── TextArea
│   │   └── SendButton
│   └── TypingIndicator
├── ContextPanel
│   ├── CurrentTopic
│   ├── RelevantVideos
│   └── TechnicalSpecs
└── SuggestedQuestions
    └── QuestionButton[]
```

#### E-commerce Components
```
ProductCatalog
├── ProductGrid
│   └── ProductCard[]
│       ├── ProductImage
│       ├── ProductInfo
│       └── AddToCartButton
├── ProductFilters
│   ├── CategoryFilter
│   ├── PriceFilter
│   └── SpecificationFilter
└── ProductSearch

ShoppingCart
├── CartItems
│   └── CartItem[]
│       ├── ProductDetails
│       ├── QuantitySelector
│       └── RemoveButton
├── CartSummary
│   ├── Subtotal
│   ├── TaxCalculation
│   ├── ShippingCalculation
│   └── Total
└── CheckoutButton

CheckoutFlow
├── CustomerInfo
│   ├── EmailInput
│   └── ContactForm
├── ShippingAddress
├── PaymentMethod
│   └── StripeElements
└── OrderConfirmation
```

## State Management Architecture

### Global State Structure (Zustand)

#### Video Player Store
```typescript
interface VideoPlayerState {
  currentVideo: Video | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  quality: VideoQuality;
  playbackRate: number;

  // Actions
  setCurrentVideo: (video: Video) => void;
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  setQuality: (quality: VideoQuality) => void;
}
```

#### User Progress Store
```typescript
interface UserProgressState {
  completedVideos: Set<string>;
  videoProgress: Map<string, VideoProgress>;
  currentTopic: string | null;
  learningPath: string[];

  // Actions
  markVideoComplete: (videoId: string) => void;
  updateProgress: (videoId: string, progress: VideoProgress) => void;
  setCurrentTopic: (topic: string) => void;
}
```

#### AI Assistant Store
```typescript
interface AIAssistantState {
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  context: AIContext;
  sessionId: string | null;

  // Actions
  toggleAssistant: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  updateContext: (context: Partial<AIContext>) => void;
}
```

#### Shopping Cart Store
```typescript
interface ShoppingCartState {
  items: CartItem[];
  isOpen: boolean;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;

  // Actions
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}
```

## API Data Flow Architecture

### Video Content Flow
```
Client Request → CDN Check → S3 Bucket → Video Delivery
                     ↓
              Analytics Collection → Database → Progress Tracking
```

### AI Assistant Flow
```
User Message → Context Assembly → OpenAI API → Response Processing
                     ↓
              Session Storage → Database → Analytics
```

### E-commerce Flow
```
Product Request → Cache Check → Database → Product Data
Add to Cart → State Update → Session Storage → Checkout Flow
Payment → Stripe API → Order Processing → Fulfillment
```

## Data Validation & Constraints

### Input Validation Rules
```typescript
// Video metadata validation
const VideoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_seconds: z.number().positive(),
  topic_category: z.string().min(1).max(50)
});

// User progress validation
const ProgressSchema = z.object({
  completion_percentage: z.number().min(0).max(100),
  watch_time_seconds: z.number().nonnegative(),
  last_position_seconds: z.number().nonnegative()
});

// Order validation
const OrderSchema = z.object({
  user_email: z.string().email(),
  total_amount: z.number().positive(),
  shipping_address: AddressSchema,
  billing_address: AddressSchema
});
```

### Performance Constraints
- **Video Loading**: First frame within 2 seconds
- **Database Queries**: < 100ms for simple queries, < 500ms for complex
- **AI Response Time**: < 3 seconds for standard questions
- **Cart Operations**: < 200ms for state updates
- **Progress Tracking**: Batch updates every 30 seconds

### Security Constraints
- **Data Encryption**: All PII encrypted at rest
- **API Rate Limiting**: 100 requests/minute per IP
- **Session Management**: 24-hour timeout for inactive sessions
- **Payment Security**: PCI DSS compliance through Stripe
- **Content Validation**: All user inputs sanitized and validated