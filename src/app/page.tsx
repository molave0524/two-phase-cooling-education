import { Metadata } from 'next'
import { HeroSection } from '@/components/sections/HeroSection'
import { TechnologyOverview } from '@/components/sections/TechnologyOverview'
import { VideoShowcase } from '@/components/sections/VideoShowcase'
import { ProductShowcase } from '@/components/sections/ProductShowcase'
import { CallToAction } from '@/components/sections/CallToAction'
import { AIAssistantPreview } from '@/components/sections/AIAssistantPreview'

// Page metadata for SEO optimization
export const metadata: Metadata = {
  title: 'Revolutionary Two-Phase Cooling Technology | Education Center',
  description:
    'Experience the future of computer cooling through interactive demos. Learn how our innovative two-phase cooling case achieves superior thermal performance with minimal environmental impact.',
  keywords: [
    'two-phase cooling',
    'computer case',
    'thermal performance',
    'cooling technology',
    'education',
    'interactive demos',
    'thermal dynamics',
    'high-performance computing',
  ],
  openGraph: {
    title: 'Revolutionary Two-Phase Cooling Technology',
    description: 'Experience the future of computer cooling through interactive demos.',
    images: [
      {
        url: '/images/hero-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Two-Phase Cooling Case demonstrating superior thermal performance',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revolutionary Two-Phase Cooling Technology',
    description: 'Experience the future of computer cooling through interactive demos.',
    images: ['/images/hero-twitter.jpg'],
  },
}

/**
 * Home Page Component
 *
 * The main landing page implementing the "experience over selling" philosophy.
 * Structured to guide visitors through progressive discovery of two-phase cooling
 * technology through interactive demos and educational content.
 *
 * Section Flow:
 * 1. Hero - Immediate visual impact and value proposition
 * 2. Video Showcase - Core demo content
 * 3. Technology Overview - Educational foundation
 * 4. AI Assistant Preview - Interactive learning
 * 5. Product Showcase - Natural transition to purchase
 * 6. Call to Action - Clear next steps
 */
export default function HomePage() {
  return (
    <div className='min-h-screen'>
      {/* Hero Section - Immediate Impact */}
      <section id='hero' className='relative pt-32 lg:pt-40' aria-labelledby='hero-heading'>
        <HeroSection />
      </section>

      {/* Video Showcase - Immediate Videos */}
      <section id='videos' aria-labelledby='videos-heading'>
        <VideoShowcase />
      </section>

      {/* Technology Overview - Educational Foundation */}
      <section id='technology' aria-labelledby='technology-heading'>
        <TechnologyOverview />
      </section>

      {/* AI Assistant Preview - Interactive Learning */}
      {/* <AIAssistantPreview /> */}

      {/* Product Showcase - Natural Purchase Transition */}
      <section id='product' aria-labelledby='product-heading'>
        <ProductShowcase />
      </section>

      {/* Call to Action - Clear Next Steps */}
      <section
        id='get-started'
        className='py-section-bottom bg-gradient-to-br from-sky-600 to-sky-800 text-white'
        aria-labelledby='cta-heading'
      >
        <div className='container-max section-padding'>
          <CallToAction />
        </div>
      </section>

      {/* Schema.org structured data for rich search results */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            name: 'Two-Phase Cooling Education Center',
            description:
              'Learn about revolutionary two-phase cooling technology through interactive demos and educational content.',
            url: 'https://twophasecooling.com',
            logo: 'https://twophasecooling.com/images/logo.png',
            image: 'https://twophasecooling.com/images/hero-og.jpg',
            telephone: '+1-555-COOLING',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'US',
              addressRegion: 'USA',
            },
            sameAs: [
              'https://youtube.com/@twophasecooling',
              'https://twitter.com/twophasecooling',
              'https://linkedin.com/company/twophasecooling',
            ],
            offers: {
              '@type': 'Product',
              name: 'Two-Phase Cooling Case',
              description: 'Revolutionary computer case with integrated two-phase cooling system',
              category: 'Computer Hardware',
              brand: {
                '@type': 'Brand',
                name: 'Two-Phase Cooling Technologies',
              },
              offers: {
                '@type': 'Offer',
                price: '899.00',
                priceCurrency: 'USD',
                availability: 'https://schema.org/PreOrder',
                url: 'https://twophasecooling.com/products',
              },
            },
            educationalCredentialAwarded: 'Certificate of Completion',
            teaches: [
              'Two-Phase Cooling Principles',
              'Thermal Dynamics',
              'Heat Transfer Optimization',
              'Environmental Impact Assessment',
              'Performance Measurement',
            ],
          }),
        }}
      />

      {/* Additional structured data for the main product */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Two-Phase Cooling Computer Case',
            description:
              'Revolutionary computer case featuring integrated two-phase cooling system with superior thermal performance and minimal environmental impact.',
            brand: {
              '@type': 'Brand',
              name: 'Two-Phase Cooling Technologies',
            },
            category: 'Computer Cases',
            image: [
              'https://twophasecooling.com/images/product-main.jpg',
              'https://twophasecooling.com/images/product-side.jpg',
              'https://twophasecooling.com/images/product-internal.jpg',
            ],
            offers: {
              '@type': 'Offer',
              price: '899.00',
              priceCurrency: 'USD',
              availability: 'https://schema.org/PreOrder',
              url: 'https://twophasecooling.com/products',
              seller: {
                '@type': 'Organization',
                name: 'Two-Phase Cooling Technologies',
              },
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              bestRating: '5',
              worstRating: '1',
              ratingCount: '127',
            },
            review: [
              {
                '@type': 'Review',
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: '5',
                  bestRating: '5',
                },
                author: {
                  '@type': 'Person',
                  name: 'Tech Enthusiast',
                },
                reviewBody:
                  'Revolutionary cooling performance. Maintains optimal temperatures even under extreme loads.',
              },
            ],
            additionalProperty: [
              {
                '@type': 'PropertyValue',
                name: 'Cooling Type',
                value: 'Two-Phase Immersion',
              },
              {
                '@type': 'PropertyValue',
                name: 'GWP Rating',
                value: '20 (equivalent to gasoline)',
              },
              {
                '@type': 'PropertyValue',
                name: 'ODP Rating',
                value: '0 (zero ozone depletion)',
              },
              {
                '@type': 'PropertyValue',
                name: 'Form Factor',
                value: 'Mid-Tower ATX',
              },
              {
                '@type': 'PropertyValue',
                name: 'Materials',
                value: 'Tempered Glass, Aluminum',
              },
            ],
          }),
        }}
      />
    </div>
  )
}
