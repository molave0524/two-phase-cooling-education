'use client'

import React, { useState } from 'react'
import { ProductImage } from '@/types/product'
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface ProductImageGalleryProps {
  images: ProductImage[]
  productName: string
}

export default function ProductImageGallery({ images }: Pick<ProductImageGalleryProps, 'images'>) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const selectedImage = images[selectedImageIndex]

  if (!selectedImage) {
    return <div>No images available</div>
  }

  const goToPrevious = () => {
    setSelectedImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  if (!images.length) {
    return (
      <div className='aspect-square bg-secondary-200 rounded-equipment flex items-center justify-center'>
        <span className='text-secondary-500'>No image available</span>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Main Image Display */}
      <div className='relative aspect-square bg-secondary-50 rounded-equipment overflow-hidden group'>
        <img
          src={selectedImage.url}
          alt={selectedImage.altText}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={toggleZoom}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200'
              aria-label='Previous image'
            >
              <ChevronLeftIcon className='w-5 h-5 text-secondary-600' />
            </button>
            <button
              onClick={goToNext}
              className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200'
              aria-label='Next image'
            >
              <ChevronRightIcon className='w-5 h-5 text-secondary-600' />
            </button>
          </>
        )}

        {/* Zoom Icon */}
        <div className='absolute top-4 right-4 bg-white/80 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
          <MagnifyingGlassIcon className='w-5 h-5 text-secondary-600' />
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className='absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm'>
            {selectedImageIndex + 1} / {images.length}
          </div>
        )}

        {/* Image Caption */}
        {selectedImage.caption && (
          <div className='absolute bottom-4 left-4 bg-black/60 text-white px-3 py-2 rounded-lg text-sm max-w-xs'>
            {selectedImage.caption}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className='grid grid-cols-4 gap-2'>
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleThumbnailClick(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === selectedImageIndex
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
            >
              <img src={image.url} alt={image.altText} className='w-full h-full object-cover' />
            </button>
          ))}
        </div>
      )}

      {/* Image Types Legend */}
      <div className='flex flex-wrap gap-2'>
        {Array.from(new Set(images.map(img => img.type))).map(type => (
          <span
            key={type}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              type === 'main'
                ? 'bg-primary-100 text-primary-800'
                : type === 'technical'
                  ? 'bg-accent-100 text-accent-800'
                  : 'bg-secondary-100 text-secondary-800'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} View
          </span>
        ))}
      </div>
    </div>
  )
}
