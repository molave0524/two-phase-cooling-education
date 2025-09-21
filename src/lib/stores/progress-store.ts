// Progress Store
// Two-Phase Cooling Education Center
//
// Zustand store for managing user progress state across the application

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { UserProgress, Video } from '@prisma/client'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface VideoWithProgress extends Video {
  progress?: UserProgress
}

export interface LearningPathProgress {
  pathId: string
  pathName: string
  currentVideoIndex: number
  videosCompleted: number
  totalVideos: number
  completionPercentage: number
  lastActivity: Date
}

export interface ProgressState {
  // Current session data
  currentVideo: VideoWithProgress | null
  currentProgress: UserProgress | null
  isPlaying: boolean
  currentTime: number
  duration: number

  // User progress data
  userProgress: Map<string, UserProgress> // videoId -> progress
  learningPaths: LearningPathProgress[]
  recentVideos: VideoWithProgress[]

  // Statistics
  totalWatchTime: number
  videosCompleted: number
  streakDays: number
  lastActivityDate: Date | null

  // UI state
  isLoading: boolean
  error: string | null
}

export interface ProgressActions {
  // Video playback actions
  setCurrentVideo: (video: VideoWithProgress) => void
  updateCurrentProgress: (progress: Partial<UserProgress>) => void
  setPlaybackState: (isPlaying: boolean, currentTime: number, duration: number) => void

  // Progress management
  updateVideoProgress: (videoId: string, progress: UserProgress) => void
  markVideoCompleted: (videoId: string) => void
  addToRecentVideos: (video: VideoWithProgress) => void

  // Learning paths
  updateLearningPath: (pathProgress: LearningPathProgress) => void
  advanceInPath: (pathId: string) => void

  // Statistics
  updateStats: (watchTime: number, completed?: boolean) => void
  updateStreak: () => void

  // Data fetching
  fetchUserProgress: (userId: string) => Promise<void>
  getUserProgress: (userId: string, videoId: string) => Promise<UserProgress | null>
  syncProgress: (userId: string) => Promise<void>

