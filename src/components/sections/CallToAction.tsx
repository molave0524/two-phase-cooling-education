'use client'

import React, { useState } from 'react'
import { toast } from 'react-hot-toast'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface NewsletterFormData {
  email: string
  interests: string[]
  role: string
}

// ============================================================================
// CTA OPTIONS DATA (removed unused data)
// ============================================================================

// ============================================================================
// CALL TO ACTION COMPONENT
// ============================================================================

export const CallToAction: React.FC = () => {
  const [newsletterData, setNewsletterData] = useState<NewsletterFormData>({
    email: '',
    interests: [],
    role: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewsletterForm, setShowNewsletterForm] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In production, make actual API call
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsletterData),
      })

      if (!response.ok) {
        throw new Error('Subscription failed')
      }

      toast.success('Successfully subscribed! Welcome to the thermal revolution.')
      setNewsletterData({ email: '', interests: [], role: '' })
      setShowNewsletterForm(false)
    } catch (error) {
      toast.error('Subscription failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInterestToggle = (interest: string) => {
    setNewsletterData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  // const getVariantClasses = (variant: string): string => {
  //   switch (variant) {
  //     case 'primary':
  //       return 'from-primary-500 to-primary-700 text-white'
  //     case 'secondary':
  //       return 'from-secondary-100 to-secondary-200 text-secondary-900 border border-secondary-300'
  //     case 'accent':
  //       return 'from-accent-500 to-accent-700 text-white'
  //     default:
  //       return 'from-primary-500 to-primary-700 text-white'
  //   }
  // }

  // const selectedOption = CTA_OPTIONS.find(option => option.id === selectedCTA)

  return (
    <div className='space-y-16'>
      {/* Newsletter Signup */}
      <div className='bg-gradient-to-r from-primary-600 to-primary-800 rounded-equipment p-8 text-white'>
        <div className='max-w-3xl mx-auto text-center space-y-6'>
          <h3 className='text-2xl font-bold'>Stay Updated on Thermal Innovation</h3>
          <p className='text-primary-100'>
            Get the latest insights on two-phase cooling technology, performance benchmarks, and
            educational resources delivered to your inbox.
          </p>

          {!showNewsletterForm ? (
            <div className='space-y-4'>
              <button onClick={() => setShowNewsletterForm(true)} className='btn-secondary btn-lg'>
                Subscribe to Newsletter
              </button>
              <div className='flex items-center justify-center gap-6 text-sm text-primary-200'>
                <span>• Monthly updates</span>
                <span>• Expert insights</span>
                <span>• Early access</span>
                <span>• No spam</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className='space-y-4 max-w-md mx-auto'>
              <div className='space-y-3'>
                <input
                  type='email'
                  placeholder='Enter your email address'
                  value={newsletterData.email}
                  onChange={e => setNewsletterData(prev => ({ ...prev, email: e.target.value }))}
                  className='input w-full text-secondary-900'
                  required
                />

                <select
                  value={newsletterData.role}
                  onChange={e => setNewsletterData(prev => ({ ...prev, role: e.target.value }))}
                  className='input w-full text-secondary-900'
                  required
                >
                  <option value=''>Select your role</option>
                  <option value='enthusiast'>PC Enthusiast</option>
                  <option value='student'>Student</option>
                  <option value='educator'>Educator</option>
                  <option value='engineer'>Engineer</option>
                  <option value='other'>Other</option>
                </select>

                <div className='text-left'>
                  <label className='block text-sm font-medium text-primary-100 mb-2'>
                    Interests (select all that apply):
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    {[
                      'Performance Benchmarks',
                      'Educational Content',
                      'Product Updates',
                      'Technical Deep Dives',
                    ].map(interest => (
                      <label key={interest} className='flex items-center text-sm'>
                        <input
                          type='checkbox'
                          checked={newsletterData.interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                          className='rounded border-primary-300 text-primary-600 focus:ring-primary-500 mr-2'
                        />
                        <span className='text-primary-100'>{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className='flex gap-3'>
                <button type='submit' disabled={isSubmitting} className='btn-secondary flex-1'>
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowNewsletterForm(false)}
                  className='btn px-4 py-2 border border-primary-400 text-primary-100 rounded-technical hover:bg-primary-700 transition-colors'
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
