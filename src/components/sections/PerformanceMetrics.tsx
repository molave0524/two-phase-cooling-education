'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface PerformanceData {
  metric: string
  current: number
  baseline: number
  unit: string
  description: string
  trend: 'up' | 'down' | 'stable'
  category: 'temperature' | 'efficiency' | 'environmental' | 'performance'
}

interface TestScenario {
  id: string
  name: string
  description: string
  duration: string
  workload: string
  results: {
    maxTemp: number
    avgTemp: number
    efficiency: number
    quietness: number
  }
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const PERFORMANCE_METRICS: PerformanceData[] = [
  {
    metric: 'Peak Operating Temperature',
    current: 45,
    baseline: 85,
    unit: '°C',
    description: 'Maximum CPU temperature under sustained load',
    trend: 'down',
    category: 'temperature'
  },
  {
    metric: 'Thermal Efficiency',
    current: 96.5,
    baseline: 72.3,
    unit: '%',
    description: 'Heat transfer efficiency vs traditional cooling',
    trend: 'up',
    category: 'efficiency'
  },
  {
    metric: 'Cooling Capacity',
    current: 850,
    baseline: 420,
    unit: 'W',
    description: 'Maximum heat dissipation capability',
    trend: 'up',
    category: 'performance'
  },
  {
    metric: 'Global Warming Potential',
    current: 20,
    baseline: 1400,
    unit: 'GWP',
    description: 'Environmental impact compared to traditional refrigerants',
    trend: 'down',
    category: 'environmental'
  },
  {
    metric: 'Noise Level',
    current: 18,
    baseline: 45,
    unit: 'dB',
    description: 'Operating noise under full load',
    trend: 'down',
    category: 'performance'
  },
  {
    metric: 'Power Consumption',
    current: 35,
    baseline: 85,
    unit: 'W',
    description: 'Total system power for cooling operation',
    trend: 'down',
    category: 'efficiency'
  }
]

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'gaming',
    name: 'Gaming Workload',
    description: 'Sustained 4K gaming with RTX 4090 + i9-13900K',
    duration: '4 hours',
    workload: 'GPU + CPU intensive',
    results: {
      maxTemp: 43,
      avgTemp: 38,
      efficiency: 94.2,
      quietness: 19
    }
  },
  {
    id: 'rendering',
    name: '3D Rendering',
    description: 'Blender Cycles rendering with full CPU/GPU utilization',
    duration: '8 hours',
    workload: 'Maximum thermal load',
    results: {
      maxTemp: 45,
      avgTemp: 41,
      efficiency: 96.8,
      quietness: 21
    }
  },
  {
    id: 'ml-training',
    name: 'ML Model Training',
    description: 'TensorFlow training on large dataset',
    duration: '12 hours',
    workload: 'Continuous GPU compute',
    results: {
      maxTemp: 42,
      avgTemp: 39,
      efficiency: 95.5,
      quietness: 18
    }
  }
]

// ============================================================================
// PERFORMANCE METRICS COMPONENT
// ============================================================================

