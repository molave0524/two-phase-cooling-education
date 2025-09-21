# Development Workflow & Deployment

## Development Environment Setup

### Prerequisites & Installation
```bash
# Required software versions
Node.js: 20.x LTS
PNPM: 8.x
Git: Latest
PostgreSQL: 15.x
Redis: 7.x
AWS CLI: Latest

# Project setup
git clone <repository-url>
cd two-phase-cooling-education
pnpm install
cp .env.example .env.local

# Database setup
docker-compose up -d postgres redis
pnpm db:migrate
pnpm db:seed

# Start development servers
pnpm dev
```

### Environment Configuration
```bash
# .env.local (development)
DATABASE_URL="postgresql://dev:password@localhost:5432/cooling_education_dev"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-development-secret"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="your-openai-key"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="dev-cooling-education-videos"
```

### Monorepo Structure (Turborepo)
```
two-phase-cooling-education/
├── apps/
│   ├── web/                   # Main Next.js application
│   ├── admin/                 # Admin dashboard (future)
│   └── docs/                  # Documentation site
├── packages/
│   ├── ui/                    # Shared UI components
│   ├── database/              # Prisma schema and migrations
│   ├── api-client/            # API SDK
│   ├── config/                # Shared configuration
│   └── types/                 # TypeScript type definitions
├── tools/
│   ├── eslint-config/         # ESLint configuration
│   ├── tailwind-config/       # Tailwind CSS configuration
│   └── typescript-config/     # TypeScript configuration
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package configuration
└── pnpm-workspace.yaml        # PNPM workspace configuration
```

## Development Workflow

### Git Workflow & Branching Strategy

#### Branch Structure
```
main                    # Production-ready code
├── develop            # Integration branch
├── feature/*          # Feature development
├── hotfix/*           # Emergency production fixes
└── release/*          # Release preparation
```

#### Feature Development Workflow
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/video-player-enhancement

# Development cycle
git add .
git commit -m "feat: add video quality selector"
git push origin feature/video-player-enhancement

# Create pull request
gh pr create --title "feat: Enhanced video player with quality selection" \
             --body "Implements adaptive bitrate streaming with manual quality override"

# Code review and merge
# After approval, squash merge to develop
```

#### Commit Convention (Conventional Commits)
```
feat: new feature implementation
fix: bug fix
docs: documentation changes
style: formatting, no code change
refactor: code restructuring
test: adding/updating tests
chore: build process, dependencies
perf: performance improvements
```

### Code Quality Standards

#### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/exhaustive-deps': 'error',
    'no-console': 'warn',
    'prefer-const': 'error'
  },
  overrides: [
    {
      files: ['src/app/**/*.ts', 'src/app/**/*.tsx'],
      rules: {
        'import/no-default-export': 'off' // Allow default exports in app router
      }
    }
  ]
};
```

#### Prettier Configuration
```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid'
};
```

#### Pre-commit Hooks (Husky)
```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
pnpm type-check
pnpm test:unit
```

```json
// package.json - lint-staged configuration
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## Testing Strategy

### Test Architecture & Coverage

#### Testing Pyramid Structure
```
E2E Tests (Playwright)     <- Critical user journeys
    ↑
Integration Tests          <- API endpoints, database operations
    ↑
Unit Tests (Vitest)        <- Component logic, utility functions
```

#### Unit Testing Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

#### Component Testing Examples
```typescript
// src/components/__tests__/video-player.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from '../video-player';
import { mockVideo } from '@/test/fixtures';

