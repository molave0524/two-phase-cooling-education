# Sentry Error Tracking Setup Guide

This guide explains how to set up and use Sentry for error tracking and performance monitoring in the Two-Phase Cooling application.

## What is Sentry?

Sentry is an error tracking and performance monitoring platform that helps you:

- Track and diagnose errors in production
- Monitor application performance
- Get real-time alerts when issues occur
- See detailed error context (stack traces, user actions, environment)
- Track error frequency and impact

## Setup Steps

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new organization (or use existing)
3. Create a new project:
   - Platform: **Next.js**
   - Alert frequency: Choose based on your needs
   - Team: Assign to appropriate team

### 2. Get Your Sentry DSN

After creating the project:

1. Go to **Settings → Projects → [Your Project] → Client Keys (DSN)**
2. Copy the **DSN** value (looks like: `https://[key]@[org].ingest.sentry.io/[project]`)

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Required for error tracking
SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"
NEXT_PUBLIC_SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"

# Required for source map uploads (production only)
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
SENTRY_AUTH_TOKEN="your-auth-token"
```

**To get the auth token:**

1. Go to **Settings → Auth Tokens**
2. Click **Create New Token**
3. Scopes needed:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Copy the token and add to `.env.local`

### 4. Vercel Deployment Configuration

When deploying to Vercel:

1. Go to your Vercel project settings
2. Navigate to **Settings → Environment Variables**
3. Add the Sentry environment variables:
   - `SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN` (mark as "Sensitive")

4. For different environments (dev, staging, production):
   - Use different Sentry projects for each
   - Set environment-specific DSNs

## How It Works

### Automatic Error Tracking

Errors are automatically tracked in these scenarios:

1. **Unhandled Exceptions**: Any unhandled JavaScript errors
2. **Error Boundaries**: React error boundaries in `error.tsx` and `global-error.tsx`
3. **Logger Errors**: Using `logger.error()` in code
4. **API Errors**: Server-side errors in API routes
5. **Promise Rejections**: Unhandled promise rejections

### Performance Monitoring

Performance is tracked automatically:

- Page load times
- API response times
- Database query performance
- User interactions

Sample rate configuration:

- **Development**: 100% of transactions
- **Production**: 10% of transactions (configurable in `sentry.*.config.ts`)

### Session Replay

Sentry captures session replays for:

- 10% of normal sessions
- 100% of sessions with errors

This helps you see exactly what the user was doing when an error occurred.

## Testing Sentry Integration

### Development Testing

To test Sentry in development:

1. Enable Sentry in development by adding to `.env.local`:

   ```bash
   SENTRY_ENABLED="true"
   ```

2. Create a test error page at `src/app/sentry-test/page.tsx`:

   ```tsx
   'use client'

   export default function SentryTest() {
     return (
       <div className='p-8'>
         <button
           onClick={() => {
             throw new Error('Test Sentry Error')
           }}
           className='px-4 py-2 bg-red-600 text-white rounded'
         >
           Trigger Test Error
         </button>
       </div>
     )
   }
   ```

3. Visit `http://localhost:3000/sentry-test` and click the button
4. Check Sentry dashboard for the error

### Production Testing

In production, Sentry is always enabled. Test by:

1. Deploying to your production environment
2. Triggering an intentional error
3. Checking the Sentry dashboard

## Viewing Errors in Sentry

1. Go to your Sentry project dashboard
2. Click **Issues** to see all errors
3. Click on an issue to see:
   - Error message and stack trace
   - User context (browser, OS, etc.)
   - Breadcrumbs (user actions leading to error)
   - Tags and metadata
   - Session replay (if available)

## Best Practices

### 1. Use the Logger

Always use our logger for error tracking:

```typescript
import { logger } from '@/lib/logger'

try {
  // Your code
} catch (error) {
  logger.error('Failed to process order', error, {
    orderId: '123',
    userId: 'user-456',
  })
}
```

This ensures:

- Sensitive data is redacted
- Context is added
- Errors are sent to Sentry

### 2. Add Context

Add helpful context to errors:

```typescript
logger.error('Payment processing failed', error, {
  paymentMethod: 'stripe',
  amount: 99.99,
  currency: 'USD',
  orderId: '123',
})
```

### 3. Set User Context

In authenticated routes, set user context:

```typescript
import * as Sentry from '@sentry/nextjs'

// In your authentication logic
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
})

// On logout
Sentry.setUser(null)
```

### 4. Use Tags for Filtering

Add tags to categorize errors:

```typescript
Sentry.setTag('feature', 'checkout')
Sentry.setTag('payment_provider', 'stripe')
```

### 5. Monitor Performance

Track custom performance metrics:

```typescript
import * as Sentry from '@sentry/nextjs'

const transaction = Sentry.startTransaction({
  name: 'Order Processing',
  op: 'order.process',
})

try {
  // Your code
} finally {
  transaction.finish()
}
```

## Alert Configuration

Set up alerts in Sentry:

1. Go to **Alerts → Create Alert**
2. Choose alert type:
   - Issues: Alert when specific errors occur
   - Metric: Alert based on error rate, performance, etc.
3. Configure conditions:
   - Error frequency threshold
   - Affected users threshold
   - Performance degradation
4. Set notification channels:
   - Email
   - Slack
   - PagerDuty
   - etc.

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN**: Ensure `SENTRY_DSN` is set correctly
2. **Check enabled flag**: Sentry only runs in production by default
3. **Check beforeSend filter**: May be filtering out events
4. **Check network**: Ensure app can reach sentry.io
5. **Check console**: Look for Sentry errors in browser/server console

### Source Maps Not Working

1. **Check auth token**: Ensure `SENTRY_AUTH_TOKEN` has correct scopes
2. **Check org/project**: Ensure `SENTRY_ORG` and `SENTRY_PROJECT` are correct
3. **Check build**: Source maps only upload in production builds
4. **Check Sentry dashboard**: Go to Settings → Source Maps to verify uploads

### Too Many Events

If you're hitting rate limits:

1. Reduce sample rates in config files
2. Add more aggressive filtering in `beforeSend`
3. Upgrade your Sentry plan
4. Use `ignoreErrors` to filter known issues

## Cost Management

Sentry pricing is based on:

- Number of errors captured
- Number of performance transactions
- Number of session replays

To manage costs:

1. **Adjust sample rates** in config files
2. **Filter noise** using `ignoreErrors` and `beforeSend`
3. **Use error grouping** to combine similar errors
4. **Set up spike protection** in Sentry settings
5. **Monitor quota usage** in Sentry dashboard

## Further Reading

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Tracking Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
