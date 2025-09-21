// Progress Service
// Two-Phase Cooling Education Center
//
// Service layer for managing user progress with optimistic locking and concurrent access handling

import { prisma } from '@/lib/database/client'
import { UserProgress, Prisma } from '@prisma/client'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ProgressUpdateRequest {
  userId: string
  videoId: string
  completionPercentage: number
  watchTimeSeconds: number
  lastPositionSeconds: number
  interactionCount?: number
  pauseCount?: number
  seekCount?: number
  replayCount?: number
}

export interface ProgressUpdateResponse {
  success: boolean
  progress?: UserProgress
  error?: string
  conflictResolution?: 'merge' | 'overwrite' | 'reject'
}

export interface ProgressBatchRequest {
  userId: string
  updates: ProgressUpdateRequest[]
}

export interface UserProgressSummary {
  userId: string
  totalVideos: number
  completedVideos: number
  totalWatchTime: number
  averageCompletion: number
  lastActivity: Date
  streakDays: number
}

export interface LearningPathProgress {
  pathId: string
  userId: string
  currentVideoIndex: number
  videosCompleted: number
  totalVideos: number
  estimatedTimeRemaining: number
  lastActivity: Date
}

// ============================================================================
// PROGRESS SERVICE CLASS
// ============================================================================

export class ProgressService {
  private readonly MAX_RETRY_ATTEMPTS = 3
  private readonly RETRY_DELAY_MS = 100
  private readonly CONFLICT_RESOLUTION_STRATEGY: 'merge' | 'overwrite' = 'merge'

  // ========================================================================
  // CORE PROGRESS OPERATIONS
  // ========================================================================

  /**
   * Update user progress with optimistic locking and conflict resolution
   */
  async updateUserProgress(request: ProgressUpdateRequest): Promise<ProgressUpdateResponse> {
    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await this.attemptProgressUpdate(request, attempt)
      } catch (error) {
        if (this.isRetryableError(error) && attempt < this.MAX_RETRY_ATTEMPTS) {
          // Exponential backoff
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1)
          await this.delay(delay)
          continue
        }

