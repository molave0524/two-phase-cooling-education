# Security, Testing & Monitoring

## Security Architecture

### Authentication & Authorization

#### NextAuth.js Security Configuration
```typescript
// src/lib/auth/config.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      // Add custom claims
      if (user) {
        token.userId = user.id;
        token.role = await getUserRole(user.id);
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.userId as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
```

#### Role-Based Access Control (RBAC)
```typescript
// src/lib/auth/permissions.ts
export enum UserRole {
  ANONYMOUS = 'anonymous',
  REGISTERED = 'registered',
  PREMIUM = 'premium',
  ADMIN = 'admin'
}

export enum Permission {
  VIEW_FREE_CONTENT = 'view_free_content',
  VIEW_PREMIUM_CONTENT = 'view_premium_content',
  PURCHASE_PRODUCTS = 'purchase_products',
  ACCESS_AI_ASSISTANT = 'access_ai_assistant',
  MANAGE_CONTENT = 'manage_content',
  VIEW_ANALYTICS = 'view_analytics'
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ANONYMOUS]: [
    Permission.VIEW_FREE_CONTENT
  ],
  [UserRole.REGISTERED]: [
    Permission.VIEW_FREE_CONTENT,
    Permission.PURCHASE_PRODUCTS,
    Permission.ACCESS_AI_ASSISTANT
  ],
  [UserRole.PREMIUM]: [
    Permission.VIEW_FREE_CONTENT,
    Permission.VIEW_PREMIUM_CONTENT,
    Permission.PURCHASE_PRODUCTS,
    Permission.ACCESS_AI_ASSISTANT
  ],
  [UserRole.ADMIN]: Object.values(Permission)
};

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return rolePermissions[userRole].includes(permission);
};
```

#### API Route Protection
```typescript
// src/lib/auth/middleware.ts
export function withAuth(
  handler: NextApiHandler,
  requiredPermission?: Permission
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session && requiredPermission) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (requiredPermission && !hasPermission(session.user.role, requiredPermission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return handler(req, res);
  };
}

// Usage example
export default withAuth(async (req, res) => {
  // Protected route logic
}, Permission.VIEW_PREMIUM_CONTENT);
```

### Data Protection & Privacy

#### Data Encryption
```typescript
// src/lib/security/encryption.ts
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

export class DataEncryption {
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, secretKey);
    cipher.setAAD(Buffer.from('cooling-education', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipher(algorithm, secretKey);
    decipher.setAAD(Buffer.from('cooling-education', 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// PII data handling
export const encryptPII = (data: Record<string, any>): Record<string, any> => {
  const piiFields = ['email', 'phone', 'address', 'name'];
  const encrypted = { ...data };

  piiFields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = DataEncryption.encrypt(encrypted[field]);
    }
  });

  return encrypted;
};
```

#### Input Validation & Sanitization
```typescript
// src/lib/security/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Schema definitions
export const UserInputSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s]+$/),
  message: z.string().min(1).max(1000)
});

export const VideoQuerySchema = z.object({
  topic: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  page: z.coerce.number().min(1).max(100).default(1),
  limit: z.coerce.number().min(1).max(50).default(20)
});

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// Validation middleware
export const validateInput = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid input data', error.errors);
      }
      throw error;
    }
  };
};

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Security Headers & CORS

#### Security Headers Configuration
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "media-src 'self' https://cooling-education-videos.s3.amazonaws.com",
      "connect-src 'self' https://api.openai.com https://api.stripe.com",
      "font-src 'self'",
      "frame-src https://js.stripe.com"
    ].join('; ')
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

#### CORS Configuration
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // CORS handling
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://cooling-education.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', 'https://cooling-education.com');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## Comprehensive Testing Strategy

### Testing Pyramid Implementation

#### Unit Testing (70% of tests)
```typescript
// src/components/__tests__/ai-assistant.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIAssistant } from '../ai-assistant';
import { useAIStore } from '@/stores/ai-store';

// Mock the store
vi.mock('@/stores/ai-store');
const mockUseAIStore = vi.mocked(useAIStore);

