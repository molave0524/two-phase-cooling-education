'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useProgress } from '@/app/providers'
import { updateUserProgress } from '@/lib/services/progress-service'
import { Video } from '@prisma/client'
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface VideoPlayerProps {
  video: Video
  userId?: string
  autoPlay?: boolean
  className?: string
  onProgress?: (progress: VideoProgress) => void
  onComplete?: () => void
  onError?: (error: string) => void
}

interface VideoProgress {
  currentTime: number
  duration: number
  percentage: number
  buffered: number
  isPlaying: boolean
  volume: number
}

interface VideoState {
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  isError: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isFullscreen: boolean
  bufferedRanges: TimeRanges | null
}

interface ProgressUpdateData {
  videoId: string
  userId: string
  currentPosition: number
  watchTime: number
  percentage: number
  interactions: {
    pauseCount: number
    seekCount: number
    replayCount: number
  }
}

// ============================================================================
// VIDEO PLAYER COMPONENT
// ============================================================================

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  userId,
  autoPlay = false,
  className = '',
  onProgress,
  onComplete,
  onError,
}) => {
  // Refs for video element and controls
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Progress store from context
  const progressStore = useProgress()

  // Component state
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    isPaused: true,
    isLoading: true,
    isError: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    isFullscreen: false,
    bufferedRanges: null,
  })

  // Progress tracking state
  const [progressData, setProgressData] = useState<ProgressUpdateData>({
    videoId: video.id,
    userId: userId || '',
    currentPosition: 0,
    watchTime: 0,
    percentage: 0,
    interactions: {
      pauseCount: 0,
      seekCount: 0,
      replayCount: 0,
    },
  })

  // Session tracking
  const [sessionStartTime] = useState<number>(Date.now())
  const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(0)
  const [totalWatchTime, setTotalWatchTime] = useState<number>(0)

  // UI state
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

  // ============================================================================
  // VIDEO EVENT HANDLERS
  // ============================================================================

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setVideoState(prev => ({
      ...prev,
      duration: video.duration,
      isLoading: false,
      bufferedRanges: video.buffered,
    }))

    // Load saved progress if user is logged in
    if (userId) {
      loadSavedProgress()
    }
  }, [userId])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const currentTime = video.currentTime
    const duration = video.duration
    const percentage = duration > 0 ? (currentTime / duration) * 100 : 0

    setVideoState(prev => ({
      ...prev,
      currentTime,
      bufferedRanges: video.buffered,
    }))

    // Update progress data
    setProgressData(prev => ({
      ...prev,
      currentPosition: currentTime,
      percentage,
    }))

    // Calculate watch time
    const now = Date.now()
    if (videoState.isPlaying && lastProgressUpdate > 0) {
      const timeDiff = (now - lastProgressUpdate) / 1000
      setTotalWatchTime(prev => prev + timeDiff)
    }
    setLastProgressUpdate(now)

    // Call external progress callback
    if (onProgress) {
      onProgress({
        currentTime,
        duration,
        percentage,
        buffered: getBufferedPercentage(),
        isPlaying: videoState.isPlaying,
        volume: videoState.volume,
      })
    }

    // Auto-save progress every 10 seconds
    if (userId && currentTime % 10 < 0.5) {
      saveProgressToStore()
    }

    // Check for completion
    if (percentage >= 90 && !progressData.percentage || progressData.percentage < 90) {
      handleVideoComplete()
    }
  }, [videoState.isPlaying, lastProgressUpdate, progressData.percentage, userId, onProgress])

  const handlePlay = useCallback(() => {
    setVideoState(prev => ({ ...prev, isPlaying: true, isPaused: false }))
    setLastProgressUpdate(Date.now())
  }, [])

  const handlePause = useCallback(() => {
    setVideoState(prev => ({ ...prev, isPlaying: false, isPaused: true }))

    // Track pause interaction
    setProgressData(prev => ({
      ...prev,
      interactions: {
        ...prev.interactions,
        pauseCount: prev.interactions.pauseCount + 1,
      },
    }))

    // Save progress when paused
    if (userId) {
      saveProgressToStore()
    }
  }, [userId])

  const handleSeeked = useCallback(() => {
    // Track seek interaction
    setProgressData(prev => ({
      ...prev,
      interactions: {
        ...prev.interactions,
        seekCount: prev.interactions.seekCount + 1,
      },
    }))
  }, [])

  const handleVolumeChange = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setVideoState(prev => ({
      ...prev,
      volume: video.volume,
      isMuted: video.muted,
    }))
  }, [])

  const handleError = useCallback((error: Event) => {
    console.error('Video playback error:', error)
    setVideoState(prev => ({ ...prev, isError: true, isLoading: false }))

    const errorMessage = 'Failed to load video. Please check your connection and try again.'
    toast.error(errorMessage)

    if (onError) {
      onError(errorMessage)
    }
  }, [onError])

  // ============================================================================
  // PROGRESS MANAGEMENT
  // ============================================================================

  const loadSavedProgress = useCallback(async () => {
    if (!userId) return

    try {
      const savedProgress = await progressStore.getUserProgress(userId, video.id)
      if (savedProgress && videoRef.current) {
        videoRef.current.currentTime = savedProgress.last_position_seconds
        setProgressData(prev => ({
          ...prev,
          currentPosition: savedProgress.last_position_seconds,
          percentage: Number(savedProgress.completion_percentage),
          watchTime: savedProgress.watch_time_seconds,
        }))
      }
    } catch (error) {
      console.error('Failed to load saved progress:', error)
    }
  }, [userId, video.id, progressStore])

  const saveProgressToStore = useCallback(async () => {
    if (!userId) return

    try {
      await updateUserProgress({
        userId,
        videoId: video.id,
        completionPercentage: progressData.percentage,
        watchTimeSeconds: Math.floor(totalWatchTime),
        lastPositionSeconds: Math.floor(progressData.currentPosition),
        interactionCount: Object.values(progressData.interactions).reduce((a, b) => a + b, 0),
        pauseCount: progressData.interactions.pauseCount,
        seekCount: progressData.interactions.seekCount,
        replayCount: progressData.interactions.replayCount,
      })
    } catch (error) {
      console.error('Failed to save progress:', error)
      toast.error('Failed to save progress')
    }
  }, [userId, video.id, progressData, totalWatchTime])

  const handleVideoComplete = useCallback(() => {
    if (onComplete) {
      onComplete()
    }

    // Save completion progress
    if (userId) {
      setProgressData(prev => ({ ...prev, percentage: 100 }))
      saveProgressToStore()
    }

    toast.success('Video completed! 🎉')
  }, [onComplete, userId, saveProgressToStore])

  // ============================================================================
  // PLAYBACK CONTROLS
  // ============================================================================

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (videoState.isPlaying) {
      video.pause()
    } else {
      video.play().catch(error => {
        console.error('Play failed:', error)
        toast.error('Failed to play video')
      })
    }
  }, [videoState.isPlaying])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
  }, [])

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = Math.max(0, Math.min(1, volume))
  }, [])

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.duration, time))
  }, [])

  const seekToPercentage = useCallback((percentage: number) => {
    const video = videoRef.current
    if (!video || !video.duration) return

    const time = (percentage / 100) * video.duration
    seekTo(time)
  }, [seekTo])

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setVideoState(prev => ({ ...prev, playbackRate: rate }))
  }, [])

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  const getBufferedPercentage = useCallback((): number => {
    const video = videoRef.current
    if (!video || !video.buffered.length || !video.duration) return 0

    const buffered = video.buffered.end(video.buffered.length - 1)
    return (buffered / video.duration) * 100
  }, [])

  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return '0:00'

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  const handleProgressBarClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current
    if (!progressBar || !videoState.duration) return

    const rect = progressBar.getBoundingClientRect()
    const percentage = ((event.clientX - rect.left) / rect.width) * 100
    seekToPercentage(percentage)
  }, [videoState.duration, seekToPercentage])

  // ============================================================================
  // CONTROLS VISIBILITY
  // ============================================================================

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)

    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }

    const timeout = setTimeout(() => {
      if (videoState.isPlaying) {
        setShowControls(false)
      }
    }, 3000)

    setControlsTimeout(timeout)
  }, [controlsTimeout, videoState.isPlaying])

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily()
  }, [showControlsTemporarily])

  const handleMouseLeave = useCallback(() => {
    if (videoState.isPlaying && controlsTimeout) {
      clearTimeout(controlsTimeout)
      setShowControls(false)
    }
  }, [videoState.isPlaying, controlsTimeout])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('error', handleError)

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('error', handleError)
    }
  }, [
    handleLoadedMetadata,
    handleTimeUpdate,
    handlePlay,
    handlePause,
    handleSeeked,
    handleVolumeChange,
    handleError,
  ])

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (userId) {
        saveProgressToStore()
      }
    }
  }, [userId, saveProgressToStore])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (videoState.isError) {
    return (
      <div className={`video-player ${className}`}>
        <div className="flex items-center justify-center h-64 bg-secondary-900 rounded-equipment">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
            <p className="text-secondary-300">
              Sorry, we couldn't load this video. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`video-player relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full bg-secondary-900 rounded-equipment"
        poster={video.thumbnail_url || undefined}
        preload="metadata"
        autoPlay={autoPlay}
        playsInline
      >
        <source src={video.file_url} type="video/mp4" />
        <track
          kind="captions"
          srcLang="en"
          label="English"
          src={`${video.file_url.replace('.mp4', '.vtt')}`}
          default
        />
        Your browser does not support the video tag.
      </video>

      {/* Loading Overlay */}
      {videoState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary-900/50 rounded-equipment">
          <div className="loading-spinner w-8 h-8 border-primary-500"></div>
        </div>
      )}

      {/* Video Controls */}
      <div
        className={`video-controls ${
          showControls ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div
            ref={progressBarRef}
            className="video-progress"
            onClick={handleProgressBarClick}
          >
            {/* Buffer Bar */}
            <div
              className="video-progress-buffer"
              style={{ width: `${getBufferedPercentage()}%` }}
            />
            {/* Progress Bar */}
            <div
              className="video-progress-bar"
              style={{
                width: `${(videoState.currentTime / videoState.duration) * 100 || 0}%`,
              }}
            >
              {/* Progress Handle */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full shadow-lg" />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
              aria-label={videoState.isPlaying ? 'Pause' : 'Play'}
            >
              {videoState.isPlaying ? (
                <PauseIcon className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary-300 transition-colors"
                aria-label={videoState.isMuted ? 'Unmute' : 'Mute'}
              >
                {videoState.isMuted || videoState.volume === 0 ? (
                  <SpeakerXMarkIcon className="w-5 h-5" />
                ) : (
                  <SpeakerWaveIcon className="w-5 h-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={videoState.isMuted ? 0 : videoState.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-full appearance-none slider"
              />
            </div>

            {/* Time Display */}
            <div className="text-white text-sm font-mono">
              {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <select
              value={videoState.playbackRate}
              onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
              className="bg-white/20 text-white text-sm rounded px-2 py-1 border-none"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            {/* Progress Percentage */}
            <div className="text-white text-sm font-mono">
              {Math.round((videoState.currentTime / videoState.duration) * 100 || 0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Video Metadata Overlay */}
      <div className="absolute top-4 left-4 text-white">
        <h3 className="text-lg font-semibold mb-1">{video.title}</h3>
        <div className="flex items-center gap-4 text-sm text-white/80">
          <span className={`status-${video.difficulty_level}`}>
            {video.difficulty_level.charAt(0).toUpperCase() + video.difficulty_level.slice(1)}
          </span>
          <span>{formatTime(video.duration_seconds)}</span>
          <span>{video.topic_category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>
      </div>
    </div>
  )
}