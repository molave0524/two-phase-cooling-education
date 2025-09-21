// Database Client Configuration
// Two-Phase Cooling Education Center
//
// Optimized Prisma client setup with connection pooling, logging, and error handling

import { PrismaClient } from '@prisma/client'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DatabaseConfig {
  maxConnections: number
  connectionTimeout: number
  logQueries: boolean
  logLevel: 'info' | 'query' | 'warn' | 'error'[]
}

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    maxConnections: parseInt(process.env.DATABASE_POOL_MAX || '10'),
    connectionTimeout: parseInt(process.env.DATABASE_TIMEOUT || '20000'),
    logQueries: isDevelopment || process.env.LOG_QUERIES === 'true',
    logLevel: isDevelopment
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error']
  }
}

// ============================================================================
// PRISMA CLIENT FACTORY
// ============================================================================

const createPrismaClient = () => {
  const config = getDatabaseConfig()

  const client = new PrismaClient({
    log: config.logLevel.map(level => ({
      emit: 'stdout',
      level: level as any,
    })),

    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },

    // Error formatting for better debugging
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  })

  // Connection event handlers
  client.$on('beforeExit', async () => {
    console.log('🔌 Disconnecting from database...')
  })

  // Query logging for performance monitoring
  if (config.logQueries) {
    client.$on('query' as any, (e: any) => {
      console.log('📊 Query: ' + e.query)
      console.log('⏱️  Duration: ' + e.duration + 'ms')
      console.log('📈 Params: ' + e.params)
    })
  }

  return client
}

// ============================================================================
// GLOBAL CLIENT INSTANCE
// ============================================================================

// Prevent multiple instances in development due to hot reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ============================================================================
// CONNECTION HEALTH CHECK
// ============================================================================

export const checkDatabaseConnection = async (): Promise<{
  isConnected: boolean
  latency: number
  error?: string
}> => {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1 as connection_test`
    const latency = Date.now() - start

    return {
      isConnected: true,
      latency,
    }
  } catch (error) {
    return {
      isConnected: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Execute a database transaction with retry logic
 */
export const executeTransaction = async <T>(
  fn: (prisma: PrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await fn(tx as PrismaClient)
      })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Transaction failed')

      // Don't retry on certain errors
      if (
        lastError.message.includes('Unique constraint') ||
        lastError.message.includes('Foreign key constraint') ||
        lastError.message.includes('Check constraint')
      ) {
        throw lastError
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))

        console.warn(`🔄 Database transaction failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
      }
    }
  }

  throw lastError || new Error('Transaction failed after all retries')
}

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const [
      tableStats,
      indexStats,
      connectionStats
    ] = await Promise.all([
      // Table statistics
      prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY seq_scan DESC
      `,

      // Index usage statistics
      prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
      `,

      // Connection statistics
      prisma.$queryRaw`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `,
    ])

    return {
      tables: tableStats,
      indexes: indexStats,
      connections: connectionStats,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Failed to get database statistics:', error)
    throw error
  }
}

/**
 * Clean up old data (for maintenance)
 */
export const cleanupOldData = async (daysToKeep: number = 90) => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  try {
    const result = await executeTransaction(async (tx) => {
      // Clean up old learning sessions
      const deletedSessions = await tx.learningSessions.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate,
          },
          is_active: false,
        },
      })

      // Clean up old AI conversations
      const deletedConversations = await tx.aIConversations.deleteMany({
        where: {
          ended_at: {
            lt: cutoffDate,
          },
        },
      })

      // Archive old orders (instead of deleting)
      const archivedOrders = await tx.orders.updateMany({
        where: {
          created_at: {
            lt: cutoffDate,
          },
          status: {
            in: ['DELIVERED', 'CANCELLED', 'REFUNDED'],
          },
        },
        data: {
          // Add archived flag if it exists in schema
          // archived: true,
        },
      })

      return {
        deletedSessions: deletedSessions.count,
        deletedConversations: deletedConversations.count,
        archivedOrders: archivedOrders.count,
      }
    })

    console.log('🧹 Database cleanup completed:', result)
    return result
  } catch (error) {
    console.error('Database cleanup failed:', error)
    throw error
  }
}

/**
 * Refresh materialized views (if any)
 */
export const refreshMaterializedViews = async () => {
  try {
    // Refresh user progress analytics view
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY user_progress_analytics`

    console.log('📊 Materialized views refreshed successfully')
  } catch (error) {
    console.error('Failed to refresh materialized views:', error)
    throw error
  }
}

/**
 * Optimize database (VACUUM and ANALYZE)
 */
export const optimizeDatabase = async () => {
  try {
    // Run VACUUM ANALYZE on key tables
    const tables = [
      'user_progress',
      'learning_sessions',
      'videos',
      'ai_conversations',
      'ai_messages',
      'orders',
    ]

    for (const table of tables) {
      await prisma.$executeRawUnsafe(`VACUUM ANALYZE ${table}`)
    }

    console.log('🔧 Database optimization completed')
  } catch (error) {
    console.error('Database optimization failed:', error)
    throw error
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export const handleDatabaseError = (error: unknown): never => {
  if (error instanceof Error) {
    // Log the full error for debugging
    console.error('Database error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })

    // Throw a user-friendly error
    if (error.message.includes('Unique constraint')) {
      throw new Error('A record with this information already exists')
    }

    if (error.message.includes('Foreign key constraint')) {
      throw new Error('Cannot perform this operation due to related data')
    }

    if (error.message.includes('Connection')) {
      throw new Error('Database connection failed. Please try again.')
    }

    // Generic database error
    throw new Error('A database error occurred. Please try again.')
  }

  throw new Error('An unexpected error occurred')
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`🛑 Received ${signal}, shutting down gracefully...`)

  try {
    await prisma.$disconnect()
    console.log('✅ Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during database shutdown:', error)
    process.exit(1)
  }
}

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error)
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Rejection:', reason)
  gracefulShutdown('unhandledRejection')
})

// ============================================================================
// EXPORTS
// ============================================================================

export default prisma

// Export types for use throughout the application
export type {
  Video,
  UserProgress,
  LearningSessions,
  LearningPaths,
  AIConversations,
  AIMessages,
  Products,
  Orders,
  OrderItems,
  DifficultyLevel,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from '@prisma/client'