describe('AIAssistant Component', () => {
  const mockSendMessage = vi.fn();

  beforeEach(() => {
    mockUseAIStore.mockReturnValue({
      isOpen: true,
      messages: [],
      isTyping: false,
      sendMessage: mockSendMessage,
      toggleAssistant: vi.fn(),
    });
  });

  it('should send message when form is submitted', async () => {
    render(<AIAssistant />);

    const input = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'What is two-phase cooling?' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('What is two-phase cooling?');
    });
  });

  it('should display typing indicator when AI is responding', () => {
    mockUseAIStore.mockReturnValue({
      isOpen: true,
      messages: [],
      isTyping: true,
      sendMessage: mockSendMessage,
      toggleAssistant: vi.fn(),
    });

    render(<AIAssistant />);
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });
});
```

#### Integration Testing (20% of tests)
```typescript
// src/__tests__/integration/video-progress.test.ts
import { db } from '@/lib/db';
import { POST } from '@/app/api/progress/video/route';
import { NextRequest } from 'next/server';

describe('Video Progress API Integration', () => {
  beforeEach(async () => {
    // Clean database
    await db.userProgress.deleteMany();
    await db.video.deleteMany();

    // Seed test data
    await db.video.create({
      data: {
        title: 'Test Video',
        slug: 'test-video',
        topic_category: 'cooling',
        difficulty_level: 'beginner',
        duration_seconds: 300,
        file_url: 'https://example.com/video.mp4'
      }
    });
  });

  it('should create user progress when tracking video', async () => {
    const request = new NextRequest('http://localhost/api/progress/video', {
      method: 'POST',
      body: JSON.stringify({
        videoId: 'video-id',
        userId: 'user-id',
        currentTime: 150,
        completionPercentage: 50
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify database state
    const progress = await db.userProgress.findFirst({
      where: {
        user_id: 'user-id',
        video_id: 'video-id'
      }
    });

    expect(progress).toBeTruthy();
    expect(progress?.completion_percentage).toBe(50);
  });
});
```

#### End-to-End Testing (10% of tests)
```typescript
// tests/e2e/purchase-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Purchase Flow', () => {
  test('should complete product purchase successfully', async ({ page }) => {
    // Navigate to product page
    await page.goto('/products/two-phase-cooling-case');
    await expect(page.locator('h1')).toContainText('Two-Phase Cooling Case');

    // Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');

    // Go to cart
    await page.click('[data-testid="cart-button"]');
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');

    // Fill shipping information
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="first-name"]', 'John');
    await page.fill('[data-testid="last-name"]', 'Doe');
    await page.fill('[data-testid="address"]', '123 Test St');
    await page.fill('[data-testid="city"]', 'Test City');
    await page.selectOption('[data-testid="state"]', 'CA');
    await page.fill('[data-testid="zip"]', '12345');

    // Fill payment information (test mode)
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');

    // Submit order
    await page.click('[data-testid="place-order"]');

    // Verify success
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toContainText(/ORD-\d+/);
  });
});
```

### Performance Testing

#### Load Testing Configuration
```typescript
// scripts/load-test.ts
import autocannon from 'autocannon';

const runLoadTest = async () => {
  console.log('Starting load test...');

  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 100,
    pipelining: 1,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/'
      },
      {
        method: 'GET',
        path: '/education/videos'
      },
      {
        method: 'POST',
        path: '/api/ai/chat',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          message: 'What is two-phase cooling?'
        })
      }
    ]
  });

  console.log('Load test results:');
  console.log(`Requests per second: ${result.requests.average}`);
  console.log(`Latency (avg): ${result.latency.average}ms`);
  console.log(`Latency (p99): ${result.latency.p99}ms`);
  console.log(`Errors: ${result.errors}`);

  // Assert performance thresholds
  if (result.latency.average > 500) {
    throw new Error('Average latency too high');
  }

  if (result.requests.average < 50) {
    throw new Error('Requests per second too low');
  }
};

runLoadTest().catch(console.error);
```

## Monitoring & Observability

### Application Performance Monitoring

#### Metrics Collection
```typescript
// src/lib/monitoring/metrics.ts
import { performance } from 'perf_hooks';

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  recordTiming(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }

  recordAPICall(endpoint: string, method: string, statusCode: number, duration: number): void {
    const metricName = `api.${method.toLowerCase()}.${endpoint.replace(/\//g, '_')}`;
    this.recordTiming(metricName, duration);

    // Record status code metrics
    const statusMetric = `api.status.${Math.floor(statusCode / 100)}xx`;
    this.recordTiming(statusMetric, 1);
  }

  getMetrics(): Record<string, { avg: number; p95: number; p99: number; count: number }> {
    const result: Record<string, any> = {};

    this.metrics.forEach((values, name) => {
      const sorted = values.sort((a, b) => a - b);
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        count: values.length
      };
    });

    return result;
  }
}

