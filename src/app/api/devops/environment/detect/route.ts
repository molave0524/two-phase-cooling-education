import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Detect which environment the app is running in based on database URL
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
  const devUrl = process.env.DEV_POSTGRES_URL || ''
  const uatUrl = process.env.UAT_POSTGRES_URL || ''
  const prodUrl = process.env.PROD_POSTGRES_URL || ''

  // Check if we're on Vercel
  const isVercel = process.env.VERCEL === '1'
  const vercelEnv = process.env.VERCEL_ENV

  let environment = 'local'
  let detectionMethod = 'default'

  if (isVercel) {
    // On Vercel, use VERCEL_ENV
    if (vercelEnv === 'production') {
      environment = 'prod'
      detectionMethod = 'vercel'
    } else if (vercelEnv === 'preview') {
      const gitBranch = process.env.VERCEL_GIT_COMMIT_REF || ''
      if (gitBranch === 'develop') {
        environment = 'dev'
      } else if (gitBranch === 'uat') {
        environment = 'uat'
      } else {
        environment = 'preview'
      }
      detectionMethod = 'git-branch'
    }
  } else {
    // Local development - detect by comparing DATABASE_URL
    if (dbUrl === devUrl && devUrl) {
      environment = 'dev'
      detectionMethod = 'database-url'
    } else if (dbUrl === uatUrl && uatUrl) {
      environment = 'uat'
      detectionMethod = 'database-url'
    } else if (dbUrl === prodUrl && prodUrl) {
      environment = 'prod'
      detectionMethod = 'database-url'
    } else if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      environment = 'local'
      detectionMethod = 'database-url'
    }
  }

  let databaseHost = 'unknown'
  try {
    if (dbUrl) {
      databaseHost = new URL(dbUrl).hostname
    }
  } catch {
    databaseHost = 'invalid-url'
  }

  return NextResponse.json({
    environment,
    detectionMethod,
    isVercel,
    vercelEnv,
    databaseHost,
  })
}
