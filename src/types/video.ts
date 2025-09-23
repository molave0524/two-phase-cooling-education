/**
 * Video-related TypeScript type definitions
 * Centralized types for video functionality across the application
 */

// Core Video interface with all possible fields
export interface Video {
  id: string
  title: string
  slug: string
  description: string
  duration?: number
  duration_seconds: number
  category?: string
  topic_category?: string
  thumbnail_url: string
  is_featured?: boolean
  difficulty_level?: string
  learning_objectives?: string[]
  view_count?: number
  prerequisites?: string[]

  // Video player specific fields
  file_url?: string
  youtube_id?: string
}

// Video progress tracking
export interface VideoProgress {
  currentTime: number
  duration: number
  percentComplete: number
  timestamp: Date
}

// Video player state
export interface VideoPlayerState {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  isLoading: boolean
  hasError: boolean
  errorMessage?: string
}

// Video player props interface
export interface VideoPlayerProps {
  video: Video
  userId?: string
  autoPlay?: boolean
  className?: string
  onProgress?: (progress: VideoProgress) => void
  onComplete?: () => void
  onError?: (error: string) => void
}

// Video categories for filtering
export type VideoCategory =
  | 'thermal-fundamentals'
  | 'cooling-systems'
  | 'performance-optimization'
  | 'troubleshooting'
  | 'maintenance'

// Video difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