// API monitoring middleware
export const withMetrics = (handler: Function) => {
  return async (req: NextRequest, ...args: any[]) => {
    const start = performance.now();

    try {
      const response = await handler(req, ...args);
      const duration = performance.now() - start;

      MetricsCollector.getInstance().recordAPICall(
        req.url,
        req.method,
        response.status,
        duration
      );

      return response;
    } catch (error) {
      const duration = performance.now() - start;

      MetricsCollector.getInstance().recordAPICall(
        req.url,
        req.method,
        500,
        duration
      );

      throw error;
    }
  };
};
```

#### Real User Monitoring (RUM)
```typescript
// src/components/monitoring/rum-collector.tsx
'use client';

import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function RUMCollector() {
  useEffect(() => {
    // Collect Core Web Vitals
    getCLS(sendMetric);
    getFID(sendMetric);
    getFCP(sendMetric);
    getLCP(sendMetric);
    getTTFB(sendMetric);

    // Custom performance metrics
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        sendMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.loadEventStart,
          id: Math.random().toString(36).substring(7)
        });
      });
    }
  }, []);

  return null;
}

function sendMetric(metric: any) {
  // Send to analytics service
  fetch('/api/analytics/rum', {
    method: 'POST',
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch(console.error);
}
```

### Error Tracking & Logging

#### Structured Logging
```typescript
// src/lib/monitoring/logger.ts
import winston from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private winston: winston.Logger;

  constructor() {
    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'cooling-education',
        environment: process.env.NODE_ENV
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    if (process.env.NODE_ENV === 'production') {
      this.winston.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
      }));
      this.winston.add(new winston.transports.File({
        filename: 'logs/combined.log'
      }));
    }
  }

  log(level: LogLevel, message: string, meta?: any): void {
    this.winston.log(level, message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.winston.error(message, { error: error?.stack, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.winston.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.winston.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.winston.debug(message, meta);
  }
}

export const logger = new Logger();

// API logging middleware
export const withLogging = (handler: Function) => {
  return async (req: NextRequest, ...args: any[]) => {
    const requestId = Math.random().toString(36).substring(7);
    const start = Date.now();

    logger.info('API request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent')
    });

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;

      logger.info('API request completed', {
        requestId,
        statusCode: response.status,
        duration
      });

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error('API request failed', error as Error, {
        requestId,
        duration
      });

      throw error;
    }
  };
};
```

### Health Checks & Uptime Monitoring

#### Health Check Endpoints
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: 'unknown',
      redis: 'unknown',
      storage: 'unknown',
      ai_service: 'unknown'
    }
  };

  try {
    // Database health check
    await db.$queryRaw`SELECT 1`;
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  try {
    // Redis health check
    const redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    checks.checks.redis = 'healthy';
  } catch (error) {
    checks.checks.redis = 'unhealthy';
    checks.status = 'degraded';
  }

  try {
    // AI service health check
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    checks.checks.ai_service = response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.checks.ai_service = 'unhealthy';
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

#### Alerting Configuration
```yaml
# monitoring/alerts.yml
alerts:
  - name: "Application Down"
    query: 'up{job="cooling-education"} == 0'
    duration: "1m"
    severity: "critical"
    annotations:
      summary: "Application is down"
      description: "The cooling education application has been down for more than 1 minute"
    actions:
      - type: "slack"
        channel: "#alerts"
      - type: "pagerduty"
        integration_key: "${PAGERDUTY_KEY}"

  - name: "High Error Rate"
    query: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.1'
    duration: "5m"
    severity: "warning"
    annotations:
      summary: "High error rate detected"
      description: "Error rate is above 10% for the last 5 minutes"

  - name: "Database Connection Issues"
    query: 'postgres_up == 0'
    duration: "30s"
    severity: "critical"
    annotations:
      summary: "Database connection failed"
      description: "Unable to connect to PostgreSQL database"

  - name: "Slow Response Times"
    query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1'
    duration: "10m"
    severity: "warning"
    annotations:
      summary: "Slow response times"
      description: "95th percentile response time is above 1 second"
```

This completes the comprehensive architecture documentation for the Two-Phase Cooling Education Center website, covering all aspects from high-level design through security, testing, and monitoring implementation.