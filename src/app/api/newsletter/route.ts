import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDatabaseClient } from '@/lib/database/client'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const NewsletterSubscriptionSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(['enthusiast', 'student', 'educator', 'engineer', 'other']).optional(),
  interests: z.array(z.string()).max(10).optional(),
  source: z.string().max(100).optional(), // How they found us
  gdprConsent: z.boolean().default(false),
  marketingConsent: z.boolean().default(true)
})

const NewsletterUpdateSchema = z.object({
  email: z.string().email(),
  interests: z.array(z.string()).max(10).optional(),
  isActive: z.boolean().optional(),
  marketingConsent: z.boolean().optional()
})

// ============================================================================
// EMAIL VALIDATION HELPERS
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'trashmail.com'
  ]

  const domain = email.split('@')[1]?.toLowerCase()
  return disposableDomains.includes(domain)
}

// ============================================================================
// NEWSLETTER SERVICE FUNCTIONS
// ============================================================================

async function subscribeToNewsletter(data: z.infer<typeof NewsletterSubscriptionSchema>) {
  const db = getDatabaseClient()

  // Check if email already exists
  const existingSubscription = await db.newsletterSubscriptions.findUnique({
    where: { email: data.email }
  })

  if (existingSubscription) {
    if (existingSubscription.is_active) {
      throw new Error('Email is already subscribed')
    } else {
      // Reactivate existing subscription
      const updated = await db.newsletterSubscriptions.update({
        where: { email: data.email },
        data: {
          is_active: true,
          role: data.role,
          interests: data.interests ? JSON.stringify(data.interests) : null,
          first_name: data.firstName,
          last_name: data.lastName,
          source: data.source,
          gdpr_consent: data.gdprConsent,
          marketing_consent: data.marketingConsent,
          resubscribed_at: new Date(),
          updated_at: new Date()
        }
      })

      return {
        id: updated.id,
        email: updated.email,
        isActive: updated.is_active,
        subscribedAt: updated.subscribed_at,
        resubscribedAt: updated.resubscribed_at
      }
    }
  }

  // Create new subscription
  const subscription = await db.newsletterSubscriptions.create({
    data: {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
      interests: data.interests ? JSON.stringify(data.interests) : null,
      source: data.source,
      gdpr_consent: data.gdprConsent,
      marketing_consent: data.marketingConsent,
      is_active: true,
      subscribed_at: new Date()
    }
  })

  return {
    id: subscription.id,
    email: subscription.email,
    isActive: subscription.is_active,
    subscribedAt: subscription.subscribed_at
  }
}

async function updateSubscription(email: string, updates: z.infer<typeof NewsletterUpdateSchema>) {
  const db = getDatabaseClient()

  const subscription = await db.newsletterSubscriptions.findUnique({
    where: { email }
  })

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  const updated = await db.newsletterSubscriptions.update({
    where: { email },
    data: {
      interests: updates.interests ? JSON.stringify(updates.interests) : undefined,
      is_active: updates.isActive,
      marketing_consent: updates.marketingConsent,
      updated_at: new Date(),
      ...(updates.isActive === false && { unsubscribed_at: new Date() })
    }
  })

  return {
    id: updated.id,
    email: updated.email,
    isActive: updated.is_active,
    interests: updated.interests ? JSON.parse(updated.interests as string) : [],
    marketingConsent: updated.marketing_consent
  }
}

async function unsubscribe(email: string, reason?: string) {
  const db = getDatabaseClient()

  const subscription = await db.newsletterSubscriptions.findUnique({
    where: { email }
  })

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  if (!subscription.is_active) {
    throw new Error('Email is already unsubscribed')
  }

  const updated = await db.newsletterSubscriptions.update({
    where: { email },
    data: {
      is_active: false,
      unsubscribe_reason: reason,
      unsubscribed_at: new Date(),
      updated_at: new Date()
    }
  })

  return {
    id: updated.id,
    email: updated.email,
    unsubscribedAt: updated.unsubscribed_at
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(identifier)

  if (!userLimit || now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  userLimit.count++
  return true
}

// ============================================================================
// POST - Subscribe to newsletter
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = NewsletterSubscriptionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Additional email validation
    if (!isValidEmail(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (isDisposableEmail(data.email)) {
      return NextResponse.json(
        { error: 'Disposable email addresses are not allowed' },
        { status: 400 }
      )
    }

    // Rate limiting by IP
    const identifier = request.ip || 'anonymous'
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many subscription attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // GDPR compliance check (required for EU users)
    if (!data.gdprConsent) {
      return NextResponse.json(
        { error: 'GDPR consent is required' },
        { status: 400 }
      )
    }

    const subscription = await subscribeToNewsletter(data)

    // In production, you would trigger welcome email here
    // await sendWelcomeEmail(subscription.email, data.firstName)

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Successfully subscribed to newsletter'
    })

  } catch (error) {
    console.error('Error subscribing to newsletter:', error)

    if (error instanceof Error && error.message === 'Email is already subscribed') {
      return NextResponse.json(
        { error: 'This email is already subscribed to our newsletter' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update subscription preferences
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = NewsletterUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { email, ...updates } = validation.data

    const subscription = await updateSubscription(email, { email, ...updates })

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription preferences updated successfully'
    })

  } catch (error) {
    console.error('Error updating subscription:', error)

    if (error instanceof Error && error.message === 'Subscription not found') {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Unsubscribe from newsletter
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const reason = searchParams.get('reason')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const result = await unsubscribe(email, reason || undefined)

    return NextResponse.json({
      success: true,
      result,
      message: 'Successfully unsubscribed from newsletter'
    })

  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error)

    if (error instanceof Error) {
      if (error.message === 'Subscription not found') {
        return NextResponse.json(
          { error: 'Email not found in our newsletter list' },
          { status: 404 }
        )
      }

      if (error.message === 'Email is already unsubscribed') {
        return NextResponse.json(
          { error: 'This email is already unsubscribed' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Get subscription status or newsletter statistics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const action = searchParams.get('action')

    // Get subscription status
    if (email) {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      const db = getDatabaseClient()
      const subscription = await db.newsletterSubscriptions.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          is_active: true,
          role: true,
          interests: true,
          marketing_consent: true,
          subscribed_at: true,
          updated_at: true
        }
      })

      if (!subscription) {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        subscription: {
          ...subscription,
          interests: subscription.interests ? JSON.parse(subscription.interests as string) : []
        }
      })
    }

    // Get newsletter statistics (admin only - add authentication as needed)
    if (action === 'stats') {
      const db = getDatabaseClient()

      const [totalSubscribers, activeSubscribers, recentSubscribers] = await Promise.all([
        db.newsletterSubscriptions.count(),
        db.newsletterSubscriptions.count({ where: { is_active: true } }),
        db.newsletterSubscriptions.count({
          where: {
            subscribed_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ])

      return NextResponse.json({
        stats: {
          totalSubscribers,
          activeSubscribers,
          recentSubscribers,
          unsubscribeRate: totalSubscribers > 0 ? ((totalSubscribers - activeSubscribers) / totalSubscribers * 100).toFixed(2) : 0
        }
      })
    }

    return NextResponse.json({
      message: 'Newsletter API - Use POST to subscribe, PUT to update preferences, DELETE to unsubscribe, or GET with email parameter to check status'
    })

  } catch (error) {
    console.error('Error in newsletter GET endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}