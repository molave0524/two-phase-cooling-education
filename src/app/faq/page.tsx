import { Metadata } from 'next'
import { FAQ_CONTENT } from '@/data/faq-content'
import { FAQSection } from '@/components/sections/FAQSection'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

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
    <div className='min-h-screen'>
      {/* Hero Section */}
      <div
        id='hero'
        className='relative pt-6 pb-12'
        aria-labelledby='hero-heading'
        style={{
          backgroundColor: '#e2e8f0',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      >
        <div className='max-w-6xl mx-auto px-6'>
          <div className='text-center space-y-6 max-w-4xl mx-auto'>
            <div className='flex items-center justify-center gap-2'>
              <QuestionMarkCircleIcon className='w-8 h-8 text-primary-600' />
              <h1
                id='hero-heading'
                className='section-title text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900'
              >
                FAQ
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <section
        id='faq-content'
        aria-labelledby='faq-content-heading'
        style={{
          backgroundColor: 'var(--color-section-background)',
          paddingTop: 'var(--spacing-section-top)',
          paddingBottom: 'var(--spacing-section-bottom)',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      >
        <div className='max-w-6xl mx-auto px-6'>
          <FAQSection />
        </div>
      </section>

      {/* Contact Section */}
      <section
        id='contact-support'
        aria-labelledby='contact-heading'
        style={{
          backgroundColor: 'var(--color-section-background)',
          paddingTop: 'var(--spacing-section-top)',
          paddingBottom: 'var(--spacing-section-bottom)',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          borderTop: 'var(--spacing-between-sections) solid white',
        }}
      >
        <div className='max-w-6xl mx-auto px-6'>
          <div className='text-center space-y-6 max-w-2xl mx-auto'>
            <h2
              id='contact-heading'
              className='section-title text-2xl font-bold text-secondary-900'
            >
              Still have questions?
            </h2>
            <p className='text-secondary-700'>
              Can&apos;t find the answer you&apos;re looking for? Our technical team is here to help
              with any questions about two-phase cooling technology.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <a href='#contact' className='btn-primary'>
                Contact Technical Support
              </a>
              <a href='#ai-assistant' className='btn-secondary'>
                Ask AI Assistant
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
