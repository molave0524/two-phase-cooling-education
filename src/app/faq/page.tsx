import { Metadata } from 'next'
import { FAQ_CONTENT } from '@/data/faq-content'
import { FAQSection } from '@/components/sections/FAQSection'

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
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <section className='py-20 lg:py-32 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50'>
        <div className='container-max section-padding'>
          <div className='text-center space-y-6 max-w-4xl mx-auto'>
            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900'>
              Frequently Asked Questions
            </h1>
            <p className='text-xl text-secondary-700'>
              Get answers to common questions about two-phase cooling technology, performance
              benefits, and product specifications.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className='py-16 lg:py-24'>
        <div className='container-max section-padding'>
          <FAQSection />
        </div>
      </section>

      {/* Contact Section */}
      <section className='py-16 bg-secondary-50'>
        <div className='container-max section-padding'>
          <div className='text-center space-y-6 max-w-2xl mx-auto'>
            <h2 className='text-2xl font-bold text-secondary-900'>Still have questions?</h2>
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
