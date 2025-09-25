'use client'

import React from 'react'

export const HeroSection: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#000000',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        paddingBottom: '40px',
        marginBottom: '-100px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className='container-max'>
        <div className='flex flex-col items-center justify-center pt-4 lg:pt-2'>
          {/* Text */}
          <div className='text-center mb-4'>
            <h1
              className='text-5xl sm:text-6xl lg:text-7xl font-bold text-white'
              style={{ marginBottom: '0px' }}
            >
              Two Phase Cooling
            </h1>
            <p
              className='text-3xl sm:text-4xl text-white'
              style={{ marginTop: '8px', marginBottom: '-16px' }}
            >
              Blah blah.
            </p>
          </div>

          {/* Visual */}
          <div className='relative w-full max-w-lg lg:max-w-2xl mx-auto'>
            <div className='relative overflow-hidden rounded-equipment'>
              <img
                src='/images/hero-product.jpg'
                alt='Two-Phase Cooling Computer Case'
                className='w-full h-auto object-cover'
                style={{ maxHeight: '600px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
