/**
 * Video Service
 * Manages video metadata, streaming sources, and delivery optimization
 */

import {
  VideoMetadata,
  VideoListResponse,
  FilterParams,
  VideoCategory,
  DifficultyLevel,
} from '@/types'

// Enhanced video interface with CDN sources
export interface EnhancedVideoMetadata extends VideoMetadata {
  sources: VideoSource[]
  cdn_url: string
  processing_status: 'pending' | 'processing' | 'ready' | 'error'
  file_size_mb: number
  encoding_profiles: EncodingProfile[]
}

export interface VideoSource {
  src: string
  type: string
  quality: '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p'
  framerate: 30 | 60
  bitrate: number
  codec: 'h264' | 'h265' | 'av1'
  hdr?: boolean
}

export interface EncodingProfile {
  quality: VideoSource['quality']
  framerate: VideoSource['framerate']
  bitrate: number
  codec: VideoSource['codec']
  file_size_mb: number
  processing_time_seconds?: number
}

export interface CameraAngle {
  id: string
  name: string
  description: string
  video: EnhancedVideoMetadata
  position: 'front' | 'side' | 'top' | 'thermal' | 'interior'
  sync_offset_ms: number
}

export interface VideoCollection {
  id: string
  title: string
  description: string
  primary_video: EnhancedVideoMetadata
  camera_angles: CameraAngle[]
  featured_angles: string[]
  total_duration_seconds: number
}

// ============================================================================
// VIDEO SERVICE CLASS
// ============================================================================

