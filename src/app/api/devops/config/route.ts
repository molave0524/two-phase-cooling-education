import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ConfigResponse {
  environment: {
    NODE_ENV: string
    VERCEL: string | null
    VERCEL_ENV: string | null
  }
  database: {
    POSTGRES_URL: string
    DATABASE_URL: string
  }
  services: {
    GEMINI_API_KEY: string
    STRIPE_SECRET_KEY: string
    STRIPE_PUBLISHABLE_KEY: string
    NEXTAUTH_SECRET: string
    NEXTAUTH_URL: string
  }
  email: {
    EMAIL_FROM: string
  }
  oauth: {
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    GITHUB_CLIENT_ID: string
    GITHUB_CLIENT_SECRET: string
  }
}

function maskValue(value: string | undefined): string {
  if (!value) return '❌ Not set'
  if (value.length <= 8) return '✅ Set (***)'
  return `✅ ${value.substring(0, 4)}...${value.slice(-4)}`
}

function maskUrl(url: string | undefined): string {
  if (!url) return '❌ Not set'
  try {
    const parsed = new URL(url)
    const maskedPassword = parsed.password ? '***' : ''
    const maskedUser = parsed.username || 'user'
    return `✅ ${parsed.protocol}//${maskedUser}:${maskedPassword}@${parsed.hostname}:${parsed.port || '5432'}/${parsed.pathname.slice(1).split('?')[0]}`
  } catch {
    return '✅ Set (invalid URL format)'
  }
}

export async function GET() {
  try {
    const response: ConfigResponse = {
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'unknown',
        VERCEL: process.env.VERCEL || null,
        VERCEL_ENV: process.env.VERCEL_ENV || null,
      },
      database: {
        POSTGRES_URL: maskUrl(process.env.POSTGRES_URL),
        DATABASE_URL: maskUrl(process.env.DATABASE_URL),
      },
      services: {
        GEMINI_API_KEY: maskValue(process.env.GEMINI_API_KEY),
        STRIPE_SECRET_KEY: maskValue(process.env.STRIPE_SECRET_KEY),
        STRIPE_PUBLISHABLE_KEY: maskValue(process.env.STRIPE_PUBLISHABLE_KEY),
        NEXTAUTH_SECRET: maskValue(process.env.NEXTAUTH_SECRET),
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || '❌ Not set',
      },
      email: {
        EMAIL_FROM: process.env.EMAIL_FROM || '❌ Not set',
      },
      oauth: {
        GOOGLE_CLIENT_ID: maskValue(process.env.GOOGLE_CLIENT_ID),
        GOOGLE_CLIENT_SECRET: maskValue(process.env.GOOGLE_CLIENT_SECRET),
        GITHUB_CLIENT_ID: maskValue(process.env.GITHUB_CLIENT_ID),
        GITHUB_CLIENT_SECRET: maskValue(process.env.GITHUB_CLIENT_SECRET),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    // Error logged for debugging
    return NextResponse.json(
      {
        error: 'Failed to fetch configuration',
      },
      { status: 500 }
    )
  }
}
