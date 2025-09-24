import React from 'react'
import { COOLING_COMPARISON } from '@/data/products'
import { CheckCircleIcon, XCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline'

export default function ProductComparison() {
  const getAdvantageIcon = (advantage: string, currentColumn: string) => {
    if (
      advantage === currentColumn ||
      (advantage === 'two-phase' && currentColumn === 'twoPhaseCooling')
    ) {
      return <CheckCircleIcon className='w-5 h-5 text-success-500' />
    } else if (advantage === 'neutral') {
      return <MinusCircleIcon className='w-5 h-5 text-secondary-400' />
    } else {
      return <XCircleIcon className='w-5 h-5 text-danger-400' />
    }
  }

  return (
    <section>
      <div className='mb-8'>
        <h2 className='text-3xl font-bold text-secondary-900 mb-4'>
          Cooling Technology Comparison
        </h2>
        <p className='text-lg text-secondary-600'>
          See how two-phase cooling technology compares to traditional cooling solutions across key
          performance metrics.
        </p>
      </div>

      {/* Desktop Table View */}
      <div className='hidden lg:block overflow-hidden rounded-equipment border border-secondary-200'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-secondary-200'>
              <th className='px-6 py-4 text-left font-semibold text-secondary-900 bg-white'>
                Feature
              </th>
              <th className='px-6 py-4 text-center font-semibold bg-primary-50 text-primary-900 border-x border-primary-200'>
                Two-Phase Cooling
                <div className='mt-1 px-2 py-1 bg-primary-600 text-white text-xs rounded-full inline-block'>
                  RECOMMENDED
                </div>
              </th>
              <th className='px-6 py-4 text-center font-semibold bg-secondary-50 text-secondary-900'>
                Traditional Air Cooling
              </th>
              <th className='px-6 py-4 text-center font-semibold bg-accent-50 text-accent-900 border-l border-accent-200'>
                Traditional Liquid Cooling
              </th>
            </tr>
          </thead>
          <tbody>
            {COOLING_COMPARISON.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-secondary-100 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-secondary-25'
                }`}
              >
                <td className='px-6 py-4 font-medium text-secondary-900'>{row.feature}</td>
                <td className='px-6 py-4 text-center bg-primary-25'>
                  <div className='flex items-center justify-center gap-2'>
                    {getAdvantageIcon(row.advantage, 'twoPhaseCooling')}
                    <span className='text-sm text-primary-900 font-medium'>
                      {row.twoPhaseCooling}
                    </span>
                  </div>
                </td>
                <td className='px-6 py-4 text-center'>
                  <div className='flex items-center justify-center gap-2'>
                    {getAdvantageIcon(row.advantage, 'air')}
                    <span className='text-sm text-secondary-700'>{row.traditionalAir}</span>
                  </div>
                </td>
                <td className='px-6 py-4 text-center bg-accent-25'>
                  <div className='flex items-center justify-center gap-2'>
                    {getAdvantageIcon(row.advantage, 'liquid')}
                    <span className='text-sm text-accent-900'>{row.traditionalLiquid}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className='lg:hidden space-y-6'>
        {COOLING_COMPARISON.map((row, index) => (
          <div
            key={index}
            className='bg-white rounded-equipment border border-secondary-200 overflow-hidden'
          >
            <div className='bg-secondary-50 px-4 py-3 border-b border-secondary-200'>
              <h3 className='font-semibold text-secondary-900'>{row.feature}</h3>
            </div>

            <div className='p-4 space-y-4'>
              {/* Two-Phase Cooling */}
              <div className='flex items-start gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200'>
                <div className='flex-shrink-0'>
                  {getAdvantageIcon(row.advantage, 'twoPhaseCooling')}
                </div>
                <div>
                  <div className='font-medium text-primary-900 mb-1'>
                    Two-Phase Cooling
                    {row.advantage === 'two-phase' && (
                      <span className='ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full'>
                        BEST
                      </span>
                    )}
                  </div>
                  <div className='text-sm text-primary-800'>{row.twoPhaseCooling}</div>
                </div>
              </div>

              {/* Traditional Air */}
              <div className='flex items-start gap-3 p-3 bg-secondary-50 rounded-lg'>
                <div className='flex-shrink-0'>{getAdvantageIcon(row.advantage, 'air')}</div>
                <div>
                  <div className='font-medium text-secondary-900 mb-1'>
                    Traditional Air Cooling
                    {row.advantage === 'air' && (
                      <span className='ml-2 px-2 py-0.5 bg-secondary-600 text-white text-xs rounded-full'>
                        BEST
                      </span>
                    )}
                  </div>
                  <div className='text-sm text-secondary-700'>{row.traditionalAir}</div>
                </div>
              </div>

              {/* Traditional Liquid */}
              <div className='flex items-start gap-3 p-3 bg-accent-50 rounded-lg border border-accent-200'>
                <div className='flex-shrink-0'>{getAdvantageIcon(row.advantage, 'liquid')}</div>
                <div>
                  <div className='font-medium text-accent-900 mb-1'>
                    Traditional Liquid Cooling
                    {row.advantage === 'liquid' && (
                      <span className='ml-2 px-2 py-0.5 bg-accent-600 text-white text-xs rounded-full'>
                        BEST
                      </span>
                    )}
                  </div>
                  <div className='text-sm text-accent-800'>{row.traditionalLiquid}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className='mt-8 p-6 bg-gradient-to-r from-primary-50 to-success-50 rounded-equipment border border-primary-200'>
        <h3 className='text-xl font-bold text-secondary-900 mb-3'>Why Choose Two-Phase Cooling?</h3>
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='flex items-center gap-2'>
            <CheckCircleIcon className='w-5 h-5 text-success-500 flex-shrink-0' />
            <span className='text-sm text-secondary-700'>Superior heat transfer efficiency</span>
          </div>
          <div className='flex items-center gap-2'>
            <CheckCircleIcon className='w-5 h-5 text-success-500 flex-shrink-0' />
            <span className='text-sm text-secondary-700'>Whisper-quiet operation</span>
          </div>
          <div className='flex items-center gap-2'>
            <CheckCircleIcon className='w-5 h-5 text-success-500 flex-shrink-0' />
            <span className='text-sm text-secondary-700'>Environmentally friendly</span>
          </div>
          <div className='flex items-center gap-2'>
            <CheckCircleIcon className='w-5 h-5 text-success-500 flex-shrink-0' />
            <span className='text-sm text-secondary-700'>Maintenance-free operation</span>
          </div>
        </div>
      </div>
    </section>
  )
}
