'use client'

import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import styles from './CallToAction.module.css'

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
    <div className={styles.ctaWrapper}>
      {/* Newsletter Signup */}
      <div className={styles.newsletterSection}>
        <div className={styles.newsletterContainer}>
          <h3 className={styles.newsletterTitle}>Stay Updated on Thermal Innovation</h3>
          <p className={styles.newsletterDescription}>
            Get the latest insights on two-phase cooling technology, performance benchmarks, and
            educational resources delivered to your inbox.
          </p>

          {!showNewsletterForm ? (
            <div className={styles.ctaButtons}>
              <button
                onClick={() => setShowNewsletterForm(true)}
                className={styles.subscribeButton}
              >
                Subscribe to Newsletter
              </button>
              <div className={styles.benefits}>
                <span>• Monthly updates</span>
                <span>• Expert insights</span>
                <span>• Early access</span>
                <span>• No spam</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
              <div className={styles.formFields}>
                <input
                  type='email'
                  placeholder='Enter your email address'
                  value={newsletterData.email}
                  onChange={e => setNewsletterData(prev => ({ ...prev, email: e.target.value }))}
                  className={styles.formInput}
                  required
                />

                <select
                  value={newsletterData.role}
                  onChange={e => setNewsletterData(prev => ({ ...prev, role: e.target.value }))}
                  className={styles.formSelect}
                  required
                >
                  <option value=''>Select your role</option>
                  <option value='enthusiast'>PC Enthusiast</option>
                  <option value='student'>Student</option>
                  <option value='educator'>Educator</option>
                  <option value='engineer'>Engineer</option>
                  <option value='other'>Other</option>
                </select>

                <div className={styles.interestsWrapper}>
                  <label className={styles.interestsLabel}>
                    Interests (select all that apply):
                  </label>
                  <div className={styles.interestsGrid}>
                    {[
                      'Performance Benchmarks',
                      'Educational Content',
                      'Product Updates',
                      'Technical Deep Dives',
                    ].map(interest => (
                      <label key={interest} className={styles.interestItem}>
                        <input
                          type='checkbox'
                          checked={newsletterData.interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                          className={styles.interestCheckbox}
                        />
                        <span className={styles.interestLabel}>{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type='submit' disabled={isSubmitting} className={styles.submitButton}>
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowNewsletterForm(false)}
                  className={styles.cancelButton}
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