  // Utilities
  resetProgress: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export type ProgressStore = ProgressState & ProgressActions

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ProgressState = {
  currentVideo: null,
  currentProgress: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,

  userProgress: new Map(),
  learningPaths: [],
  recentVideos: [],

  totalWatchTime: 0,
  videosCompleted: 0,
  streakDays: 0,
  lastActivityDate: null,

  isLoading: false,
  error: null,
}

// ============================================================================
// STORE CREATION
// ============================================================================

export const createProgressStore = () =>
  create<ProgressStore>()(
    persist(
      (set, get) => ({
        ...initialState,

        // ========================================================================
        // VIDEO PLAYBACK ACTIONS
        // ========================================================================

        setCurrentVideo: (video: VideoWithProgress) => {
          set((state) => ({
            currentVideo: video,
            currentProgress: video.progress || null,
            error: null,
          }))

          // Add to recent videos
          get().addToRecentVideos(video)
        },

        updateCurrentProgress: (progressUpdate: Partial<UserProgress>) => {
          set((state) => {
            if (!state.currentProgress) return state

            const updatedProgress = {
              ...state.currentProgress,
              ...progressUpdate,
              updated_at: new Date(),
            }

            return {
              currentProgress: updatedProgress,
              currentVideo: state.currentVideo
                ? { ...state.currentVideo, progress: updatedProgress }
                : null,
            }
          })
        },

        setPlaybackState: (isPlaying: boolean, currentTime: number, duration: number) => {
          set({
            isPlaying,
            currentTime,
            duration,
          })

          // Update activity timestamp
          if (isPlaying) {
            set({ lastActivityDate: new Date() })
          }
        },

        // ========================================================================
        // PROGRESS MANAGEMENT
        // ========================================================================

        updateVideoProgress: (videoId: string, progress: UserProgress) => {
          set((state) => {
            const newProgressMap = new Map(state.userProgress)
            newProgressMap.set(videoId, progress)

            return {
              userProgress: newProgressMap,
              lastActivityDate: new Date(),
            }
          })
        },

        markVideoCompleted: (videoId: string) => {
          const state = get()
          const existingProgress = state.userProgress.get(videoId)

          if (existingProgress) {
            const completedProgress: UserProgress = {
              ...existingProgress,
              completion_percentage: 100,
              completed_at: new Date(),
              updated_at: new Date(),
            }

            get().updateVideoProgress(videoId, completedProgress)
            get().updateStats(0, true) // Mark as completed
          }
        },

        addToRecentVideos: (video: VideoWithProgress) => {
          set((state) => {
            const filtered = state.recentVideos.filter(v => v.id !== video.id)
            const newRecent = [video, ...filtered].slice(0, 10) // Keep last 10

            return { recentVideos: newRecent }
          })
        },

        // ========================================================================
        // LEARNING PATHS
        // ========================================================================

        updateLearningPath: (pathProgress: LearningPathProgress) => {
          set((state) => {
            const filtered = state.learningPaths.filter(p => p.pathId !== pathProgress.pathId)
            return {
              learningPaths: [...filtered, pathProgress],
            }
          })
        },

        advanceInPath: (pathId: string) => {
          set((state) => {
            const path = state.learningPaths.find(p => p.pathId === pathId)
            if (!path) return state

            const updatedPath: LearningPathProgress = {
              ...path,
              currentVideoIndex: Math.min(path.currentVideoIndex + 1, path.totalVideos - 1),
              videosCompleted: path.videosCompleted + 1,
              completionPercentage: ((path.videosCompleted + 1) / path.totalVideos) * 100,
              lastActivity: new Date(),
            }

            const filtered = state.learningPaths.filter(p => p.pathId !== pathId)
            return {
              learningPaths: [...filtered, updatedPath],
            }
          })
        },

        // ========================================================================
        // STATISTICS
        // ========================================================================

        updateStats: (watchTime: number, completed: boolean = false) => {
          set((state) => ({
            totalWatchTime: state.totalWatchTime + watchTime,
            videosCompleted: completed ? state.videosCompleted + 1 : state.videosCompleted,
            lastActivityDate: new Date(),
          }))

          // Update streak if needed
          get().updateStreak()
        },

        updateStreak: () => {
          const state = get()
          const today = new Date()
          const lastActivity = state.lastActivityDate

          if (!lastActivity) {
            set({ streakDays: 1 })
            return
          }

          const daysSince = Math.floor(
            (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (daysSince === 0) {
            // Same day, no change
            return
          } else if (daysSince === 1) {
            // Consecutive day, increment streak
            set({ streakDays: state.streakDays + 1 })
          } else {
            // Streak broken, reset
            set({ streakDays: 1 })
          }
        },

        // ========================================================================
        // DATA FETCHING
        // ========================================================================

        fetchUserProgress: async (userId: string) => {
          set({ isLoading: true, error: null })

          try {
            const response = await fetch(`/api/progress/user/${userId}`)
            if (!response.ok) {
              throw new Error('Failed to fetch user progress')
            }

            const data = await response.json()

            // Convert array to Map for efficient lookups
            const progressMap = new Map<string, UserProgress>()
            data.progress?.forEach((p: UserProgress) => {
              progressMap.set(p.video_id, p)
            })

            set({
              userProgress: progressMap,
              learningPaths: data.learningPaths || [],
              totalWatchTime: data.stats?.totalWatchTime || 0,
              videosCompleted: data.stats?.videosCompleted || 0,
              streakDays: data.stats?.streakDays || 0,
              isLoading: false,
            })
          } catch (error) {
            console.error('Failed to fetch user progress:', error)
            set({
              error: error instanceof Error ? error.message : 'Failed to load progress',
              isLoading: false,
            })
          }
        },

        getUserProgress: async (userId: string, videoId: string): Promise<UserProgress | null> => {
          // Check local cache first
          const cached = get().userProgress.get(videoId)
          if (cached) {
            return cached
          }

          // Fetch from API
          try {
            const response = await fetch(`/api/progress/user/${userId}/video/${videoId}`)
            if (response.status === 404) {
              return null // No progress yet
            }

            if (!response.ok) {
              throw new Error('Failed to fetch video progress')
            }

            const progress = await response.json()
            get().updateVideoProgress(videoId, progress)
            return progress
          } catch (error) {
            console.error('Failed to fetch video progress:', error)
            return null
          }
        },

        syncProgress: async (userId: string) => {
          const state = get()

          // Sync all local progress to server
          const progressArray = Array.from(state.userProgress.entries()).map(([videoId, progress]) => ({
            ...progress,
            user_id: userId,
            video_id: videoId,
          }))

          try {
            const response = await fetch(`/api/progress/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId,
                progress: progressArray,
                stats: {
                  totalWatchTime: state.totalWatchTime,
                  videosCompleted: state.videosCompleted,
                  streakDays: state.streakDays,
                },
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to sync progress')
            }

            console.log('Progress synced successfully')
          } catch (error) {
            console.error('Failed to sync progress:', error)
            set({ error: 'Failed to sync progress to server' })
          }
        },

        // ========================================================================
        // UTILITIES
        // ========================================================================

        resetProgress: () => {
          set(initialState)
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading })
        },

        setError: (error: string | null) => {
          set({ error })
        },
      }),
      {
        name: 'progress-store',
        storage: createJSONStorage(() => localStorage),

        // Serialize Maps to objects for storage
        serialize: (state) => {
          return JSON.stringify({
            ...state,
            state: {
              ...state.state,
              userProgress: Object.fromEntries(state.state.userProgress),
            },
          })
        },

        // Deserialize objects back to Maps
        deserialize: (str) => {
          const parsed = JSON.parse(str)
          return {
            ...parsed,
            state: {
              ...parsed.state,
              userProgress: new Map(Object.entries(parsed.state.userProgress || {})),
              lastActivityDate: parsed.state.lastActivityDate
                ? new Date(parsed.state.lastActivityDate)
                : null,
            },
          }
        },

        // Merge strategy for hydration
        merge: (persistedState, currentState) => {
          const merged = { ...currentState, ...persistedState }

          // Ensure userProgress is a Map
          if (merged.userProgress && !(merged.userProgress instanceof Map)) {
            merged.userProgress = new Map(Object.entries(merged.userProgress))
          }

          // Ensure dates are Date objects
          if (merged.lastActivityDate && typeof merged.lastActivityDate === 'string') {
            merged.lastActivityDate = new Date(merged.lastActivityDate)
          }

          return merged
        },

        // Only persist specific keys
        partialize: (state) => ({
          userProgress: state.userProgress,
          recentVideos: state.recentVideos,
          totalWatchTime: state.totalWatchTime,
          videosCompleted: state.videosCompleted,
          streakDays: state.streakDays,
          lastActivityDate: state.lastActivityDate,
        }),
      }
    )
  )

// ============================================================================
// SELECTORS
// ============================================================================

// Helper selectors for common use cases
export const selectVideoProgress = (state: ProgressStore, videoId: string) =>
  state.userProgress.get(videoId)

export const selectProgressPercentage = (state: ProgressStore, videoId: string) => {
  const progress = state.userProgress.get(videoId)
  return progress ? Number(progress.completion_percentage) : 0
}

export const selectIsVideoCompleted = (state: ProgressStore, videoId: string) => {
  const progress = state.userProgress.get(videoId)
  return progress ? progress.completed_at !== null : false
}

export const selectLearningPathProgress = (state: ProgressStore, pathId: string) =>
  state.learningPaths.find(p => p.pathId === pathId)

export const selectUserStats = (state: ProgressStore) => ({
  totalWatchTime: state.totalWatchTime,
  videosCompleted: state.videosCompleted,
  streakDays: state.streakDays,
  recentVideos: state.recentVideos.length,
})

// ============================================================================
// HOOKS
// ============================================================================

// Custom hooks for component usage
export const useVideoProgress = (videoId: string) => {
  const store = createProgressStore()()
  return {
    progress: selectVideoProgress(store, videoId),
    percentage: selectProgressPercentage(store, videoId),
    isCompleted: selectIsVideoCompleted(store, videoId),
    updateProgress: (progress: UserProgress) => store.updateVideoProgress(videoId, progress),
    markCompleted: () => store.markVideoCompleted(videoId),
  }
}

export const useLearningPath = (pathId: string) => {
  const store = createProgressStore()()
  return {
    pathProgress: selectLearningPathProgress(store, pathId),
    advance: () => store.advanceInPath(pathId),
    update: (progress: LearningPathProgress) => store.updateLearningPath(progress),
  }
}

export const useUserStats = () => {
  const store = createProgressStore()()
  return selectUserStats(store)
}