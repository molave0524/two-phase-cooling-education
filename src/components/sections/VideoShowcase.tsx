'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

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
import { PlayIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

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

  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'beginner':
        return 'text-success-600 bg-success-100'
      case 'intermediate':
        return 'text-accent-600 bg-accent-100'
      case 'advanced':
        return 'text-danger-600 bg-danger-100'
      default:
        return 'text-secondary-600 bg-secondary-100'
    }
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

  return (
    <div className='space-y-8'>
      {/* Section Header */}
      <div className='text-center space-y-4'>
        <h2
          id='demonstrations-heading'
          className='text-3xl lg:text-4xl font-bold text-secondary-900'
        >
          Stress Test Demonstrations
        </h2>
        <p className='text-xl text-secondary-700 max-w-2xl mx-auto'>
          Watch thermal comparisons under extreme loads. See the difference when it matters most.
        </p>
      </div>

      <div className='grid lg:grid-cols-3 gap-6 lg:gap-8'>
        {/* Video Player - Prominent on all screens */}
        <div className='lg:col-span-2 order-1'>
          {selectedVideo && (
            <div className='space-y-6'>
              <VideoPlayer
                key={selectedVideo.id} // Force re-mount when video changes
                video={selectedVideo}
                userId='demo-user' // In production, get from auth
                autoPlay={true} // Story 1.3: Video ready to play immediately
                enableAdaptiveStreaming={true}
                preferredQuality='1080p'
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
                className='aspect-video'
              />

              {/* Video Info */}
              <div className='space-y-4'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-2'>
                    <h3 className='text-2xl font-bold text-secondary-900'>{selectedVideo.title}</h3>
                    <div className='flex items-center gap-4 text-sm text-secondary-600'>
                      <div className='flex items-center gap-1'>
                        <ClockIcon className='w-4 h-4' />
                        <span>{formatDuration(selectedVideo.duration_seconds)}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <PlayIcon className='w-4 h-4' />
                        <span>{selectedVideo.view_count.toLocaleString()} views</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedVideo.difficulty_level)}`}
                      >
                        {selectedVideo.difficulty_level.charAt(0).toUpperCase() +
                          selectedVideo.difficulty_level.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-secondary-600'>Completion Rate</div>
                    <div className='text-lg font-bold text-primary-600'>
                      {selectedVideo.average_completion_percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <p className='text-secondary-700 leading-relaxed'>{selectedVideo.description}</p>

                {/* Learning Objectives */}
                <div className='space-y-3'>
                  <h4 className='font-semibold text-secondary-900'>What You&apos;ll Learn</h4>
                  <ul className='space-y-2'>
                    {selectedVideo.learning_objectives.map((objective, index) => (
                      <li key={index} className='flex items-start gap-2'>
                        <CheckCircleIcon className='w-5 h-5 text-success-600 mt-0.5 flex-shrink-0' />
                        <span className='text-secondary-700'>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Playlist */}
        <div className='space-y-6 order-2'>
          <h3 className='text-xl font-semibold text-secondary-900'>Video Series</h3>

          <div className='space-y-3'>
            {videos.map(video => (
              <button
                key={video.id}
                onClick={() => handleVideoSelect(video)}
                className={`w-full text-left p-4 rounded-equipment transition-all hover:shadow-glass ${
                  selectedVideo?.id === video.id
                    ? 'bg-primary-50 border-2 border-primary-200'
                    : 'bg-white border border-secondary-200 hover:border-primary-200'
                }`}
              >
                <div className='flex gap-4'>
                  {/* Thumbnail */}
                  <div className='relative w-20 h-12 bg-secondary-200 rounded flex-shrink-0 overflow-hidden'>
                    <div
                      className={`absolute inset-0 flex items-center justify-center ${
                        selectedVideo?.id === video.id
                          ? 'bg-gradient-to-br from-green-500 to-green-700'
                          : 'bg-gradient-to-br from-primary-500 to-primary-700'
                      }`}
                    >
                      <PlayIcon className='w-6 h-6 text-white' />
                    </div>
                    {video.is_featured && (
                      <div className='absolute top-1 right-1'>
                        <StarIcon className='w-3 h-3 text-accent-500 fill-current' />
                      </div>
                    )}
                    {selectedVideo?.id === video.id && (
                      <div className='absolute bottom-1 left-1'>
                        <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className='flex-1 min-w-0 space-y-1'>
                    <h4 className='font-medium text-secondary-900 line-clamp-2 text-sm'>
                      {video.title}
                    </h4>
                    <div className='flex items-center gap-2 text-xs text-secondary-600'>
                      <span>{formatDuration(video.duration_seconds)}</span>
                      <span>•</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs ${getDifficultyColor(video.difficulty_level)}`}
                      >
                        {video.difficulty_level.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className='text-xs text-secondary-500'>
                      {video.view_count.toLocaleString()} views
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Stress Test Categories */}
          <div className='bg-secondary-50 rounded-equipment p-4'>
            <h4 className='font-semibold text-secondary-900 mb-2'>Stress Test Categories</h4>
            <p className='text-sm text-secondary-600 mb-3'>
              See dramatic thermal performance under different extreme loads.
            </p>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 bg-green-500 rounded-full'></span>
                <span>Gaming Loads - Real-time thermal comparison</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 bg-blue-500 rounded-full'></span>
                <span>FLIR Thermal Analysis - Professional imaging</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 bg-orange-500 rounded-full'></span>
                <span>Rendering Workloads - Sustained performance</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 bg-red-500 rounded-full'></span>
                <span>Extreme Overclocking - Beyond limits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
