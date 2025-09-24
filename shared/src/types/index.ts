export interface VideoMetadata {
  id: string
  title: string
  slug: string
  description: string
  duration_seconds: number
  category: VideoCategory
  topic_category: string
  thumbnail_url: string
  is_featured: boolean
  difficulty_level: DifficultyLevel
  learning_objectives: string[]
  view_count: number
  prerequisites: string[]
  file_url?: string
  youtube_id?: string
}

export type VideoCategory =
  | 'thermal-fundamentals'
  | 'cooling-systems'
  | 'performance-optimization'
  | 'troubleshooting'
  | 'maintenance'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export interface VideoProgress {
  currentTime: number
  duration: number
  percentComplete: number
  timestamp: Date
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface FilterParams {
  category?: VideoCategory
  difficulty?: DifficultyLevel
  featured?: boolean
  search?: string
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime?: number
  environment: string
  version: string
  services: Record<string, 'healthy' | 'unhealthy'>
}

export interface VideoListResponse {
  videos: VideoMetadata[]
  total: number
  categories: VideoCategory[]
  difficulty_levels: DifficultyLevel[]
}
