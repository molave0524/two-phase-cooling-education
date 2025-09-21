'use client'

import React from 'react'
import Link from 'next/link'
import { PlayCircleIcon, SparklesIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/24/solid'

export const HeroSection: React.FC = () => {
  return (
    <div className="container-max section-padding" style={{ background: 'transparent' }}>
      <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen-80">
        {/* Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary-600 font-medium">
              <BeakerIcon className="w-5 h-5" />
              <span>Revolutionary Cooling Technology</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-secondary-900 leading-tight">
              Experience the{' '}
              <span className="text-gradient-primary">Future</span> of{' '}
              <span className="text-gradient-primary">Computer Cooling</span>
            </h1>

            <p className="text-xl text-secondary-600 leading-relaxed">
              Discover two-phase cooling technology through interactive demonstrations.
              Learn how superior thermal performance meets environmental responsibility
              in our transparent, visually stunning computer cases.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="#demonstrations" className="btn-primary btn-lg flex items-center gap-2">
              <PlayCircleIcon className="w-5 h-5" />
              Watch Demonstrations
            </Link>
            <Link href="#technology" className="btn-secondary btn-lg flex items-center gap-2">
              Learn More
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-secondary-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">GWP 20</div>
              <div className="text-sm text-secondary-600">Minimal Environmental Impact</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">0 ODP</div>
              <div className="text-sm text-secondary-600">Zero Ozone Depletion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">Superior</div>
              <div className="text-sm text-secondary-600">Thermal Performance</div>
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className="relative">
          <div className="aspect-square bg-gradient-to-br from-primary-500 to-primary-700 rounded-equipment relative overflow-hidden">
            <div className="absolute inset-4 bg-white/10 rounded-equipment backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <SparklesIcon className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                  <div className="text-xl font-semibold">Two-Phase Cooling</div>
                  <div className="text-white/80">Interactive Demo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}