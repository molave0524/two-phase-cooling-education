import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import packageJson from '../../../../../package.json'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

interface GitInfo {
  branch: string
  commit: string
  commitShort: string
  commitDate: string
  commitMessage: string
}

interface EnvironmentResponse {
  environment: 'local' | 'dev' | 'uat' | 'prod' | 'preview'
  git: GitInfo
  versions: {
    app: string
    node: string
    nextjs: string
    database: string
  }
  deployment: {
    deployedAt: string
    deployedBy?: string
    buildNumber?: string
  }
}

async function getGitInfo(): Promise<GitInfo> {
  // On Vercel, use environment variables instead of git commands
  const isVercel = process.env.VERCEL === '1'

  if (isVercel) {
    const commit = process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
    const branch = process.env.VERCEL_GIT_COMMIT_REF || 'unknown'
    const message = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'No commit message'
    const author = process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || 'Unknown'

    return {
      branch,
      commit,
      commitShort: commit.substring(0, 7),
      commitDate: new Date().toISOString(), // Vercel doesn't provide commit date
      commitMessage: message,
    }
  }

  // Local development - use git commands
  try {
    const [commitResult, branchResult, dateResult, messageResult] = await Promise.all([
      execAsync('git rev-parse HEAD'),
      execAsync('git branch --show-current'),
      execAsync('git log -1 --format=%ci'),
      execAsync('git log -1 --format=%s'),
    ])

    const commit = commitResult.stdout.trim()

    return {
      branch: branchResult.stdout.trim(),
      commit,
      commitShort: commit.substring(0, 7),
      commitDate: dateResult.stdout.trim(),
      commitMessage: messageResult.stdout.trim(),
    }
  } catch (error) {
    return {
      branch: 'unknown',
      commit: 'unknown',
      commitShort: 'unknown',
      commitDate: new Date().toISOString(),
      commitMessage: error instanceof Error ? error.message : 'Git information not available',
    }
  }
}

function getEnvironment(): 'local' | 'dev' | 'uat' | 'prod' | 'preview' {
  const isVercel = process.env.VERCEL === '1'
  const vercelEnv = process.env.VERCEL_ENV || ''
  const gitBranch = process.env.VERCEL_GIT_COMMIT_REF || ''

  if (!isVercel || process.env.NODE_ENV === 'development') {
    return 'local'
  }

  if (vercelEnv === 'production') {
    return 'prod'
  }

  if (vercelEnv === 'preview') {
    if (gitBranch === 'develop') return 'dev'
    if (gitBranch === 'uat') return 'uat'
    return 'preview'
  }

  return 'local'
}

export async function GET() {
  try {
    const gitInfo = await getGitInfo()
    const environment = getEnvironment()

    const response: EnvironmentResponse = {
      environment,
      git: gitInfo,
      versions: {
        app: packageJson.version,
        node: process.version,
        nextjs: packageJson.dependencies.next.replace('^', ''),
        database: 'PostgreSQL 15',
      },
      deployment: {
        deployedAt: new Date().toISOString(),
        ...(process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME && {
          deployedBy: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME,
        }),
        ...(process.env.VERCEL_GIT_COMMIT_SHA && {
          buildNumber: process.env.VERCEL_GIT_COMMIT_SHA,
        }),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    // Error logged for debugging
    return NextResponse.json(
      {
        environment: 'unknown',
        git: {
          branch: 'unknown',
          commit: 'unknown',
          commitShort: 'unknown',
          commitDate: new Date().toISOString(),
          commitMessage: 'Error retrieving git info',
        },
        versions: {
          app: packageJson.version,
          node: process.version,
          nextjs: packageJson.dependencies.next,
          database: 'unknown',
        },
        deployment: {
          deployedAt: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