        // Non-retryable error or max attempts reached
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update progress',
        }
      }
    }

    return {
      success: false,
      error: 'Maximum retry attempts exceeded',
    }
  }

  private async attemptProgressUpdate(
    request: ProgressUpdateRequest,
    attempt: number
  ): Promise<ProgressUpdateResponse> {
    return await prisma.$transaction(async (tx) => {
      // Get existing progress with current version
      const existingProgress = await tx.userProgress.findUnique({
        where: {
          user_id_video_id: {
            user_id: request.userId,
            video_id: request.videoId,
          },
        },
      })

      const now = new Date()

      if (existingProgress) {
        // Update existing progress with optimistic locking
        const mergedData = this.mergeProgressData(existingProgress, request)

        try {
          const updatedProgress = await tx.userProgress.update({
            where: {
              id: existingProgress.id,
              version: existingProgress.version, // Optimistic lock
            },
            data: {
              ...mergedData,
              version: { increment: 1 },
              updated_at: now,
            },
          })

          return {
            success: true,
            progress: updatedProgress,
            conflictResolution: 'merge',
          }
        } catch (error) {
          if (this.isVersionConflictError(error)) {
            throw new Error(`Version conflict on attempt ${attempt}`)
          }
          throw error
        }
      } else {
        // Create new progress entry
        const newProgress = await tx.userProgress.create({
          data: {
            user_id: request.userId,
            video_id: request.videoId,
            completion_percentage: request.completionPercentage,
            watch_time_seconds: request.watchTimeSeconds,
            last_position_seconds: request.lastPositionSeconds,
            interaction_count: request.interactionCount || 0,
            pause_count: request.pauseCount || 0,
            seek_count: request.seekCount || 0,
            replay_count: request.replayCount || 0,
            first_watched_at: now,
            last_watched_at: now,
            completed_at: request.completionPercentage >= 90 ? now : null,
            version: 1,
          },
        })

        return {
          success: true,
          progress: newProgress,
        }
      }
    })
  }

  /**
   * Merge existing progress with new data using intelligent conflict resolution
   */
  private mergeProgressData(
    existing: UserProgress,
    update: ProgressUpdateRequest
  ): Partial<UserProgress> {
    const mergedData: Partial<UserProgress> = {
      // Always update position and watch time (they should always increase)
      last_position_seconds: Math.max(
        existing.last_position_seconds,
        update.lastPositionSeconds
      ),
      watch_time_seconds: Math.max(existing.watch_time_seconds, update.watchTimeSeconds),

      // Update completion percentage if higher
      completion_percentage: Math.max(
        Number(existing.completion_percentage),
        update.completionPercentage
      ),

      // Increment interaction counters
      interaction_count: existing.interaction_count + (update.interactionCount || 0),
      pause_count: existing.pause_count + (update.pauseCount || 0),
      seek_count: existing.seek_count + (update.seekCount || 0),
      replay_count: existing.replay_count + (update.replayCount || 0),

      // Update timestamps
      last_watched_at: new Date(),
    }

    // Set completion timestamp if newly completed
    if (
      update.completionPercentage >= 90 &&
      Number(existing.completion_percentage) < 90 &&
      !existing.completed_at
    ) {
      mergedData.completed_at = new Date()
    }

    return mergedData
  }

  // ========================================================================
  // BATCH OPERATIONS
  // ========================================================================

  /**
   * Update multiple video progress entries in a single transaction
   */
  async updateProgressBatch(request: ProgressBatchRequest): Promise<{
    successful: ProgressUpdateResponse[]
    failed: { request: ProgressUpdateRequest; error: string }[]
  }> {
    const successful: ProgressUpdateResponse[] = []
    const failed: { request: ProgressUpdateRequest; error: string }[] = []

    // Process updates sequentially to avoid conflicts
    for (const update of request.updates) {
      try {
        const result = await this.updateUserProgress(update)
        if (result.success) {
          successful.push(result)
        } else {
          failed.push({ request: update, error: result.error || 'Unknown error' })
        }
      } catch (error) {
        failed.push({
          request: update,
          error: error instanceof Error ? error.message : 'Unexpected error',
        })
      }
    }

    return { successful, failed }
  }

  // ========================================================================
  // QUERY OPERATIONS
  // ========================================================================

  /**
   * Get user progress for a specific video
   */
  async getUserVideoProgress(userId: string, videoId: string): Promise<UserProgress | null> {
    return await prisma.userProgress.findUnique({
      where: {
        user_id_video_id: {
          user_id: userId,
          video_id: videoId,
        },
      },
      include: {
        video: {
          select: {
            title: true,
            duration_seconds: true,
            topic_category: true,
            difficulty_level: true,
          },
        },
      },
    })
  }

  /**
   * Get all progress for a user with pagination
   */
  async getUserProgress(
    userId: string,
    options: {
      limit?: number
      offset?: number
      topicCategory?: string
      completed?: boolean
      sortBy?: 'last_watched' | 'completion' | 'created'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ) {
    const {
      limit = 50,
      offset = 0,
      topicCategory,
      completed,
      sortBy = 'last_watched',
      sortOrder = 'desc',
    } = options

    const where: Prisma.UserProgressWhereInput = {
      user_id: userId,
    }

    // Add filters
    if (topicCategory) {
      where.video = {
        topic_category: topicCategory,
      }
    }

    if (completed !== undefined) {
      where.completed_at = completed ? { not: null } : null
    }

    // Determine sort field
    let orderBy: Prisma.UserProgressOrderByWithRelationInput
    switch (sortBy) {
      case 'completion':
        orderBy = { completion_percentage: sortOrder }
        break
      case 'created':
        orderBy = { first_watched_at: sortOrder }
        break
      default:
        orderBy = { last_watched_at: sortOrder }
    }

    const [progress, total] = await Promise.all([
      prisma.userProgress.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              slug: true,
              duration_seconds: true,
              topic_category: true,
              difficulty_level: true,
              thumbnail_url: true,
            },
          },
        },
      }),
      prisma.userProgress.count({ where }),
    ])

    return {
      progress,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }
  }

  /**
   * Get user progress summary statistics
   */
  async getUserProgressSummary(userId: string): Promise<UserProgressSummary> {
    const [progressStats, recentActivity] = await Promise.all([
      prisma.userProgress.aggregate({
        where: { user_id: userId },
        _count: { id: true },
        _avg: { completion_percentage: true },
        _sum: { watch_time_seconds: true },
      }),

      prisma.userProgress.findFirst({
        where: { user_id: userId },
        orderBy: { last_watched_at: 'desc' },
        select: { last_watched_at: true },
      }),
    ])

    const completedCount = await prisma.userProgress.count({
      where: {
        user_id: userId,
        completed_at: { not: null },
      },
    })

    // Calculate streak days (simplified - in production, use more sophisticated logic)
    const streakDays = await this.calculateUserStreak(userId)

    return {
      userId,
      totalVideos: progressStats._count.id || 0,
      completedVideos: completedCount,
      totalWatchTime: progressStats._sum.watch_time_seconds || 0,
      averageCompletion: Number(progressStats._avg.completion_percentage) || 0,
      lastActivity: recentActivity?.last_watched_at || new Date(),
      streakDays,
    }
  }

  /**
   * Get learning path progress for a user
   */
  async getLearningPathProgress(userId: string, pathId: string): Promise<LearningPathProgress | null> {
    const learningPath = await prisma.learningPaths.findFirst({
      where: {
        user_id: userId,
        id: pathId,
      },
    })

    if (!learningPath) return null

    // Get progress for all videos in the path
    const videoProgress = await prisma.userProgress.findMany({
      where: {
        user_id: userId,
        video_id: { in: learningPath.video_sequence },
      },
    })

    const completedVideos = videoProgress.filter(p => p.completed_at).length
    const totalVideos = learningPath.video_sequence.length

    // Estimate remaining time based on average video duration
    const avgVideoDuration = await prisma.video.aggregate({
      where: { id: { in: learningPath.video_sequence } },
      _avg: { duration_seconds: true },
    })

    const remainingVideos = totalVideos - completedVideos
    const estimatedTimeRemaining =
      remainingVideos * (avgVideoDuration._avg.duration_seconds || 600)

    return {
      pathId: learningPath.id,
      userId,
      currentVideoIndex: learningPath.current_position,
      videosCompleted: completedVideos,
      totalVideos,
      estimatedTimeRemaining,
      lastActivity: learningPath.last_activity,
    }
  }

  // ========================================================================
  // ANALYTICS AND INSIGHTS
  // ========================================================================

  /**
   * Get progress analytics for video performance
   */
  async getVideoAnalytics(videoId: string) {
    const analytics = await prisma.userProgress.aggregate({
      where: { video_id: videoId },
      _count: { id: true },
      _avg: {
        completion_percentage: true,
        watch_time_seconds: true,
      },
      _max: { last_watched_at: true },
    })

    const completionRate = await prisma.userProgress.count({
      where: {
        video_id: videoId,
        completed_at: { not: null },
      },
    })

    const dropoffPoints = await this.getVideoDropoffAnalysis(videoId)

    return {
      totalViews: analytics._count.id || 0,
      completionRate: analytics._count.id ? (completionRate / analytics._count.id) * 100 : 0,
      averageCompletion: Number(analytics._avg.completion_percentage) || 0,
      averageWatchTime: Number(analytics._avg.watch_time_seconds) || 0,
      lastViewed: analytics._max.last_watched_at,
      dropoffPoints,
    }
  }

  /**
   * Analyze where users typically stop watching a video
   */
  private async getVideoDropoffAnalysis(videoId: string) {
    // Get completion percentages for incomplete videos
    const incompleteProgress = await prisma.userProgress.findMany({
      where: {
        video_id: videoId,
        completed_at: null,
        completion_percentage: { gt: 0 },
      },
      select: { completion_percentage: true },
    })

    // Group by 10% intervals
    const intervals = Array.from({ length: 10 }, (_, i) => ({
      start: i * 10,
      end: (i + 1) * 10,
      count: 0,
    }))

    incompleteProgress.forEach((progress) => {
      const percentage = Number(progress.completion_percentage)
      const intervalIndex = Math.min(Math.floor(percentage / 10), 9)
      intervals[intervalIndex].count++
    })

    return intervals
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Calculate user learning streak
   */
  private async calculateUserStreak(userId: string): Promise<number> {
    // Get last 30 days of activity
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = await prisma.userProgress.findMany({
      where: {
        user_id: userId,
        last_watched_at: { gte: thirtyDaysAgo },
      },
      select: { last_watched_at: true },
      orderBy: { last_watched_at: 'desc' },
    })

    if (recentActivity.length === 0) return 0

    // Count consecutive days
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const activityDates = recentActivity.map((activity) => {
      const date = new Date(activity.last_watched_at)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })

    const uniqueDates = [...new Set(activityDates)].sort((a, b) => b - a)

    for (const activityTime of uniqueDates) {
      if (activityTime === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (activityTime === currentDate.getTime() + 24 * 60 * 60 * 1000) {
        // Allow for timezone differences
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('Version conflict') ||
        error.message.includes('connection') ||
        error.message.includes('timeout')
      )
    }
    return false
  }

  private isVersionConflictError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === 'P2025' // Record not found (version mismatch)
    }
    return false
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const progressService = new ProgressService()

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function updateUserProgress(request: ProgressUpdateRequest): Promise<ProgressUpdateResponse> {
  return progressService.updateUserProgress(request)
}

export async function getUserVideoProgress(userId: string, videoId: string): Promise<UserProgress | null> {
  return progressService.getUserVideoProgress(userId, videoId)
}

export async function getUserProgressSummary(userId: string): Promise<UserProgressSummary> {
  return progressService.getUserProgressSummary(userId)
}