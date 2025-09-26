'use client'

import React from 'react'
import { BeakerIcon, FireIcon, ShieldCheckIcon, CogIcon } from '@heroicons/react/24/outline'

export const TechnologyOverview: React.FC = () => {
  const features = [
    {
      icon: <BeakerIcon className='w-8 h-8' />,
      title: 'Two-Phase Cooling Science',
      description:
        'Utilizes the superior heat transfer properties of phase change, moving from liquid to vapor and back to liquid for maximum thermal efficiency.',
      highlight: 'Superior thermal performance',
    },
    {
      icon: <BeakerIcon className='w-8 h-8' />,
      title: 'Environmental Responsibility',
      description:
        'Our cooling fluid has a GWP rating of 20 (equivalent to gasoline) and zero ODP, making it an environmentally conscious choice.',
      highlight: 'GWP 20, Zero ODP',
    },
    {
      icon: <FireIcon className='w-8 h-8' />,
      title: 'Extreme Performance',
      description:
        'Handles the most demanding workloads, keeping high-performance CPUs and GPUs at optimal temperatures under sustained loads.',
      highlight: 'Extreme cooling capacity',
    },
    {
      icon: <ShieldCheckIcon className='w-8 h-8' />,
      title: 'Safe & Reliable',
      description:
        'Engineered with multiple safety systems and transparent design for visual monitoring. Non-toxic and safe for home use.',
      highlight: 'Multiple safety systems',
    },
  ]

  return (
    <div
      className='relative'
      style={{
        backgroundColor: 'var(--color-section-background)',
        paddingTop: '1.5rem',
        paddingBottom: '1rem',
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        borderTop: '12px solid white',
      }}
    >
      <div className='max-w-6xl mx-auto px-6'>
        {/* Section Header */}
        <div className='text-center space-y-4'>
          <div className='flex items-center justify-center gap-2'>
            <CogIcon className='w-8 h-8 text-primary-600' />
            <h2
              id='technology-heading'
              className='text-3xl font-bold text-black'
              style={{ margin: 0 }}
            >
              Technology
            </h2>
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid md:grid-cols-2 gap-3 mt-3'>
          {features.map((feature, index) => (
            <div key={index} className='card-cooling p-3 hover-lift'>
              <div className='flex items-start gap-2'>
                <div className='text-primary-600 flex-shrink-0'>{feature.icon}</div>
                <div className='space-y-1'>
                  <h3 className='text-xl font-semibold text-secondary-900'>{feature.title}</h3>
                  <p className='text-secondary-600 leading-relaxed'>{feature.description}</p>
                  <div className='text-sm font-medium text-primary-600'>{feature.highlight}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Section */}
        <div className='bg-secondary-50 rounded-equipment p-3 mt-3'>
          <h3 className='text-2xl font-bold text-secondary-900 text-center mb-3'>
            Performance Comparison
          </h3>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-secondary-200'>
                  <th className='text-left py-3 px-4 font-semibold text-secondary-900'>Feature</th>
                  <th className='text-center py-3 px-4 font-semibold text-secondary-600'>
                    Air Cooling
                  </th>
                  <th className='text-center py-3 px-4 font-semibold text-secondary-600'>
                    Liquid Cooling
                  </th>
                  <th className='text-center py-3 px-4 font-semibold text-primary-600'>
                    Two-Phase Cooling
                  </th>
                </tr>
              </thead>
              <tbody className='text-sm'>
                <tr className='border-b border-secondary-200'>
                  <td className='py-3 px-4 font-medium'>Thermal Performance</td>
                  <td className='py-3 px-4 text-center text-secondary-600'>Good</td>
                  <td className='py-3 px-4 text-center text-secondary-600'>Better</td>
                  <td className='py-3 px-4 text-center text-primary-600 font-semibold'>Superior</td>
                </tr>
                <tr className='border-b border-secondary-200'>
                  <td className='py-3 px-4 font-medium'>Noise Level</td>
                  <td className='py-3 px-4 text-center text-secondary-600'>High</td>
                  <td className='py-3 px-4 text-center text-secondary-600'>Medium</td>
                  <td className='py-3 px-4 text-center text-primary-600 font-semibold'>
                    Whisper Quiet
                  </td>
                </tr>
                <tr className='border-b border-secondary-200'>
                  <td className='py-3 px-4 font-medium'>Maintenance</td>
                  <td className='py-3 px-4 text-center text-secondary-600'>Regular cleaning</td>
                  <td className='py-3 px-4 text-center text-secondary-600'>Pump maintenance</td>
                  <td className='py-3 px-4 text-center text-primary-600 font-semibold'>Minimal</td>
                </tr>
                <tr>
                  <td className='py-3 px-4 font-medium'>Environmental Impact</td>
                  <td className='py-3 px-4 text-center text-secondary-600'>Low</td>
                  <td className='py-3 px-4 text-center text-secondary-600'>Medium</td>
                  <td className='py-3 px-4 text-center text-primary-600 font-semibold'>
                    Minimal (GWP 20)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
