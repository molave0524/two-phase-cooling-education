'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { VideoMetadata } from '@/types'

const VideoPlayer = dynamic(() => import('./VideoPlayer').then(mod => mod.VideoPlayer), {
  loading: () => <div className='w-full h-64 bg-gray-800 rounded-lg animate-pulse' />,
  ssr: false,
})

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface CameraAngle {
  id: string
  name: string
  description: string
  video: VideoMetadata & { file_url?: string; sources?: VideoSource[] }
  position: 'main' | 'secondary' | 'pip' // picture-in-picture
  isActive: boolean
}

interface VideoSource {
  src: string
  type: string
  quality: '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p'
  framerate?: 30 | 60
  bitrate?: number
}

interface VideoProgress {
  currentTime: number
  duration: number
  percentage: number
  buffered: number
  isPlaying: boolean
  volume: number
}

interface MultiAngleVideoPlayerProps {
  primaryVideo: VideoMetadata & { file_url?: string; sources?: VideoSource[] }
  cameraAngles: CameraAngle[]
  userId?: string
  className?: string
  onAngleChange?: (angleId: string) => void
  onProgress?: (angleId: string, progress: VideoProgress) => void
}

// ============================================================================
// MULTI-ANGLE VIDEO PLAYER COMPONENT
// ============================================================================

export const MultiAngleVideoPlayer: React.FC<MultiAngleVideoPlayerProps> = ({
  primaryVideo,
  cameraAngles,
  userId,
  className = '',
  onAngleChange,
  onProgress,
}) => {
  // State for active camera angles
  const [activeMainAngle, setActiveMainAngle] = useState<string>(primaryVideo.id)
  const [activePipAngles, setActivePipAngles] = useState<string[]>([])
  const [syncPlayback, setSyncPlayback] = useState(true)

  // Get current active video data
  const getCurrentVideo = useCallback(() => {
    if (activeMainAngle === primaryVideo.id) {
      return primaryVideo
    }
    return cameraAngles.find(angle => angle.id === activeMainAngle)?.video || primaryVideo
  }, [activeMainAngle, primaryVideo, cameraAngles])

  // Switch main camera angle
  const switchMainAngle = useCallback(
    (angleId: string) => {
      setActiveMainAngle(angleId)

      if (onAngleChange) {
        onAngleChange(angleId)
      }

      // Sync functionality disabled (refs removed for simplicity)
    },
    [onAngleChange]
  )

  // Toggle picture-in-picture for a camera angle
  const togglePipAngle = useCallback((angleId: string) => {
    setActivePipAngles(prev => {
      const isActive = prev.includes(angleId)

      if (isActive) {
        return prev.filter(id => id !== angleId)
      } else {
        // Limit to 2 PiP videos for performance
        if (prev.length >= 2) {
          return [prev[1]!, angleId] // Remove oldest, add new
        }
        return [...prev, angleId]
      }
    })
  }, [])

  // Handle video progress for synchronization
  const handleMainVideoProgress = useCallback(
    (progress: VideoProgress) => {
      if (onProgress) {
        onProgress(activeMainAngle, progress)
      }

      // Sync functionality disabled (refs removed for simplicity)
    },
    [activeMainAngle, onProgress]
  )

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentVideo = getCurrentVideo()

  return (
    <div className={`multi-angle-video-player ${className}`}>
      {/* Main Video Player */}
      <div className='relative'>
        <VideoPlayer
          video={currentVideo}
          userId={userId || 'anonymous'}
          className='w-full aspect-video'
          enableAdaptiveStreaming={true}
          preferredQuality='1080p'
          onProgress={handleMainVideoProgress}
        />

        {/* Camera Angle Selector */}
        <div className='absolute top-4 right-4 flex flex-col gap-2'>
          <div className='bg-black/80 rounded-lg p-3 backdrop-blur-sm'>
            <h4 className='text-white text-sm font-semibold mb-2'>Camera Angles</h4>

            {/* Primary Video Option */}
            <button
              onClick={() => switchMainAngle(primaryVideo.id)}
              className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                activeMainAngle === primaryVideo.id
                  ? 'bg-primary-600 text-white'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Main View
            </button>

            {/* Camera Angle Options */}
            {cameraAngles.map(angle => (
              <div key={angle.id} className='flex items-center gap-1'>
                <button
                  onClick={() => switchMainAngle(angle.id)}
                  className={`flex-1 text-left px-3 py-2 rounded text-sm transition-colors ${
                    activeMainAngle === angle.id
                      ? 'bg-primary-600 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {angle.name}
                </button>

                {/* PiP Toggle */}
                <button
                  onClick={() => togglePipAngle(angle.id)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activePipAngles.includes(angle.id)
                      ? 'bg-secondary-600 text-white'
                      : 'text-white/60 hover:bg-white/10'
                  }`}
                  title='Picture-in-Picture'
                >
                  PiP
                </button>
              </div>
            ))}
          </div>

          {/* Sync Controls */}
          <div className='bg-black/80 rounded-lg p-3 backdrop-blur-sm'>
            <label className='flex items-center gap-2 text-white text-sm'>
              <input
                type='checkbox'
                checked={syncPlayback}
                onChange={e => setSyncPlayback(e.target.checked)}
                className='rounded'
              />
              Sync Playback
            </label>
          </div>
        </div>

        {/* Picture-in-Picture Videos */}
        {activePipAngles.length > 0 && (
          <div className='absolute bottom-20 right-4 flex flex-col gap-2'>
            {activePipAngles.map((angleId, index) => {
              const angle = cameraAngles.find(a => a.id === angleId)
              if (!angle) return null

              return (
                <div
                  key={angleId}
                  className='relative w-48 aspect-video rounded-lg overflow-hidden border-2 border-white/20'
                  style={{ zIndex: 10 - index }}
                >
                  <VideoPlayer
                    video={angle.video}
                    userId={userId || 'anonymous'}
                    className='w-full h-full'
                    autoPlay={false}
                    enableAdaptiveStreaming={false}
                    preferredQuality='720p'
                  />

                  {/* PiP Video Label */}
                  <div className='absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-white text-xs'>
                    {angle.name}
                  </div>

                  {/* Close PiP Button */}
                  <button
                    onClick={() => togglePipAngle(angleId)}
                    className='absolute top-2 right-2 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600/80 transition-colors'
                  >
                    ×
                  </button>

                  {/* Make Main Button */}
                  <button
                    onClick={() => switchMainAngle(angleId)}
                    className='absolute bottom-2 right-2 px-2 py-1 bg-primary-600/80 rounded text-white text-xs hover:bg-primary-600 transition-colors'
                  >
                    Main
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Video Information */}
      <div className='mt-4 p-4 bg-secondary-50 rounded-lg'>
        <h3 className='text-lg font-semibold text-secondary-900 mb-2'>{currentVideo.title}</h3>
        <p className='text-secondary-700 mb-3'>{currentVideo.description}</p>

        {/* Active Angle Info */}
        <div className='flex items-center gap-4 text-sm text-secondary-600'>
          <span>
            <strong>Active View:</strong>{' '}
            {activeMainAngle === primaryVideo.id
              ? 'Main View'
              : cameraAngles.find(a => a.id === activeMainAngle)?.name || 'Unknown'}
          </span>

          {activePipAngles.length > 0 && (
            <span>
              <strong>PiP:</strong>{' '}
              {activePipAngles
                .map(id => cameraAngles.find(a => a.id === id)?.name)
                .filter(Boolean)
                .join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MultiAngleVideoPlayer
