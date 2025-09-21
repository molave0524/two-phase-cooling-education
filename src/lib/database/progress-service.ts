/**
 * User Progress Database Service
 *
 * Optimized service for handling concurrent user progress updates
 * Implements optimistic locking to prevent data loss during concurrent access
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../monitoring/logger';

export interface ProgressUpdate {
  userId: string;
  videoId: string;
  completionPercentage?: number;
  watchTimeSeconds?: number;
  lastPositionSeconds?: number;
  interactionCount?: number;
  pauseCount?: number;
  seekCount?: number;
  replayCount?: number;
}

export interface ProgressQueryFilters {
  userId?: string;
  videoId?: string;
  topicCategory?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  progressStatus?: 'not_started' | 'started' | 'in_progress' | 'completed';
  completedSince?: Date;
  minCompletionPercentage?: number;
  limit?: number;
  offset?: number;
}

export interface ProgressInsights {
  totalVideosWatched: number;
  totalCompletedVideos: number;
  averageCompletionPercentage: number;
  totalWatchTimeHours: number;
  topicProgress: Record<string, {
    videosWatched: number;
    videosCompleted: number;
    averageCompletion: number;
  }>;
  learningStreak: {
    currentStreak: number;
    longestStreak: number;
    lastActivity: Date;
  };
  recommendations: string[];
}

export interface SessionMetrics {
  concurrentSessions: number;
  averageSessionDuration: number;
  topActiveVideos: Array<{
    videoId: string;
    title: string;
    activeSessions: number;
  }>;
  deviceDistribution: Record<string, number>;
}

export class ProgressService {
  private prisma: PrismaClient;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 100;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Update user progress with optimistic locking
   */
  async updateProgress(update: ProgressUpdate): Promise<boolean> {
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const result = await this.attemptProgressUpdate(update, attempt);

        const duration = Date.now() - startTime;
        logger.info('Progress updated successfully', {
          userId: update.userId,
          videoId: update.videoId,
          attempt,
          duration
        });

        return result;

      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // P2002: Unique constraint violation (should not happen with our design)
          // P2025: Record not found
          if (error.code === 'P2002' && attempt < this.MAX_RETRY_ATTEMPTS) {
            logger.warn('Optimistic locking conflict, retrying', {
              userId: update.userId,
              videoId: update.videoId,
              attempt,
              error: error.message
            });

            // Exponential backoff
            await this.delay(this.RETRY_DELAY_MS * Math.pow(2, attempt - 1));
            continue;
          }
        }

        logger.error('Failed to update progress', error as Error, {
          userId: update.userId,
          videoId: update.videoId,
          attempt
        });

        throw error;
      }
    }

    return false;
  }

  /**
   * Attempt a single progress update with optimistic locking
   */
  private async attemptProgressUpdate(update: ProgressUpdate, attempt: number): Promise<boolean> {
    return await this.prisma.$transaction(async (tx) => {
      // First, try to get existing progress with current version
      const existing = await tx.userProgress.findUnique({
        where: {
          unique_user_video: {
            user_id: update.userId,
            video_id: update.videoId
          }
        },
        select: {
          id: true,
          version: true,
          completion_percentage: true,
          watch_time_seconds: true,
          last_position_seconds: true,
          interaction_count: true,
          pause_count: true,
          seek_count: true,
          replay_count: true,
          first_watched_at: true
        }
      });

      const now = new Date();
      const isCompleted = (update.completionPercentage ?? 0) >= 90;

      if (existing) {
        // Update existing record with optimistic locking
        const updateData: Prisma.UserProgressUpdateInput = {
          completion_percentage: update.completionPercentage ?? existing.completion_percentage,
          watch_time_seconds: update.watchTimeSeconds ?? existing.watch_time_seconds,
          last_position_seconds: update.lastPositionSeconds ?? existing.last_position_seconds,
          interaction_count: update.interactionCount ?? existing.interaction_count,
          pause_count: update.pauseCount ?? existing.pause_count,
          seek_count: update.seekCount ?? existing.seek_count,
          replay_count: update.replayCount ?? existing.replay_count,
          last_watched_at: now,
          version: existing.version + 1, // Increment version for optimistic locking
          updated_at: now
        };

        // Set completion timestamp if just completed
        if (isCompleted && !existing.completion_percentage || existing.completion_percentage < 90) {
          updateData.completed_at = now;
        }

        const updated = await tx.userProgress.updateMany({
          where: {
            user_id: update.userId,
            video_id: update.videoId,
            version: existing.version // This ensures optimistic locking
          },
          data: updateData
        });

        if (updated.count === 0) {
          // Version mismatch - concurrent update detected
          throw new Error(`Optimistic locking failed - version mismatch (attempt ${attempt})`);
        }

        return true;

      } else {
        // Create new progress record
        await tx.userProgress.create({
          data: {
            user_id: update.userId,
            video_id: update.videoId,
            completion_percentage: update.completionPercentage ?? 0,
            watch_time_seconds: update.watchTimeSeconds ?? 0,
            last_position_seconds: update.lastPositionSeconds ?? 0,
            interaction_count: update.interactionCount ?? 0,
            pause_count: update.pauseCount ?? 0,
            seek_count: update.seekCount ?? 0,
            replay_count: update.replayCount ?? 0,
            completed_at: isCompleted ? now : null,
            first_watched_at: now,
            last_watched_at: now,
            version: 1,
            updated_at: now
          }
        });

        return true;
      }
    });
  }

  /**
   * Get user progress with efficient querying
   */
  async getUserProgress(
    userId: string,
    filters: Omit<ProgressQueryFilters, 'userId'> = {}
  ): Promise<any[]> {
    const where: Prisma.UserProgressWhereInput = {
      user_id: userId
    };

    // Add video filters if specified
    if (filters.videoId || filters.topicCategory || filters.difficultyLevel) {
      where.video = {};

      if (filters.videoId) {
        where.video.id = filters.videoId;
      }

      if (filters.topicCategory) {
        where.video.topic_category = filters.topicCategory;
      }

      if (filters.difficultyLevel) {
        where.video.difficulty_level = filters.difficultyLevel;
      }
    }

    // Add progress filters
    if (filters.minCompletionPercentage !== undefined) {
      where.completion_percentage = {
        gte: filters.minCompletionPercentage
      };
    }

    if (filters.completedSince) {
      where.completed_at = {
        gte: filters.completedSince
      };
    }

    return await this.prisma.userProgress.findMany({
      where,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            slug: true,
            duration_seconds: true,
            topic_category: true,
            difficulty_level: true,
            thumbnail_url: true
          }
        }
      },
      orderBy: {
        last_watched_at: 'desc'
      },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0
    });
  }

  /**
   * Get comprehensive user learning insights
   */
  async getUserInsights(userId: string): Promise<ProgressInsights> {
    // Use analytics view for better performance
    const analyticsData = await this.prisma.userProgressAnalytics.findMany({
      where: { user_id: userId }
    });

    if (analyticsData.length === 0) {
      return this.getEmptyInsights();
    }

    // Calculate basic metrics
    const totalVideosWatched = analyticsData.length;
    const completedVideos = analyticsData.filter(p => p.progress_status === 'completed');
    const totalCompletedVideos = completedVideos.length;

    const totalWatchTimeSeconds = analyticsData.reduce(
      (sum, p) => sum + p.watch_time_seconds, 0
    );

    const averageCompletionPercentage = analyticsData.reduce(
      (sum, p) => sum + Number(p.completion_percentage), 0
    ) / totalVideosWatched;

    // Calculate topic-specific progress
    const topicProgress: Record<string, any> = {};
    for (const progress of analyticsData) {
      const topic = progress.topic_category;
      if (!topicProgress[topic]) {
        topicProgress[topic] = {
          videosWatched: 0,
          videosCompleted: 0,
          totalCompletion: 0
        };
      }

      topicProgress[topic].videosWatched++;
      topicProgress[topic].totalCompletion += Number(progress.completion_percentage);

      if (progress.progress_status === 'completed') {
        topicProgress[topic].videosCompleted++;
      }
    }

    // Calculate averages for topics
    for (const topic in topicProgress) {
      const data = topicProgress[topic];
      data.averageCompletion = data.totalCompletion / data.videosWatched;
      delete data.totalCompletion;
    }

    // Calculate learning streak
    const learningStreak = await this.calculateLearningStreak(userId);

    // Generate recommendations
    const recommendations = this.generateRecommendations(analyticsData, topicProgress);

    return {
      totalVideosWatched,
      totalCompletedVideos,
      averageCompletionPercentage,
      totalWatchTimeHours: totalWatchTimeSeconds / 3600,
      topicProgress,
      learningStreak,
      recommendations
    };
  }

  /**
   * Start a learning session
   */
  async startSession(
    userId: string,
    videoId: string,
    deviceType?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<string> {
    const session = await this.prisma.learningSessions.create({
      data: {
        user_id: userId,
        video_id: videoId,
        device_type: deviceType,
        user_agent: userAgent,
        ip_address: ipAddress,
        is_active: true,
        last_heartbeat: new Date()
      }
    });

    return session.id;
  }

  /**
   * Update session heartbeat
   */
  async updateSessionHeartbeat(
    sessionId: string,
    watchTime?: number,
    maxPosition?: number,
    engagementEvents?: any[]
  ): Promise<void> {
    const updateData: Prisma.LearningSessionsUpdateInput = {
      last_heartbeat: new Date(),
      updated_at: new Date()
    };

    if (watchTime !== undefined) {
      updateData.total_watch_time = watchTime;
    }

    if (maxPosition !== undefined) {
      updateData.max_position_reached = maxPosition;
    }

    if (engagementEvents) {
      updateData.engagement_events = engagementEvents;
    }

    await this.prisma.learningSessions.update({
      where: { id: sessionId },
      data: updateData
    });
  }

  /**
   * End a learning session
   */
  async endSession(sessionId: string): Promise<void> {
    await this.prisma.learningSessions.update({
      where: { id: sessionId },
      data: {
        session_end: new Date(),
        is_active: false,
        updated_at: new Date()
      }
    });
  }

  /**
   * Get real-time session metrics
   */
  async getSessionMetrics(): Promise<SessionMetrics> {
    const activeSessions = await this.prisma.learningSessions.findMany({
      where: {
        is_active: true,
        last_heartbeat: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Active in last 5 minutes
        }
      },
      include: {
        video: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    const concurrentSessions = activeSessions.length;

    // Calculate average session duration
    const recentSessions = await this.prisma.learningSessions.findMany({
      where: {
        session_end: {
          not: null,
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        session_start: true,
        session_end: true
      }
    });

    const averageSessionDuration = recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => {
          const duration = session.session_end!.getTime() - session.session_start.getTime();
          return sum + duration;
        }, 0) / recentSessions.length / 1000 // Convert to seconds
      : 0;

    // Top active videos
    const videoSessionCounts = activeSessions.reduce((acc, session) => {
      const videoId = session.video_id;
      acc[videoId] = (acc[videoId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActiveVideos = Object.entries(videoSessionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([videoId, count]) => {
        const session = activeSessions.find(s => s.video_id === videoId);
        return {
          videoId,
          title: session?.video.title || 'Unknown',
          activeSessions: count
        };
      });

    // Device distribution
    const deviceDistribution = activeSessions.reduce((acc, session) => {
      const device = session.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      concurrentSessions,
      averageSessionDuration,
      topActiveVideos,
      deviceDistribution
    };
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(videoId: string): Promise<any> {
    const analytics = await this.prisma.userProgressAnalytics.findMany({
      where: { video_id: videoId }
    });

    const totalViews = analytics.length;
    const completions = analytics.filter(a => a.progress_status === 'completed').length;
    const completionRate = totalViews > 0 ? (completions / totalViews) * 100 : 0;

    const averageWatchTime = analytics.reduce(
      (sum, a) => sum + a.watch_time_seconds, 0
    ) / Math.max(totalViews, 1);

    const averageCompletion = analytics.reduce(
      (sum, a) => sum + Number(a.completion_percentage), 0
    ) / Math.max(totalViews, 1);

    return {
      totalViews,
      completions,
      completionRate,
      averageWatchTime,
      averageCompletion,
      progressDistribution: {
        not_started: analytics.filter(a => a.progress_status === 'not_started').length,
        started: analytics.filter(a => a.progress_status === 'started').length,
        in_progress: analytics.filter(a => a.progress_status === 'in_progress').length,
        completed: analytics.filter(a => a.progress_status === 'completed').length
      }
    };
  }

  /**
   * Calculate learning streak for user
   */
  private async calculateLearningStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivity: Date;
  }> {
    // Get daily activity for the user
    const dailyActivity = await this.prisma.$queryRaw<Array<{ activity_date: Date; videos_watched: number }>>`
      SELECT
        DATE(last_watched_at) as activity_date,
        COUNT(DISTINCT video_id) as videos_watched
      FROM user_progress
      WHERE user_id = ${userId}
        AND last_watched_at >= NOW() - INTERVAL '365 days'
      GROUP BY DATE(last_watched_at)
      ORDER BY activity_date DESC
    `;

    if (dailyActivity.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActivity: new Date(0) };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks
    for (let i = 0; i < dailyActivity.length; i++) {
      const activityDate = new Date(dailyActivity[i].activity_date);
      activityDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (i === 0 && daysDiff <= 1) {
        // Current activity within last day
        currentStreak = 1;
        tempStreak = 1;
      } else if (i > 0) {
        const prevDate = new Date(dailyActivity[i - 1].activity_date);
        const daysBetween = Math.floor((prevDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysBetween === 1) {
          // Consecutive day
          tempStreak++;
          if (i === 1 && currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
      lastActivity: new Date(dailyActivity[0].activity_date)
    };
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    analyticsData: any[],
    topicProgress: Record<string, any>
  ): string[] {
    const recommendations: string[] = [];

    // Find incomplete videos
    const incompleteVideos = analyticsData.filter(
      p => p.progress_status === 'in_progress' && Number(p.completion_percentage) > 20
    );

    if (incompleteVideos.length > 0) {
      recommendations.push(
        `Complete ${incompleteVideos.length} videos you've already started watching`
      );
    }

    // Find topics with low completion rates
    const topicsNeedingWork = Object.entries(topicProgress)
      .filter(([, data]: [string, any]) => data.averageCompletion < 50 && data.videosWatched > 1)
      .sort((a: [string, any], b: [string, any]) => a[1].averageCompletion - b[1].averageCompletion);

    if (topicsNeedingWork.length > 0) {
      const topic = topicsNeedingWork[0][0];
      recommendations.push(`Focus on ${topic} - you have room for improvement in this area`);
    }

    // Suggest next difficulty level
    const beginnerVideos = analyticsData.filter(p => p.difficulty_level === 'beginner');
    const intermediateVideos = analyticsData.filter(p => p.difficulty_level === 'intermediate');

    if (beginnerVideos.length >= 3 && intermediateVideos.length === 0) {
      recommendations.push('Try some intermediate-level content to challenge yourself');
    }

    return recommendations;
  }

  /**
   * Get empty insights structure
   */
  private getEmptyInsights(): ProgressInsights {
    return {
      totalVideosWatched: 0,
      totalCompletedVideos: 0,
      averageCompletionPercentage: 0,
      totalWatchTimeHours: 0,
      topicProgress: {},
      learningStreak: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: new Date(0)
      },
      recommendations: ['Start by watching your first educational video!']
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up stale sessions
   */
  async cleanupStaleSessions(): Promise<number> {
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const result = await this.prisma.learningSessions.updateMany({
      where: {
        is_active: true,
        last_heartbeat: {
          lt: staleThreshold
        }
      },
      data: {
        is_active: false,
        session_end: new Date(),
        updated_at: new Date()
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} stale learning sessions`);
    }

    return result.count;
  }
}