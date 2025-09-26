'use client'

import React from 'react'
import styles from './HeroSection.module.css'

export const HeroSection: React.FC = () => {
  return (
    <div className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Text */}
          <div className={styles.textSection}>
            <h1 className={styles.title}>Two Phase Cooling</h1>
            <p className={styles.subtitle}>Blah blah.</p>
          </div>

          {/* Visual */}
          <div className={styles.visualSection}>
            <div className={styles.imageContainer}>
              <img
                src='/images/hero-product.jpg'
                alt='Two-Phase Cooling Computer Case'
                className={styles.heroImage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
