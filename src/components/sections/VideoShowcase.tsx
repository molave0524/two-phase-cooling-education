'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { PlayIcon, ClockIcon, StarIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import styles from './VideoShowcase.module.css'

// Dynamic import for performance optimization
const VideoPlayer = dynamic(() => import('@/components/video/VideoPlayer'), {
  loading: () => (
    <div className='w-full h-64 bg-secondary-100 rounded-lg flex items-center justify-center'>
      <div className='text-secondary-600'>Loading video player...</div>
    </div>
  ),
  ssr: false,
})
// Mock type for demo mode
interface Video {
  id: string
  title: string
  slug: string
  description: string
  youtube_id: string
  duration: number
  duration_seconds: number
  category: string
  topic_category: string
  thumbnail_url: string
  is_featured?: boolean
  difficulty_level: string
  learning_objectives: string[]
  view_count: number
  prerequisites: string[]
  file_url: string
  completion_count: number
  average_completion_percentage: number
  average_watch_time: number
  published_at: Date
  created_at?: Date
  updated_at?: Date
}

// Stress test demonstration videos (Story 1.3 focus)
const SAMPLE_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Gaming Load Stress Test - FLIR Thermal Comparison',
    slug: 'gaming-load-stress-test',
    description:
      'Real-time thermal imaging during intense gaming sessions. Watch traditional air cooling fail while two-phase cooling maintains optimal temperatures.',
    youtube_id: 'demo123456',
    duration: 6,
    duration_seconds: 360,
    category: 'Gaming Loads',
    topic_category: 'gaming-stress',
    difficulty_level: 'beginner',
    learning_objectives: [
      'See dramatic temperature differences under gaming load',
      'Observe cooling system response times',
      'Understand thermal performance under real-world conditions',
    ],
    prerequisites: [],
    file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=480&h=270',
    view_count: 2100,
    completion_count: 1890,
    average_completion_percentage: 92.1,
    average_watch_time: 330,
    published_at: new Date(),
    is_featured: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    title: 'FLIR Thermal Imaging - Side-by-Side Comparison',
    slug: 'flir-thermal-comparison',
    description:
      'Professional FLIR thermal imaging showing both two-phase cooling case and traditional air-cooled case running identical stress tests. Watch the dramatic temperature differences in real-time with visible temperature scales.',
    youtube_id: 'demo456789',
    duration: 5,
    duration_seconds: 300,
    category: 'FLIR Thermal Analysis',
    topic_category: 'thermal-imaging',
    difficulty_level: 'intermediate',
    learning_objectives: [
      'See exact temperature differences via FLIR thermal imaging',
      'Understand heat distribution patterns in both cooling systems',
      'Observe thermal response times during load changes',
      'Compare thermal throttling points between systems',
    ],
    prerequisites: [],
    file_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=480&h=270',
    view_count: 3200,
    completion_count: 2850,
    average_completion_percentage: 94.5,
    average_watch_time: 285,
    published_at: new Date(),
    is_featured: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '3',
    title: 'Extreme Overclocking - Temperature Breakthrough',
    slug: 'extreme-overclocking-stress',
    description:
      'Pushing hardware beyond factory limits. See how two-phase cooling enables performance impossible with traditional cooling methods.',
    youtube_id: 'demo789012',
    duration: 8,
    duration_seconds: 480,
    category: 'Extreme Overclocking',
    topic_category: 'overclocking-stress',
    difficulty_level: 'advanced',
    learning_objectives: [
      'Witness extreme performance scenarios',
      'See cooling system under maximum stress',
      'Understand thermal limits and breakthroughs',
    ],
    prerequisites: [],
    file_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=480&h=270',
    view_count: 1420,
    completion_count: 1180,
    average_completion_percentage: 87.3,
    average_watch_time: 420,
    published_at: new Date(),
    is_featured: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '4',
    title: 'Rendering Workload Endurance Test',
    slug: 'rendering-workload-stress',
    description:
      'Hours of continuous 3D rendering stress. Traditional cooling systems overheat and throttle - two-phase cooling maintains peak performance throughout.',
    youtube_id: 'demo345678',
    duration: 10,
    duration_seconds: 600,
    category: 'Rendering Workloads',
    topic_category: 'rendering-stress',
    difficulty_level: 'intermediate',
    learning_objectives: [
      'See sustained performance under continuous load',
      'Compare thermal throttling vs consistent performance',
      'Understand professional workload thermal requirements',
    ],
    prerequisites: [],
    file_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&h=270',
    view_count: 980,
    completion_count: 745,
    average_completion_percentage: 78.9,
    average_watch_time: 485,
    published_at: new Date(),
    is_featured: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
]

export const VideoShowcase: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    setVideos(SAMPLE_VIDEOS)
    setSelectedVideo(SAMPLE_VIDEOS[0]!) // Default to first video
  }, [])

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleVideoProgress = (progress: any) => {
    // Handle video progress updates
    console.log('Video progress:', progress)
  }

  const handleVideoComplete = () => {
    // Handle video completion
    console.log('Video completed!')
  }

  // Component render
  return (
    <div className={styles.demoSection}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Section Header */}
          <div className={styles.header}>
            <div className={styles.titleWrapper}>
              <VideoCameraIcon className={styles.titleIcon} />
              <h2 id='videos-heading' className={styles.title}>
                Videos
              </h2>
            </div>
          </div>

          <div className={styles.videoGrid}>
            {/* Video Player - Prominent on all screens */}
            <div className={styles.videoPlayerSection}>
              {selectedVideo && (
                <div className={styles.videoInfo}>
                  <VideoPlayer
                    key={selectedVideo.id}
                    video={selectedVideo as any}
                    userId='demo-user'
                    autoPlay={true}
                    enableAdaptiveStreaming={true}
                    preferredQuality='1080p'
                    onProgress={handleVideoProgress}
                    onComplete={handleVideoComplete}
                    className='aspect-video'
                  />

                  {/* Video Info */}
                  <div>
                    <div className={styles.videoHeader}>
                      <div className={styles.videoTitleSection}>
                        <h3 className={styles.videoTitle}>{selectedVideo.title}</h3>
                      </div>
                      <div className={styles.videoMeta}>
                        <div className={styles.metaItem}>
                          <ClockIcon className={styles.smallIcon} />
                          <span>{formatDuration(selectedVideo.duration_seconds)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className={styles.videoDescription}>{selectedVideo.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Video Playlist */}
          <div className={styles.playlistSection}>
            <h3 className={styles.playlistTitle}>Demo Videos</h3>

            <div className={styles.playlistContainer}>
              {videos.map(video => (
                <button
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className={`${styles.playlistItem} ${
                    selectedVideo?.id === video.id ? styles.playlistItemSelected : ''
                  }`}
                >
                  <div className={styles.playlistItemContent}>
                    {/* Thumbnail */}
                    <div
                      className={`${styles.playlistThumbnail} ${
                        selectedVideo?.id === video.id
                          ? styles.playlistThumbnailSelected
                          : styles.playlistThumbnailDefault
                      }`}
                    >
                      <PlayIcon className={styles.playIcon} />
                      {video.is_featured && <StarIcon className={styles.featuredStar} />}
                      {selectedVideo?.id === video.id && (
                        <div className={styles.playingIndicator}></div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className={styles.playlistItemInfo}>
                      <h4 className={styles.playlistItemTitle}>{video.title}</h4>
                      <div className={styles.playlistItemMeta}>
                        <span>{formatDuration(video.duration_seconds)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
