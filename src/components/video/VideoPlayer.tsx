'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useProgress } from '@/app/providers'
// import { updateUserProgress } from '@/lib/services/progress-service'
// import { Video } from '@prisma/client'

import { VideoMetadata, VideoProgress as SharedVideoProgress, DifficultyLevel } from '@/types'

// Enhanced video interface for player
interface EnhancedVideo extends VideoMetadata {
  file_url?: string
  sources?: VideoSource[]
  poster_url?: string
}

interface VideoSource {
  src: string
  type: string
  quality: '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p'
  framerate?: 30 | 60
  bitrate?: number
}
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid'
import { toast } from 'react-hot-toast'
import styles from './VideoPlayer.module.css'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface VideoPlayerProps {
  video: EnhancedVideo
  userId?: string
  autoPlay?: boolean
  className?: string
  enableAdaptiveStreaming?: boolean
  preferredQuality?: VideoSource['quality']
  onProgress?: (progress: VideoProgress) => void
  onComplete?: () => void
  onError?: (error: string) => void
  onQualityChange?: (quality: VideoSource['quality']) => void
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
  currentQuality: VideoSource['quality']
  availableQualities: VideoSource['quality'][]
  adaptiveStreamingEnabled: boolean
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent'
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
  enableAdaptiveStreaming = true,
  preferredQuality = '1080p',
  onProgress,
  onComplete,
  onError,
  onQualityChange,
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
    currentQuality: preferredQuality,
    availableQualities: video.sources?.map(s => s.quality) || ['1080p'],
    adaptiveStreamingEnabled: enableAdaptiveStreaming,
    networkQuality: 'good',
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

  // Completion tracking - reset when video changes
  const [hasCompleted, setHasCompleted] = useState(false)

  // Reset completion state when video changes
  useEffect(() => {
    setHasCompleted(false)
  }, [video.id])

  // Session tracking
  // const [sessionStartTime] = useState<number>(Date.now())
  const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(0)
  // const [totalWatchTime, setTotalWatchTime] = useState<number>(0)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // if (videoState.isPlaying && lastProgressUpdate > 0) {
    //   const timeDiff = (now - lastProgressUpdate) / 1000
    //   setTotalWatchTime(prev => prev + timeDiff)
    // }
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

    // Check for completion (only trigger once when reaching 90% or more)
    if (percentage >= 90 && !hasCompleted) {
      setHasCompleted(true)
      handleVideoComplete()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    videoState.isPlaying,
    lastProgressUpdate,
    progressData.percentage,
    userId,
    onProgress,
    hasCompleted,
  ])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleSeeked = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    // Reset completion state if seeking backwards
    const percentage = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0
    if (percentage < 90) {
      setHasCompleted(false)
    }

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

  const handleError = useCallback(
    (error: Event) => {
      console.error('Video playback error:', error)
      setVideoState(prev => ({ ...prev, isError: true, isLoading: false }))

      const errorMessage = 'Failed to load video. Please check your connection and try again.'
      toast.error(errorMessage)

      if (onError) {
        onError(errorMessage)
      }
    },
    [onError]
  )

  // ============================================================================
  // PROGRESS MANAGEMENT
  // ============================================================================

  const loadSavedProgress = useCallback(async () => {
    if (!userId) return

    try {
      // Demo mode - no saved progress to load
    } catch (error) {
      console.error('Failed to load saved progress:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, video.id])

  const saveProgressToStore = useCallback(async () => {
    if (!userId) return

    try {
      // Demo mode - use simplified progress update
      progressStore.updateProgress()
    } catch (error) {
      console.error('Failed to save progress:', error)
      toast.error('Failed to save progress')
    }
  }, [userId, progressStore])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete, userId])

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

  const seekToPercentage = useCallback(
    (percentage: number) => {
      const video = videoRef.current
      if (!video || !video.duration) return

      const time = (percentage / 100) * video.duration
      seekTo(time)
    },
    [seekTo]
  )

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setVideoState(prev => ({ ...prev, playbackRate: rate }))
  }, [])

  // ============================================================================
  // ADAPTIVE STREAMING AND QUALITY MANAGEMENT
  // ============================================================================

  const getCurrentVideoSource = useCallback((): VideoSource | null => {
    if (!video.sources || video.sources.length === 0) {
      return video.file_url
        ? {
            src: video.file_url,
            type: 'video/mp4',
            quality: '1080p',
            framerate: 60,
          }
        : null
    }

    // Find source matching current quality
    return video.sources.find(s => s.quality === videoState.currentQuality) || video.sources[0]
  }, [video.sources, video.file_url, videoState.currentQuality])

  const changeVideoQuality = useCallback(
    (quality: VideoSource['quality']) => {
      const videoElement = videoRef.current
      if (!videoElement) return

      const newSource = video.sources?.find(s => s.quality === quality)
      if (!newSource) return

      const currentTime = videoElement.currentTime
      const wasPlaying = !videoElement.paused

      // Update video source
      videoElement.src = newSource.src
      videoElement.load()

      // Restore playback position and state
      const handleLoadedMetadata = () => {
        videoElement.currentTime = currentTime
        if (wasPlaying) {
          videoElement.play().catch(console.error)
        }
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)

      setVideoState(prev => ({ ...prev, currentQuality: quality }))

      if (onQualityChange) {
        onQualityChange(quality)
      }
    },
    [video.sources, onQualityChange]
  )

  const detectNetworkQuality = useCallback(() => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection

    if (!connection) {
      return 'good' // Default if Network Information API not available
    }

    const { downlink, effectiveType } = connection

    if (effectiveType === '4g' && downlink > 10) return 'excellent'
    if (effectiveType === '4g' && downlink > 5) return 'good'
    if (effectiveType === '3g' || (effectiveType === '4g' && downlink > 1)) return 'fair'
    return 'poor'
  }, [])

  const adaptQualityToNetwork = useCallback(() => {
    if (!videoState.adaptiveStreamingEnabled || !video.sources) return

    const networkQuality = detectNetworkQuality()
    setVideoState(prev => ({ ...prev, networkQuality }))

    // Auto-adjust quality based on network
    let recommendedQuality: VideoSource['quality'] = '720p'

    switch (networkQuality) {
      case 'excellent':
        recommendedQuality = '1080p'
        break
      case 'good':
        recommendedQuality = '720p'
        break
      case 'fair':
        recommendedQuality = '480p'
        break
      case 'poor':
        recommendedQuality = '360p'
        break
    }

    // Only change if the recommended quality is available and different
    if (
      video.sources.some(s => s.quality === recommendedQuality) &&
      recommendedQuality !== videoState.currentQuality
    ) {
      changeVideoQuality(recommendedQuality)
    }
  }, [
    videoState.adaptiveStreamingEnabled,
    videoState.currentQuality,
    video.sources,
    detectNetworkQuality,
    changeVideoQuality,
  ])

  const toggleAdaptiveStreaming = useCallback(() => {
    setVideoState(prev => ({
      ...prev,
      adaptiveStreamingEnabled: !prev.adaptiveStreamingEnabled,
    }))
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

  const handleProgressBarClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const progressBar = progressBarRef.current
      if (!progressBar || !videoState.duration) return

      const rect = progressBar.getBoundingClientRect()
      const percentage = ((event.clientX - rect.left) / rect.width) * 100
      seekToPercentage(percentage)
    },
    [videoState.duration, seekToPercentage]
  )

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout])

  // Initialize adaptive streaming
  useEffect(() => {
    if (enableAdaptiveStreaming) {
      adaptQualityToNetwork()

      // Monitor network changes
      const connection = (navigator as any).connection
      if (connection) {
        const handleNetworkChange = () => adaptQualityToNetwork()
        connection.addEventListener('change', handleNetworkChange)

        return () => {
          connection.removeEventListener('change', handleNetworkChange)
        }
      }
    }
  }, [enableAdaptiveStreaming, adaptQualityToNetwork])

  // Update video source when quality changes
  useEffect(() => {
    const currentSource = getCurrentVideoSource()
    const videoElement = videoRef.current

    if (currentSource && videoElement && videoElement.src !== currentSource.src) {
      const currentTime = videoElement.currentTime
      const wasPlaying = !videoElement.paused

      videoElement.src = currentSource.src
      videoElement.load()

      const handleLoadedMetadata = () => {
        videoElement.currentTime = currentTime
        if (wasPlaying) {
          videoElement.play().catch(console.error)
        }
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [getCurrentVideoSource])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (videoState.isError) {
    return (
      <div className={`video-player ${className}`}>
        <div className='flex items-center justify-center h-64 bg-secondary-900 rounded-equipment'>
          <div className='text-center text-white'>
            <div className='text-4xl mb-4'>⚠️</div>
            <h3 className='text-lg font-semibold mb-2'>Video Unavailable</h3>
            <p className='text-secondary-300'>
              Sorry, we couldn&apos;t load this video. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.videoPlayer} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={styles.videoElement}
        poster={video.thumbnail_url || video.poster_url || undefined}
        preload='metadata'
        autoPlay={autoPlay}
        playsInline
        crossOrigin='anonymous'
      >
        {video.sources && video.sources.length > 0
          ? video.sources.map((source, index) => (
              <source
                key={index}
                src={source.src}
                type={source.type}
                data-quality={source.quality}
                data-framerate={source.framerate}
              />
            ))
          : video.file_url && <source src={video.file_url} type='video/mp4' />}
        {/* Captions disabled for demo */}
        Your browser does not support the video tag.
      </video>

      {/* Loading Overlay */}
      {videoState.isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}

      {/* Video Controls */}
      <div className={`${styles.videoControls} ${showControls ? '' : styles.hidden}`}>
        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div ref={progressBarRef} className={styles.progressBar} onClick={handleProgressBarClick}>
            {/* Buffer Bar */}
            <div
              className={styles.progressBuffer}
              style={{ width: `${getBufferedPercentage()}%` }}
            />
            {/* Progress Bar */}
            <div
              className={styles.progressFill}
              style={{
                width: `${(videoState.currentTime / videoState.duration) * 100 || 0}%`,
              }}
            >
              {/* Progress Handle */}
              <div className={styles.progressHandle} />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className={styles.controlsRow}>
          <div className={styles.controlsLeft}>
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className={styles.playButton}
              aria-label={videoState.isPlaying ? 'Pause' : 'Play'}
            >
              {videoState.isPlaying ? (
                <PauseIcon className='w-5 h-5' />
              ) : (
                <PlayIcon className='w-5 h-5 ml-0.5' />
              )}
            </button>

            {/* Volume Control */}
            <div className={styles.volumeControls}>
              <button
                onClick={toggleMute}
                className={styles.volumeButton}
                aria-label={videoState.isMuted ? 'Unmute' : 'Mute'}
              >
                {videoState.isMuted || videoState.volume === 0 ? (
                  <SpeakerXMarkIcon className='w-5 h-5' />
                ) : (
                  <SpeakerWaveIcon className='w-5 h-5' />
                )}
              </button>

              <input
                type='range'
                min='0'
                max='1'
                step='0.1'
                value={videoState.isMuted ? 0 : videoState.volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className={styles.volumeSlider}
              />
            </div>

            {/* Time Display */}
            <div className={styles.timeDisplay}>
              {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
            </div>
          </div>

          <div className={styles.controlsRight}>
            {/* Quality Selector */}
            {videoState.availableQualities.length > 1 && (
              <select
                value={videoState.currentQuality}
                onChange={e => changeVideoQuality(e.target.value as VideoSource['quality'])}
                className={styles.qualitySelect}
                title={`Current: ${videoState.currentQuality} (Network: ${videoState.networkQuality})`}
              >
                {videoState.availableQualities.map(quality => (
                  <option key={quality} value={quality}>
                    {quality} {quality === '1080p' ? '60fps' : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Adaptive Streaming Toggle */}
            <button
              onClick={toggleAdaptiveStreaming}
              className={`${styles.adaptiveButton} ${
                videoState.adaptiveStreamingEnabled ? styles.active : styles.inactive
              }`}
              title='Toggle adaptive streaming based on network quality'
            >
              AUTO
            </button>

            {/* Playback Speed */}
            <select
              value={videoState.playbackRate}
              onChange={e => changePlaybackRate(parseFloat(e.target.value))}
              className={styles.qualitySelect}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            {/* Network Quality Indicator */}
            <div className={styles.networkIndicator}>
              <div className={`${styles.networkDot} ${styles[videoState.networkQuality]}`} />
              <span className='capitalize'>{videoState.networkQuality}</span>
            </div>

            {/* Progress Percentage */}
            <div className={styles.progressPercentage}>
              {Math.round((videoState.currentTime / videoState.duration) * 100 || 0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Video Metadata Overlay */}
      <div className={styles.metadataOverlay}>
        <h3 className={styles.videoTitle}>{video.title}</h3>
        <div className={styles.videoMeta}>
          {video.difficulty_level && (
            <span className={`${styles.difficultyBadge} ${styles[video.difficulty_level]}`}>
              {video.difficulty_level.charAt(0).toUpperCase() + video.difficulty_level.slice(1)}
            </span>
          )}
          <span>{formatTime(video.duration_seconds)}</span>
          {video.topic_category && (
            <span>
              {video.topic_category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
