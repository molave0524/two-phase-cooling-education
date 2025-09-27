'use client'

import React from 'react'
import { BeakerIcon, FireIcon, ShieldCheckIcon, CogIcon } from '@heroicons/react/24/outline'
import styles from './TechnologyOverview.module.css'

export const TechnologyOverview: React.FC = () => {
  const features = [
    {
      icon: <BeakerIcon />,
      title: 'Two-Phase Cooling Science',
      description:
        'Utilizes the superior heat transfer properties of phase change, moving from liquid to vapor and back to liquid for maximum thermal efficiency.',
      highlight: 'Superior thermal performance',
    },
    {
      icon: <BeakerIcon />,
      title: 'Environmental Responsibility',
      description:
        'Our cooling fluid has a GWP rating of 20 (equivalent to gasoline) and zero ODP, making it an environmentally conscious choice.',
      highlight: 'GWP 20, Zero ODP',
    },
    {
      icon: <FireIcon />,
      title: 'Extreme Performance',
      description:
        'Handles the most demanding workloads, keeping high-performance CPUs and GPUs at optimal temperatures under sustained loads.',
      highlight: 'Extreme cooling capacity',
    },
    {
      icon: <ShieldCheckIcon />,
      title: 'Safe & Reliable',
      description:
        'Engineered with multiple safety systems and transparent design for visual monitoring. Non-toxic and safe for home use.',
      highlight: 'Multiple safety systems',
    },
  ]

  return (
    <div className={styles.technologySection}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <CogIcon className={styles.titleIcon} />
            <h2 id='technology-heading' className={styles.title}>
              Technology
            </h2>
          </div>
        </div>

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureContent}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <div className={styles.featureDetails}>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                  <div className={styles.featureHighlight}>{feature.highlight}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Section */}
        <div className={styles.comparisonSection}>
          <h3 className={styles.comparisonTitle}>Performance Comparison</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.comparisonTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellLeft}`}>
                    Feature
                  </th>
                  <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}>
                    Air Cooling
                  </th>
                  <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellCenter}`}>
                    Liquid Cooling
                  </th>
                  <th className={`${styles.tableHeaderCell} ${styles.tableHeaderCellPrimary}`}>
                    Two-Phase Cooling
                  </th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                <tr className={styles.tableRow}>
                  <td className={`${styles.tableCell} ${styles.tableCellLeft}`}>
                    Thermal Performance
                  </td>
                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>Good</td>
                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>Better</td>
                  <td className={`${styles.tableCell} ${styles.tableCellPrimary}`}>Superior</td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={`${styles.tableCell} ${styles.tableCellLeft}`}>Noise Level</td>
                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>High</td>
                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>Medium</td>
                  <td className={`${styles.tableCell} ${styles.tableCellPrimary}`}>
                    Whisper Quiet
                  </td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={`${styles.tableCell} ${styles.tableCellLeft}`}>Maintenance</td>
                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                    Regular cleaning
                  </td>
                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                    Pump maintenance
                  </td>
                  <td className={`${styles.tableCell} ${styles.tableCellPrimary}`}>Minimal</td>
                </tr>
                <tr className={styles.tableRow}>
                  <td className={`${styles.tableCell} ${styles.tableCellLeft}`}>
                    Environmental Impact
                  </td>
                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>Low</td>
                  <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>Medium</td>
                  <td className={`${styles.tableCell} ${styles.tableCellPrimary}`}>
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