export const PerformanceMetrics: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [animatedMetrics, setAnimatedMetrics] = useState<boolean>(false)
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(TEST_SCENARIOS[0])

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedMetrics(true), 500)
    return () => clearTimeout(timer)
  }, [])


  const categories = ['all', 'temperature', 'efficiency', 'environmental', 'performance']

  const filteredMetrics = selectedCategory === 'all'
    ? PERFORMANCE_METRICS
    : PERFORMANCE_METRICS.filter(m => m.category === selectedCategory)

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'temperature': return 'text-danger-600 bg-danger-100'
      case 'efficiency': return 'text-success-600 bg-success-100'
      case 'environmental': return 'text-success-600 bg-success-100'
      case 'performance': return 'text-primary-600 bg-primary-100'
      default: return 'text-secondary-600 bg-secondary-100'
    }
  }

  const getImprovementPercentage = (current: number, baseline: number, trend: string): number => {
    if (trend === 'down') {
      return Math.round(((baseline - current) / baseline) * 100)
    } else {
      return Math.round(((current - baseline) / baseline) * 100)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-success-600" />
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-success-600" />
      default:
        return <div className="w-4 h-4 bg-secondary-300 rounded-full" />
    }
  }

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <ChartBarIcon className="w-8 h-8 text-primary-600" />
          <h2 id="performance-heading" className="text-3xl font-bold text-secondary-900">
            Performance Validation
          </h2>
        </div>
        <p className="text-lg text-secondary-600 max-w-3xl mx-auto">
          Real-world testing data demonstrates the superior thermal performance and environmental benefits
          of two-phase cooling technology across demanding computational workloads.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex justify-center">
        <div className="flex rounded-equipment border border-secondary-300 overflow-hidden bg-white shadow-sm">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`filter-button px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'filter-button--active'
                  : 'filter-button--inactive'
              }`}
            >
              {category === 'all' ? 'All Metrics' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMetrics.map((metric, index) => {
          const improvement = getImprovementPercentage(metric.current, metric.baseline, metric.trend)

          return (
            <div
              key={metric.metric}
              className="card-cooling p-6 hover-lift"
              style={{
                animationDelay: animatedMetrics ? `${index * 100}ms` : '0ms',
                opacity: animatedMetrics ? 1 : 0,
                transform: animatedMetrics ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.6s ease-out'
              }}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(metric.category)}`}>
                      {metric.category.charAt(0).toUpperCase() + metric.category.slice(1)}
                    </div>
                    <h3 className="font-semibold text-secondary-900 text-sm">
                      {metric.metric}
                    </h3>
                  </div>
                  {getTrendIcon(metric.trend)}
                </div>

                {/* Main Value */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary-600">
                      {metric.current}
                    </span>
                    <span className="text-sm text-secondary-600">
                      {metric.unit}
                    </span>
                  </div>

                  <div className="text-xs text-secondary-500">
                    vs {metric.baseline}{metric.unit} baseline
                  </div>
                </div>

                {/* Improvement Badge */}
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-success-600" />
                  <span className="text-sm font-medium text-success-600">
                    {improvement}% improvement
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-secondary-600 leading-relaxed">
                  {metric.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Test Scenarios Section */}
      <div className="bg-secondary-50 rounded-equipment p-8">
        <h3 className="text-2xl font-bold text-secondary-900 text-center mb-8">
          Real-World Test Scenarios
        </h3>

        {/* Scenario Selector */}
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
            {TEST_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`p-4 rounded-equipment text-left transition-all ${
                  selectedScenario.id === scenario.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white text-secondary-900 hover:bg-primary-50 border border-secondary-200'
                }`}
              >
                <div className="space-y-2">
                  <h4 className="font-semibold">{scenario.name}</h4>
                  <p className={`text-sm ${
                    selectedScenario.id === scenario.id ? 'text-primary-100' : 'text-secondary-600'
                  }`}>
                    {scenario.workload}
                  </p>
                  <div className={`flex items-center gap-1 text-xs ${
                    selectedScenario.id === scenario.id ? 'text-primary-100' : 'text-secondary-600'
                  }`}>
                    <ClockIcon className="w-3 h-3" />
                    <span>{scenario.duration}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Scenario Details */}
        <div className="bg-white rounded-equipment p-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Scenario Info */}
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-secondary-900">
                {selectedScenario.name}
              </h4>
              <p className="text-secondary-600">
                {selectedScenario.description}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-secondary-700">Duration</div>
                  <div className="text-lg font-semibold text-primary-600">{selectedScenario.duration}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-secondary-700">Workload</div>
                  <div className="text-sm text-secondary-600">{selectedScenario.workload}</div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <h5 className="font-semibold text-secondary-900">Test Results</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BeakerIcon className="w-4 h-4 text-danger-600" />
                    <span className="text-sm font-medium text-secondary-700">Max Temperature</span>
                  </div>
                  <div className="text-lg font-bold text-danger-600">
                    {selectedScenario.results.maxTemp}°C
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BeakerIcon className="w-4 h-4 text-accent-600" />
                    <span className="text-sm font-medium text-secondary-700">Avg Temperature</span>
                  </div>
                  <div className="text-lg font-bold text-accent-600">
                    {selectedScenario.results.avgTemp}°C
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BeakerIcon className="w-4 h-4 text-success-600" />
                    <span className="text-sm font-medium text-secondary-700">Efficiency</span>
                  </div>
                  <div className="text-lg font-bold text-success-600">
                    {selectedScenario.results.efficiency}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary-600 rounded-full" />
                    <span className="text-sm font-medium text-secondary-700">Quietness</span>
                  </div>
                  <div className="text-lg font-bold text-primary-600">
                    {selectedScenario.results.quietness} dB
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Achievements */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-equipment p-8 text-white">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold">Key Performance Achievements</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-3xl font-bold">47%</div>
              <div className="text-primary-100 text-sm">Lower Peak Temperatures</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">33%</div>
              <div className="text-primary-100 text-sm">Higher Thermal Efficiency</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">60%</div>
              <div className="text-primary-100 text-sm">Quieter Operation</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">98.6%</div>
              <div className="text-primary-100 text-sm">Lower Environmental Impact</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}