'use client'

import React from 'react'
import Link from 'next/link'
import { PlayCircleIcon, SparklesIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/24/solid'

export const HeroSection: React.FC = () => {
  return (
    <div className='container-max section-padding'>
      <div className='flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen pt-20 lg:pt-0'>
        {/* Content */}
        <div className='space-y-6 lg:space-y-8 order-2 lg:order-1'>
          <div className='space-y-4'>
            <div className='flex items-center gap-2 text-primary-600 font-medium'>
              <BeakerIcon className='w-5 h-5' />
              <span className='text-sm sm:text-base'>Revolutionary Cooling Technology</span>
            </div>

            <h1 className='text-3xl sm:text-4xl lg:text-6xl font-bold text-secondary-900 leading-tight'>
              Experience the <span className='text-gradient-primary'>Future</span> of{' '}
              <span className='text-gradient-primary'>Computer Cooling</span>
            </h1>

            <p className='text-lg sm:text-xl text-secondary-600 leading-relaxed'>
              Discover two-phase cooling technology through interactive demonstrations. Learn how
              superior thermal performance meets environmental responsibility in our transparent,
              visually stunning computer cases.
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-4'>
            <Link
              href='#demonstrations'
              className='btn-primary btn-lg flex items-center justify-center gap-2'
            >
              <PlayCircleIcon className='w-5 h-5' />
              Watch Demonstrations
            </Link>
            <Link
              href='#technology'
              className='btn-secondary btn-lg flex items-center justify-center gap-2'
            >
              Learn More
              <ArrowRightIcon className='w-4 h-4' />
            </Link>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 pt-6 lg:pt-8 border-t border-secondary-200'>
            <div className='text-center sm:text-left lg:text-center'>
              <div className='text-xl sm:text-2xl font-bold text-primary-600'>GWP 20</div>
              <div className='text-sm text-secondary-600'>Minimal Environmental Impact</div>
            </div>
            <div className='text-center sm:text-left lg:text-center'>
              <div className='text-xl sm:text-2xl font-bold text-primary-600'>0 ODP</div>
              <div className='text-sm text-secondary-600'>Zero Ozone Depletion</div>
            </div>
            <div className='text-center sm:text-left lg:text-center'>
              <div className='text-xl sm:text-2xl font-bold text-primary-600'>Superior</div>
              <div className='text-sm text-secondary-600'>Thermal Performance</div>
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className='relative order-1 lg:order-2 w-full max-w-sm lg:max-w-none mx-auto'>
          <div className='aspect-square bg-gradient-to-br from-primary-500 to-primary-700 rounded-equipment relative overflow-hidden'>
            <div className='absolute inset-4 bg-white/10 rounded-equipment backdrop-blur-sm border border-white/20'>
              <div className='flex items-center justify-center h-full'>
                <div className='text-center text-white'>
                  <SparklesIcon className='w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 animate-pulse' />
                  <div className='text-lg sm:text-xl font-semibold'>Two-Phase Cooling</div>
                  <div className='text-white/80 text-sm sm:text-base'>Interactive Demo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
