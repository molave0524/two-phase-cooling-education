'use client'

import React, { useState, useCallback, useRef } from 'react'
import { VideoPlayer } from './VideoPlayer'
import { VideoMetadata } from '@/types'

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

interface MultiAngleVideoPlayerProps {
  primaryVideo: VideoMetadata & { file_url?: string; sources?: VideoSource[] }
  cameraAngles: CameraAngle[]
  userId?: string
  className?: string
  onAngleChange?: (angleId: string) => void
  onProgress?: (angleId: string, progress: any) => void
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
  const [isPipEnabled, setIsPipEnabled] = useState(false)
  const [syncPlayback, setSyncPlayback] = useState(true)

  // Refs for video synchronization
  const mainVideoRef = useRef<any>(null)
  const pipVideoRefs = useRef<Map<string, any>>(new Map())

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

      // Sync all videos to the current time if sync is enabled
      if (syncPlayback && mainVideoRef.current) {
        const currentTime = mainVideoRef.current.getCurrentTime?.() || 0

        // Sync PiP videos
        pipVideoRefs.current.forEach(ref => {
          if (ref && ref.seekTo) {
            ref.seekTo(currentTime)
          }
        })
      }
    },
    [onAngleChange, syncPlayback]
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
          return [prev[1], angleId] // Remove oldest, add new
        }
        return [...prev, angleId]
      }
    })
  }, [])

  // Handle video progress for synchronization
  const handleMainVideoProgress = useCallback(
    (progress: any) => {
      if (onProgress) {
        onProgress(activeMainAngle, progress)
      }

      // Sync PiP videos if enabled
      if (syncPlayback && progress.currentTime) {
        pipVideoRefs.current.forEach((ref, angleId) => {
          if (ref && ref.seekTo && !activePipAngles.includes(angleId)) {
            // Small tolerance to avoid constant seeking
            const timeDiff = Math.abs(ref.getCurrentTime?.() - progress.currentTime)
            if (timeDiff > 0.5) {
              ref.seekTo(progress.currentTime)
            }
          }
        })
      }
    },
    [activeMainAngle, onProgress, syncPlayback, activePipAngles]
  )

  // Handle play/pause synchronization
  const handleMainVideoPlay = useCallback(() => {
    if (syncPlayback) {
      pipVideoRefs.current.forEach(ref => {
        if (ref && ref.play) {
          ref.play()
        }
      })
    }
  }, [syncPlayback])

  const handleMainVideoPause = useCallback(() => {
    if (syncPlayback) {
      pipVideoRefs.current.forEach(ref => {
        if (ref && ref.pause) {
          ref.pause()
        }
      })
    }
  }, [syncPlayback])

  // Register PiP video ref
  const registerPipVideoRef = useCallback((angleId: string, ref: any) => {
    if (ref) {
      pipVideoRefs.current.set(angleId, ref)
    } else {
      pipVideoRefs.current.delete(angleId)
    }
  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentVideo = getCurrentVideo()

  return (
    <div className={`multi-angle-video-player ${className}`}>
      {/* Main Video Player */}
      <div className='relative'>
        <VideoPlayer
          ref={mainVideoRef}
          video={currentVideo}
          userId={userId}
          className='w-full aspect-video'
          enableAdaptiveStreaming={true}
          preferredQuality='1080p'
          onProgress={handleMainVideoProgress}
          onPlay={handleMainVideoPlay}
          onPause={handleMainVideoPause}
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
                    ref={ref => registerPipVideoRef(angleId, ref)}
                    video={angle.video}
                    userId={userId}
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
