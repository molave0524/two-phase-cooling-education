import { Metadata } from 'next'
import { FAQ_CONTENT } from '@/data/faq-content'
import { FAQSection } from '@/components/sections/FAQSection'
import { COMPANY_INFO } from '@/constants'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import styles from './faq.module.css'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Two-Phase Cooling Technology',
  description:
    'Get answers to common questions about two-phase cooling technology, performance benefits, environmental impact, and product specifications.',
  keywords: [
    'two-phase cooling FAQ',
    'cooling technology questions',
    'thermal performance',
    'environmental impact',
    'product support',
  ],
  openGraph: {
    title: 'FAQ - Two-Phase Cooling Technology',
    description:
      'Get answers to common questions about revolutionary two-phase cooling technology.',
    type: 'website',
  },
}

/**
 * FAQ Page Component
 *
 * Dedicated page for frequently asked questions about two-phase cooling technology.
 * Organized into categories with search functionality and expandable sections.
 */
export default function FAQPage() {
  return (
    <div className={styles.faqPage}>
      {/* FAQ Content */}
      <section
        id='faq-content'
        aria-labelledby='faq-content-heading'
        className={styles.faqContentSection}
      >
        <div className={styles.faqContentContainer}>
          {/* Section Header */}
          <div className={styles.sectionHeader}>
            <div className={styles.titleWrapper}>
              <QuestionMarkCircleIcon className={styles.titleIcon} />
              <h2 id='faq-content-heading' className={styles.sectionTitle}>
                Frequently Asked Questions
              </h2>
            </div>
          </div>
          <FAQSection />
        </div>
      </section>

      {/* Contact Section */}
      <section
        id='contact-support'
        aria-labelledby='contact-heading'
        className={styles.contactSection}
      >
        <div className={styles.container}>
          <div className={styles.contactContent}>
            <h2 id='contact-heading' className={styles.contactTitle}>
              Still have questions?
            </h2>
            <p className={styles.contactDescription}>
              Can&apos;t find the answer you&apos;re looking for? Our technical team is here to help
              with any questions about two-phase cooling technology.
            </p>
            <div className={styles.contactActions}>
              <a href={`mailto:${COMPANY_INFO.EMAIL}`} className={styles.primaryButton}>
                Contact Technical Support
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Schema.org structured data for FAQ */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_CONTENT.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </div>
  )
}
