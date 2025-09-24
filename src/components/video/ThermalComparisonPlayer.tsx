'use client'

import React, { useState, useRef, useEffect } from 'react'
import { VideoPlayer } from './VideoPlayer'
import { VideoMetadata } from '@/types'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ThermalComparisonData {
  timestamp: number // seconds into video
  traditional_temp: number // °C
  twophase_temp: number // °C
  load_percentage: number // CPU/GPU load %
  ambient_temp: number // °C
}

interface ThermalComparisonVideo extends VideoMetadata {
  thermal_data: ThermalComparisonData[]
  comparison_type: 'gaming' | 'rendering' | 'overclocking'
  max_temp_traditional: number
  max_temp_twophase: number
  avg_temp_difference: number
}

interface ThermalComparisonPlayerProps {
  video: ThermalComparisonVideo
  userId?: string
  autoPlay?: boolean
  className?: string
  onProgress?: (progress: any) => void
  onComplete?: () => void
}

// ============================================================================
// THERMAL COMPARISON PLAYER COMPONENT
// ============================================================================

export const ThermalComparisonPlayer: React.FC<ThermalComparisonPlayerProps> = ({
  video,
  userId,
  autoPlay = false,
  className = '',
  onProgress,
  onComplete,
}) => {
  const [currentThermalData, setCurrentThermalData] = useState<ThermalComparisonData | null>(null)
  const [showThermalOverlay, setShowThermalOverlay] = useState(true)
  const [showMetrics, setShowMetrics] = useState(true)

  // Update thermal data based on video progress
  const handleVideoProgress = (progress: any) => {
    const currentTime = progress.currentTime

    // Find thermal data for current timestamp
    const thermalPoint = video.thermal_data.find((data, index) => {
      const nextData = video.thermal_data[index + 1]
      return data.timestamp <= currentTime && (!nextData || currentTime < nextData.timestamp)
    })

    if (thermalPoint) {
      setCurrentThermalData(thermalPoint)
    }

    // Call parent progress handler
    if (onProgress) {
      onProgress({
        ...progress,
        thermal_data: thermalPoint,
      })
    }
  }

  const getTemperatureColor = (temp: number, maxTemp: number): string => {
    const ratio = temp / maxTemp
    if (ratio < 0.3) return 'text-green-500'
    if (ratio < 0.6) return 'text-yellow-500'
    if (ratio < 0.8) return 'text-orange-500'
    return 'text-red-500'
  }

  const getLoadColor = (load: number): string => {
    if (load < 30) return 'bg-green-500'
    if (load < 60) return 'bg-yellow-500'
    if (load < 85) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className={`thermal-comparison-player ${className}`}>
      {/* Main Video Player */}
      <div className='relative'>
        <VideoPlayer
          video={video}
          userId={userId}
          autoPlay={autoPlay}
          enableAdaptiveStreaming={true}
          preferredQuality='1080p'
          onProgress={handleVideoProgress}
          onComplete={onComplete}
          className='w-full aspect-video'
        />

        {/* Temperature Scale Overlay */}
        {showThermalOverlay && (
          <div className='absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white'>
            <h4 className='text-sm font-semibold mb-2'>FLIR Thermal Scale</h4>
            <div className='space-y-1 text-xs'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-blue-500 rounded'></div>
                <span>Cold (20-40°C)</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-green-500 rounded'></div>
                <span>Cool (40-60°C)</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-yellow-500 rounded'></div>
                <span>Warm (60-80°C)</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-orange-500 rounded'></div>
                <span>Hot (80-95°C)</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-red-500 rounded'></div>
                <span>Critical (95°C+)</span>
              </div>
            </div>
          </div>
        )}

        {/* Split-Screen Labels */}
        <div className='absolute top-4 left-4 flex gap-4'>
          <div className='bg-black/80 backdrop-blur-sm rounded px-3 py-1 text-white text-sm font-semibold'>
            Traditional Cooling
          </div>
          <div className='bg-black/80 backdrop-blur-sm rounded px-3 py-1 text-white text-sm font-semibold'>
            Two-Phase Cooling
          </div>
        </div>

        {/* Toggle Controls */}
        <div className='absolute bottom-20 right-4 flex flex-col gap-2'>
          <button
            onClick={() => setShowThermalOverlay(!showThermalOverlay)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              showThermalOverlay ? 'bg-primary-600 text-white' : 'bg-white/20 text-white/70'
            }`}
          >
            Thermal Scale
          </button>
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              showMetrics ? 'bg-primary-600 text-white' : 'bg-white/20 text-white/70'
            }`}
          >
            Live Metrics
          </button>
        </div>
      </div>

      {/* Real-time Thermal Metrics */}
      {showMetrics && currentThermalData && (
        <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Traditional Cooling Temperature */}
          <div className='bg-white rounded-lg border border-gray-200 p-4'>
            <div className='text-sm text-gray-600 mb-1'>Traditional Cooling</div>
            <div
              className={`text-2xl font-bold ${getTemperatureColor(currentThermalData.traditional_temp, video.max_temp_traditional)}`}
            >
              {currentThermalData.traditional_temp}°C
            </div>
            <div className='text-xs text-gray-500'>Max: {video.max_temp_traditional}°C</div>
          </div>

          {/* Two-Phase Cooling Temperature */}
          <div className='bg-white rounded-lg border border-gray-200 p-4'>
            <div className='text-sm text-gray-600 mb-1'>Two-Phase Cooling</div>
            <div
              className={`text-2xl font-bold ${getTemperatureColor(currentThermalData.twophase_temp, video.max_temp_twophase)}`}
            >
              {currentThermalData.twophase_temp}°C
            </div>
            <div className='text-xs text-gray-500'>Max: {video.max_temp_twophase}°C</div>
          </div>

          {/* Temperature Difference */}
          <div className='bg-white rounded-lg border border-gray-200 p-4'>
            <div className='text-sm text-gray-600 mb-1'>Temperature Difference</div>
            <div className='text-2xl font-bold text-green-600'>
              -{(currentThermalData.traditional_temp - currentThermalData.twophase_temp).toFixed(1)}
              °C
            </div>
            <div className='text-xs text-gray-500'>
              Avg: -{video.avg_temp_difference.toFixed(1)}°C
            </div>
          </div>

          {/* System Load */}
          <div className='bg-white rounded-lg border border-gray-200 p-4'>
            <div className='text-sm text-gray-600 mb-1'>System Load</div>
            <div className='text-2xl font-bold text-gray-900'>
              {currentThermalData.load_percentage}%
            </div>
            <div className='mt-2 w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getLoadColor(currentThermalData.load_percentage)}`}
                style={{ width: `${currentThermalData.load_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Summary */}
      <div className='mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-3'>
          {video.comparison_type.charAt(0).toUpperCase() + video.comparison_type.slice(1)} Load
          Comparison Summary
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-red-500'>{video.max_temp_traditional}°C</div>
            <div className='text-sm text-gray-600'>Traditional Peak</div>
          </div>

          <div className='text-center'>
            <div className='text-3xl font-bold text-green-500'>{video.max_temp_twophase}°C</div>
            <div className='text-sm text-gray-600'>Two-Phase Peak</div>
          </div>

          <div className='text-center'>
            <div className='text-3xl font-bold text-primary-600'>
              {(
                ((video.max_temp_traditional - video.max_temp_twophase) /
                  video.max_temp_traditional) *
                100
              ).toFixed(1)}
              %
            </div>
            <div className='text-sm text-gray-600'>Temperature Reduction</div>
          </div>
        </div>

        <p className='text-sm text-gray-700 mt-4 text-center'>
          Two-phase cooling maintains {video.avg_temp_difference.toFixed(1)}°C lower average
          temperatures, preventing thermal throttling and maintaining peak performance.
        </p>
      </div>
    </div>
  )
}

export default ThermalComparisonPlayer
