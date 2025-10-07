'use client'

import React from 'react'
import Image from 'next/image'
import styles from './HeroSection.module.css'

export const HeroSection: React.FC = () => {
  return (
    <div className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Text */}
          <div className={styles.textSection}>
            <h1 className={styles.title}>2-Phase</h1>
            <p className={styles.subtitle}>PC Cooling</p>
          </div>

          {/* Visual */}
          <div className={styles.visualSection}>
            <div className={styles.imageContainer}>
              <Image
                src='/images/hero-product.jpg'
                alt='Two-Phase Cooling Computer Case'
                className={styles.heroImage}
                width={600}
                height={400}
                priority={true}
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
