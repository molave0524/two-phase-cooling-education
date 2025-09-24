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
  difficulty_level?: DifficultyLevel
  learning_objectives?: string[]
  view_count?: number
  prerequisites?: string[]

  // Video player specific fields
  file_url?: string
  youtube_id?: string
}

// VideoMetadata interface for enhanced video information
export interface VideoMetadata extends Video {
  poster_url?: string
  sources?: VideoSource[]
}

// Video source configuration for multi-quality playback
export interface VideoSource {
  src: string
  type: string
  quality: '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p'
  framerate?: 30 | 60
  bitrate?: number
}

// Enhanced video metadata for video service responses
export interface EnhancedVideoMetadata extends VideoMetadata {
  // Enhanced fields that may not exist in base Video
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

// Video list response interface
export interface VideoListResponse {
  success: boolean
  data: VideoMetadata[]
  pagination?: {
    page: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters?: FilterParams
}

// Filter parameters for video queries
export interface FilterParams {
  category?: VideoCategory
  difficulty?: DifficultyLevel
  featured?: boolean
  search?: string
  page?: number
  limit?: number
}

// Video difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