describe('VideoPlayer', () => {
  it('should display video title and description', () => {
    render(<VideoPlayer video={mockVideo} />);

    expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
    expect(screen.getByText(mockVideo.description)).toBeInTheDocument();
  });

  it('should track progress when video plays', async () => {
    const onProgress = vi.fn();
    render(<VideoPlayer video={mockVideo} onProgress={onProgress} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Wait for progress tracking
    await vi.waitFor(() => {
      expect(onProgress).toHaveBeenCalled();
    });
  });
});
```

#### API Testing
```typescript
// src/app/api/__tests__/videos.test.ts
import { GET, POST } from '../videos/route';
import { NextRequest } from 'next/server';

describe('/api/videos', () => {
  describe('GET', () => {
    it('should return videos with proper filtering', async () => {
      const request = new NextRequest('http://localhost/api/videos?topic=cooling');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });
  });

  describe('POST', () => {
    it('should create new video with valid data', async () => {
      const request = new NextRequest('http://localhost/api/videos', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Video',
          description: 'Test Description',
          topic_category: 'cooling',
          difficulty_level: 'beginner'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });
});
```

#### E2E Testing (Playwright)
```typescript
// tests/e2e/video-learning-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Video Learning Flow', () => {
  test('should complete educational journey', async ({ page }) => {
    // Navigate to educational section
    await page.goto('/education');
    await expect(page.locator('h1')).toContainText('Educational Content');

    // Select and play video
    await page.click('[data-testid="video-card"]:first-child');
    await page.click('[data-testid="play-button"]');

    // Verify video playback
    await expect(page.locator('video')).toBeVisible();

    // Open AI assistant
    await page.click('[data-testid="ai-assistant-toggle"]');
    await page.fill('[data-testid="ai-input"]', 'What is two-phase cooling?');
    await page.click('[data-testid="ai-send"]');

    // Verify AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();

    // Check progress tracking
    await page.goto('/education/progress');
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });
});
```

## CI/CD Pipeline

### GitHub Actions Workflow

#### Main CI Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup PNPM
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test:unit --coverage

      - name: Integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Build application
        run: pnpm build

      - name: E2E tests
        run: pnpm test:e2e

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security audit
        run: pnpm audit
      - name: Run dependency check
        uses: securecodewarrior/github-action-add-sarif@v1
```

#### Deployment Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run database migrations
        run: pnpm db:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Invalidate CDN cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Run smoke tests
        run: pnpm test:smoke
        env:
          BASE_URL: https://cooling-education.com
```

## Deployment Architecture

### Environment Strategy

#### Development Environment
- **Hosting**: Local development with Docker Compose
- **Database**: PostgreSQL in Docker container
- **Storage**: Local file system for videos
- **CDN**: Disabled for local development
- **Monitoring**: Console logging only

#### Staging Environment
- **Hosting**: Vercel preview deployments
- **Database**: AWS RDS PostgreSQL (small instance)
- **Storage**: AWS S3 bucket (dev-videos)
- **CDN**: CloudFront distribution (staging)
- **Monitoring**: Basic Vercel analytics

#### Production Environment
- **Hosting**: Vercel Pro plan with edge functions
- **Database**: AWS RDS PostgreSQL (production cluster)
- **Storage**: AWS S3 bucket with versioning
- **CDN**: CloudFront with global edge locations
- **Monitoring**: Full observability stack

### Infrastructure as Code

#### AWS Resources (CDK)
```typescript
// infrastructure/stacks/storage-stack.ts
export class StorageStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // S3 bucket for video storage
    const videoBucket = new Bucket(this, 'VideosBucket', {
      bucketName: 'cooling-education-videos',
      versioned: true,
      cors: [{
        allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
        allowedOrigins: ['https://cooling-education.com'],
        allowedHeaders: ['*'],
        maxAge: 3000
      }]
    });

    // CloudFront distribution
    const distribution = new Distribution(this, 'VideosDistribution', {
      defaultBehavior: {
        origin: new S3Origin(videoBucket),
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      priceClass: PriceClass.PRICE_CLASS_ALL,
      geoRestriction: GeoRestriction.allowlist('US', 'CA')
    });
  }
}
```

### Database Migration Strategy

#### Migration Files
```sql
-- migrations/001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  topic_category VARCHAR(50) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_videos_topic_difficulty ON videos(topic_category, difficulty_level);
```

#### Migration Command
```bash
# Development migrations
pnpm db:migrate:dev

# Production migrations (with backup)
pnpm db:backup:create
pnpm db:migrate:deploy
pnpm db:migrate:verify
```

### Monitoring & Alerting

#### Performance Monitoring
- **Core Web Vitals**: Automated tracking via Vercel Analytics
- **API Performance**: Response time monitoring with alerts
- **Database Performance**: Query performance tracking
- **CDN Performance**: Cache hit rates and edge response times

#### Error Tracking
- **Frontend Errors**: Sentry integration with source maps
- **Backend Errors**: Structured logging with error aggregation
- **Database Errors**: Connection monitoring and query failures
- **Third-party Errors**: API failure tracking (OpenAI, Stripe)

#### Alerting Rules
```yaml
# Alerting configuration
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5 minutes"
    notification: "slack://dev-alerts"

  - name: "Slow API Response"
    condition: "p95_response_time > 1000ms"
    duration: "10 minutes"
    notification: "email://tech-team"

  - name: "Database Connection Issues"
    condition: "db_connection_errors > 0"
    duration: "1 minute"
    notification: "pagerduty://critical"
```