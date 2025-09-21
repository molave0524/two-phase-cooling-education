import { NextRequest, NextResponse } from 'next/server'
import { getProgressService } from '@/lib/database/progress-service'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ProgressUpdateSchema = z.object({
  userId: z.string().uuid(),
  videoId: z.string().uuid(),
  currentPosition: z.number().min(0),
  duration: z.number().min(0),
  completionPercentage: z.number().min(0).max(100),
  watchedSeconds: z.number().min(0),
  isCompleted: z.boolean().optional(),
  version: z.number().int().min(1).optional()
})

const ProgressQuerySchema = z.object({
  userId: z.string().uuid(),
  videoId: z.string().uuid().optional()
})

// ============================================================================
// GET - Retrieve user progress
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = {
      userId: searchParams.get('userId'),
      videoId: searchParams.get('videoId')
    }

    // Validate query parameters
    const validation = ProgressQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { userId, videoId } = validation.data
    const progressService = getProgressService()

    if (videoId) {
      // Get progress for specific video
      const progress = await progressService.getUserProgress(userId, videoId)
      return NextResponse.json({ progress })
    } else {
      // Get all progress for user
      const allProgress = await progressService.getAllUserProgress(userId)
      return NextResponse.json({ progress: allProgress })
    }

  } catch (error) {
    console.error('Error retrieving video progress:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve progress' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Update user progress
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = ProgressUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const progressData = validation.data
    const progressService = getProgressService()

    // Update progress with optimistic locking
    const result = await progressService.updateUserProgress({
      userId: progressData.userId,
      videoId: progressData.videoId,
      currentPosition: progressData.currentPosition,
      duration: progressData.duration,
      completionPercentage: progressData.completionPercentage,
      watchedSeconds: progressData.watchedSeconds,
      isCompleted: progressData.isCompleted || progressData.completionPercentage >= 95,
      version: progressData.version
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, conflictResolution: result.conflictResolution },
        { status: result.conflictResolution ? 409 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      progress: result.progress,
      message: 'Progress updated successfully'
    })

  } catch (error) {
    console.error('Error updating video progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Batch update multiple progress entries
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    // Validate each update
    const validatedUpdates = []
    for (const update of updates) {
      const validation = ProgressUpdateSchema.safeParse(update)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid update data', details: validation.error.issues },
          { status: 400 }
        )
      }
      validatedUpdates.push(validation.data)
    }

    const progressService = getProgressService()
    const results = []

    // Process updates sequentially to handle conflicts properly
    for (const update of validatedUpdates) {
      const result = await progressService.updateUserProgress({
        userId: update.userId,
        videoId: update.videoId,
        currentPosition: update.currentPosition,
        duration: update.duration,
        completionPercentage: update.completionPercentage,
        watchedSeconds: update.watchedSeconds,
        isCompleted: update.isCompleted || update.completionPercentage >= 95,
        version: update.version
      })

      results.push({
        videoId: update.videoId,
        success: result.success,
        error: result.error,
        progress: result.progress
      })
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: failureCount === 0,
      totalUpdates: results.length,
      successCount,
      failureCount,
      results
    })

  } catch (error) {
    console.error('Error batch updating video progress:', error)
    return NextResponse.json(
      { error: 'Failed to batch update progress' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Reset user progress
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const videoId = searchParams.get('videoId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Validate userId format
    const userIdValidation = z.string().uuid().safeParse(userId)
    if (!userIdValidation.success) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 }
      )
    }

    const progressService = getProgressService()

    if (videoId) {
      // Validate videoId format
      const videoIdValidation = z.string().uuid().safeParse(videoId)
      if (!videoIdValidation.success) {
        return NextResponse.json(
          { error: 'Invalid videoId format' },
          { status: 400 }
        )
      }

      // Reset progress for specific video
      await progressService.resetProgress(userId, videoId)
      return NextResponse.json({
        success: true,
        message: 'Video progress reset successfully'
      })
    } else {
      // Reset all progress for user
      await progressService.resetAllProgress(userId)
      return NextResponse.json({
        success: true,
        message: 'All progress reset successfully'
      })
    }

  } catch (error) {
    console.error('Error resetting video progress:', error)
    return NextResponse.json(
      { error: 'Failed to reset progress' },
      { status: 500 }
    )
  }
}