export class VideoService {
  private static instance: VideoService
  private baseUrl: string
  private cdnUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    this.cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://d1example.cloudfront.net'
  }

  static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService()
    }
    return VideoService.instance
  }

  // ============================================================================
  // VIDEO METADATA OPERATIONS
  // ============================================================================

  async getVideos(filters: FilterParams = {}): Promise<VideoListResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (filters.category) queryParams.append('category', filters.category)
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty)
      if (filters.featured !== undefined)
        queryParams.append('featured', filters.featured.toString())
      if (filters.search) queryParams.append('search', filters.search)

      const response = await fetch(`${this.baseUrl}/api/videos?${queryParams}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`)
      }

      const data = await response.json()
      return this.enhanceVideoData(data)
    } catch (error) {
      console.error('Error fetching videos:', error)
      return this.getFallbackVideoData(filters)
    }
  }

  async getVideoById(id: string): Promise<EnhancedVideoMetadata | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/videos/${id}`)

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`Failed to fetch video: ${response.statusText}`)
      }

      const video = await response.json()
      return this.enhanceVideoMetadata(video)
    } catch (error) {
      console.error('Error fetching video:', error)
      return this.getFallbackVideoById(id)
    }
  }

  async getVideoCollection(id: string): Promise<VideoCollection | null> {
    try {
      // For now, return mock data with multiple camera angles
      return this.getMockVideoCollection(id)
    } catch (error) {
      console.error('Error fetching video collection:', error)
      return null
    }
  }

  // ============================================================================
  // VIDEO ENHANCEMENT AND CDN OPTIMIZATION
  // ============================================================================

  private enhanceVideoData(data: VideoListResponse): VideoListResponse {
    return {
      ...data,
      videos: data.videos.map(video => this.enhanceVideoMetadata(video)),
    }
  }

  private enhanceVideoMetadata(video: VideoMetadata): EnhancedVideoMetadata {
    const sources = this.generateVideoSources(video)

    return {
      ...video,
      sources,
      cdn_url: this.getCdnUrl(video.id),
      processing_status: 'ready',
      file_size_mb: this.estimateFileSize(sources),
      encoding_profiles: this.getEncodingProfiles(),
    }
  }

  private generateVideoSources(video: VideoMetadata): VideoSource[] {
    const baseUrl = this.getCdnUrl(video.id)

    // Generate multiple quality sources
    const qualities: Array<{ quality: VideoSource['quality']; bitrate: number }> = [
      { quality: '360p', bitrate: 1000 },
      { quality: '480p', bitrate: 2500 },
      { quality: '720p', bitrate: 5000 },
      { quality: '1080p', bitrate: 8000 },
    ]

    return qualities.map(({ quality, bitrate }) => ({
      src: `${baseUrl}/${quality}/index.m3u8`,
      type: 'application/x-mpegURL', // HLS for adaptive streaming
      quality,
      framerate: quality === '1080p' ? 60 : 30,
      bitrate,
      codec: 'h264',
    }))
  }

  private getCdnUrl(videoId: string): string {
    return `${this.cdnUrl}/videos/${videoId}`
  }

  private estimateFileSize(sources: VideoSource[]): number {
    // Estimate based on highest quality source
    const highestQuality = sources.find(s => s.quality === '1080p')
    return highestQuality ? (highestQuality.bitrate * 300) / 8 / 1024 : 500 // ~5min video estimate
  }

  private getEncodingProfiles(): EncodingProfile[] {
    return [
      { quality: '360p', framerate: 30, bitrate: 1000, codec: 'h264', file_size_mb: 75 },
      { quality: '480p', framerate: 30, bitrate: 2500, codec: 'h264', file_size_mb: 187 },
      { quality: '720p', framerate: 30, bitrate: 5000, codec: 'h264', file_size_mb: 375 },
      { quality: '1080p', framerate: 60, bitrate: 8000, codec: 'h264', file_size_mb: 600 },
    ]
  }

  // ============================================================================
  // FALLBACK DATA FOR DEMO MODE
  // ============================================================================

  private getFallbackVideoData(filters: FilterParams): VideoListResponse {
    const mockVideos: EnhancedVideoMetadata[] = [
      {
        id: 'thermal-comparison-gaming',
        title: 'FLIR Thermal Comparison: Gaming Load Test',
        slug: 'flir-thermal-comparison-gaming-load',
        description:
          'Side-by-side thermal imaging comparison showing temperature differences between traditional air cooling and two-phase cooling during intensive gaming sessions.',
        duration_seconds: 180,
        category: 'thermal-fundamentals',
        topic_category: 'performance-comparison',
        thumbnail_url: '/thumbnails/thermal-gaming.jpg',
        is_featured: true,
        difficulty_level: 'beginner',
        learning_objectives: [
          'Understand thermal imaging visualization',
          'Compare cooling effectiveness under gaming loads',
          'Identify temperature hotspots and thermal patterns',
        ],
        view_count: 1247,
        prerequisites: [],
        sources: this.generateVideoSources({ id: 'thermal-comparison-gaming' } as VideoMetadata),
        cdn_url: this.getCdnUrl('thermal-comparison-gaming'),
        processing_status: 'ready',
        file_size_mb: 450,
        encoding_profiles: this.getEncodingProfiles(),
      },
      {
        id: 'extreme-overclocking-demo',
        title: 'Extreme Overclocking with Two-Phase Cooling',
        slug: 'extreme-overclocking-demo',
        description:
          'Demonstration of extreme overclocking scenarios using two-phase cooling technology under maximum thermal load conditions.',
        duration_seconds: 420,
        category: 'performance-optimization',
        topic_category: 'extreme-performance',
        thumbnail_url: '/thumbnails/overclocking-demo.jpg',
        is_featured: true,
        difficulty_level: 'advanced',
        learning_objectives: [
          'Understand extreme cooling scenarios',
          'See overclocking thermal management in action',
          'Learn about thermal limits and safety margins',
        ],
        view_count: 892,
        prerequisites: ['thermal-fundamentals'],
        sources: this.generateVideoSources({ id: 'extreme-overclocking-demo' } as VideoMetadata),
        cdn_url: this.getCdnUrl('extreme-overclocking-demo'),
        processing_status: 'ready',
        file_size_mb: 630,
        encoding_profiles: this.getEncodingProfiles(),
      },
    ]

    // Apply filters
    let filteredVideos = mockVideos

    if (filters.category) {
      filteredVideos = filteredVideos.filter(v => v.category === filters.category)
    }

    if (filters.difficulty) {
      filteredVideos = filteredVideos.filter(v => v.difficulty_level === filters.difficulty)
    }

    if (filters.featured !== undefined) {
      filteredVideos = filteredVideos.filter(v => v.is_featured === filters.featured)
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredVideos = filteredVideos.filter(
        v =>
          v.title.toLowerCase().includes(searchTerm) ||
          v.description.toLowerCase().includes(searchTerm)
      )
    }

    return {
      videos: filteredVideos,
      total: filteredVideos.length,
      categories: ['thermal-fundamentals', 'cooling-systems', 'performance-optimization'],
      difficulty_levels: ['beginner', 'intermediate', 'advanced'],
    }
  }

  private getFallbackVideoById(id: string): EnhancedVideoMetadata | null {
    const fallbackData = this.getFallbackVideoData({})
    return fallbackData.videos.find(v => v.id === id || v.slug === id) || null
  }

  private getMockVideoCollection(id: string): VideoCollection {
    const primaryVideo = this.getFallbackVideoById(id) || this.getFallbackVideoData({}).videos[0]

    const cameraAngles: CameraAngle[] = [
      {
        id: `${id}-front`,
        name: 'Front View',
        description: 'Direct view of cooling system and components',
        video: { ...primaryVideo, id: `${id}-front` },
        position: 'front',
        sync_offset_ms: 0,
      },
      {
        id: `${id}-thermal`,
        name: 'FLIR Thermal',
        description: 'Thermal imaging showing temperature distribution',
        video: { ...primaryVideo, id: `${id}-thermal` },
        position: 'thermal',
        sync_offset_ms: 0,
      },
      {
        id: `${id}-side`,
        name: 'Side Profile',
        description: 'Side view showing cooling flow dynamics',
        video: { ...primaryVideo, id: `${id}-side` },
        position: 'side',
        sync_offset_ms: 0,
      },
    ]

    return {
      id,
      title: `${primaryVideo.title} - Multi-Angle View`,
      description: `Complete thermal analysis with multiple camera perspectives`,
      primary_video: primaryVideo,
      camera_angles: cameraAngles,
      featured_angles: [`${id}-thermal`, `${id}-front`],
      total_duration_seconds: primaryVideo.duration_seconds,
    }
  }

  // ============================================================================
  // PERFORMANCE OPTIMIZATION
  // ============================================================================

  preloadVideo(videoId: string, quality: VideoSource['quality'] = '720p'): void {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'video'
    link.href = `${this.getCdnUrl(videoId)}/${quality}/index.m3u8`
    document.head.appendChild(link)
  }

  preloadThumbnail(thumbnailUrl: string): void {
    const img = new Image()
    img.src = thumbnailUrl
  }

  getOptimalQuality(connectionSpeed?: number): VideoSource['quality'] {
    if (!connectionSpeed) return '720p'

    if (connectionSpeed > 10) return '1080p'
    if (connectionSpeed > 5) return '720p'
    if (connectionSpeed > 2) return '480p'
    return '360p'
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const videoService = VideoService.getInstance()
export default videoService
