'use client'

import React, { useState, useEffect } from 'react'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { Video } from '@prisma/client'
import { PlayIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export const VideoShowcase: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Sample video data (in production, this would come from API)
  const sampleVideos: Video[] = [
    {
      id: '1',
      title: 'Introduction to Two-Phase Cooling',
      slug: 'intro-two-phase-cooling',
      description: 'Discover the fundamentals of two-phase cooling technology and how it revolutionizes thermal management.',
      duration_seconds: 480,
      topic_category: 'cooling-basics',
      difficulty_level: 'beginner' as any,
      learning_objectives: [
        'Understand basic principles of two-phase cooling',
        'Learn about heat transfer mechanisms',
        'Identify key components of the cooling system'
      ],
      prerequisites: [],
      file_url: '/videos/intro-two-phase-cooling.mp4',
      thumbnail_url: '/images/thumbnails/intro-two-phase.jpg',
      view_count: 1250,
      completion_count: 890,
      average_completion_percentage: 85.5,
      average_watch_time: 408,
      published_at: new Date(),
      is_featured: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '2',
      title: 'Advanced Thermal Dynamics',
      slug: 'advanced-thermal-dynamics',
      description: 'Deep dive into the thermal dynamics principles that make two-phase cooling superior.',
      duration_seconds: 720,
      topic_category: 'thermal-science',
      difficulty_level: 'advanced' as any,
      learning_objectives: [
        'Master thermal dynamics equations',
        'Analyze heat transfer coefficients',
        'Calculate cooling efficiency metrics'
      ],
      prerequisites: ['intro-two-phase-cooling'],
      file_url: '/videos/advanced-thermal-dynamics.mp4',
      thumbnail_url: '/images/thumbnails/thermal-dynamics.jpg',
      view_count: 680,
      completion_count: 445,
      average_completion_percentage: 72.3,
      average_watch_time: 520,
      published_at: new Date(),
      is_featured: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '3',
      title: 'Performance Under Load Testing',
      slug: 'performance-under-load',
      description: 'Witness real-time performance testing under extreme computational loads.',
      duration_seconds: 900,
      topic_category: 'performance',
      difficulty_level: 'intermediate' as any,
      learning_objectives: [
        'Observe real-time temperature monitoring',
        'Understand performance metrics',
        'Analyze cooling efficiency data'
      ],
      prerequisites: ['intro-two-phase-cooling'],
      file_url: '/videos/performance-under-load.mp4',
      thumbnail_url: '/images/thumbnails/performance-testing.jpg',
      view_count: 920,
      completion_count: 645,
      average_completion_percentage: 78.9,
      average_watch_time: 710,
      published_at: new Date(),
      is_featured: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]

  useEffect(() => {
    setVideos(sampleVideos)
    setSelectedVideo(sampleVideos[0]) // Default to first video
  }, [])

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'beginner': return 'text-success-600 bg-success-100'
      case 'intermediate': return 'text-accent-600 bg-accent-100'
      case 'advanced': return 'text-danger-600 bg-danger-100'
      default: return 'text-secondary-600 bg-secondary-100'
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
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-4">
        <h2 id="demonstrations-heading" className="text-3xl font-bold text-secondary-900">
          Interactive Demonstrations
        </h2>
        <p className="text-lg text-secondary-600 max-w-3xl mx-auto">
          Experience two-phase cooling technology through our comprehensive video demonstrations.
          Watch real-world testing, learn the science, and see the results.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          {selectedVideo && (
            <div className="space-y-6">
              <VideoPlayer
                video={selectedVideo}
                userId="demo-user" // In production, get from auth
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
                className="aspect-video"
              />

              {/* Video Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-secondary-900">
                      {selectedVideo.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-secondary-600">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDuration(selectedVideo.duration_seconds)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <PlayIcon className="w-4 h-4" />
                        <span>{selectedVideo.view_count.toLocaleString()} views</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedVideo.difficulty_level)}`}>
                        {selectedVideo.difficulty_level.charAt(0).toUpperCase() + selectedVideo.difficulty_level.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-secondary-600">Completion Rate</div>
                    <div className="text-lg font-bold text-primary-600">
                      {selectedVideo.average_completion_percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <p className="text-secondary-700 leading-relaxed">
                  {selectedVideo.description}
                </p>

                {/* Learning Objectives */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-secondary-900">What You'll Learn</h4>
                  <ul className="space-y-2">
                    {selectedVideo.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
                        <span className="text-secondary-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Playlist */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-secondary-900">Video Series</h3>

          <div className="space-y-3">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleVideoSelect(video)}
                className={`w-full text-left p-4 rounded-equipment transition-all hover:shadow-glass ${
                  selectedVideo?.id === video.id
                    ? 'bg-primary-50 border-2 border-primary-200'
                    : 'bg-white border border-secondary-200 hover:border-primary-200'
                }`}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-12 bg-secondary-200 rounded flex-shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <PlayIcon className="w-6 h-6 text-white" />
                    </div>
                    {video.is_featured && (
                      <div className="absolute top-1 right-1">
                        <StarIcon className="w-3 h-3 text-accent-500 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-medium text-secondary-900 line-clamp-2 text-sm">
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-secondary-600">
                      <span>{formatDuration(video.duration_seconds)}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getDifficultyColor(video.difficulty_level)}`}>
                        {video.difficulty_level.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-secondary-500">
                      {video.view_count.toLocaleString()} views
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Learning Path Info */}
          <div className="bg-secondary-50 rounded-equipment p-4">
            <h4 className="font-semibold text-secondary-900 mb-2">Recommended Learning Path</h4>
            <p className="text-sm text-secondary-600 mb-3">
              Follow our structured curriculum for the best learning experience.
            </p>
            <ol className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Introduction to Two-Phase Cooling</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-secondary-300 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Performance Under Load</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-secondary-300 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Advanced Thermal Dynamics</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}