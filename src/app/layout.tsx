import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { FloatingAIButton } from '@/components/ai/FloatingAIButton'
import { COMPANY_INFO, SOCIAL_MEDIA } from '@/constants'

// Apple-style system font stack for optimal performance and Apple look
// Using system fonts to match Apple's approach

// SEO optimized metadata for Two-Phase Cooling Education Center
export const metadata: Metadata = {
  title: {
    default: `${COMPANY_INFO.NAME} | Advanced Computer Case Technology`,
    template: `%s | ${COMPANY_INFO.NAME}`,
  },
  description:
    'Discover the future of computer cooling with our innovative two-phase cooling case. Learn through interactive demonstrations how superior thermal performance revolutionizes high-performance computing.',
  keywords: [
    'two-phase cooling',
    'computer case',
    'thermal performance',
    'cooling technology',
    'high-performance computing',
    'thermal dynamics',
    'education center',
    'cooling system',
    'computer hardware',
    'thermal management',
  ],
  authors: [{ name: `${COMPANY_INFO.NAME} Innovation Team` }],
  creator: COMPANY_INFO.NAME,
  publisher: COMPANY_INFO.NAME,

  // Open Graph for social media sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `https://${COMPANY_INFO.DOMAIN}`,
    siteName: COMPANY_INFO.NAME,
    title: 'Revolutionary Two-Phase Cooling Technology',
    description:
      'Experience the future of computer cooling through interactive demonstrations and educational content.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Two-Phase Cooling Case in action showing superior thermal performance',
      },
    ],
  },

  // Twitter Card for social sharing
  twitter: {
    card: 'summary_large_image',
    title: 'Revolutionary Two-Phase Cooling Technology',
    description: 'Experience the future of computer cooling through interactive demonstrations.',
    images: ['/images/twitter-image.jpg'],
    creator: SOCIAL_MEDIA.TWITTER,
  },

  // Search engine optimization
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Structured data for rich snippets
  other: {
    'application-name': COMPANY_INFO.NAME,
    'apple-mobile-web-app-title': COMPANY_INFO.NAME,
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0ea5e9',
    'msapplication-tap-highlight': 'no',
    'theme-color': '#0ea5e9',
  },

  // Verification codes for search engines
  // Note: These are optional and should be added to .env if needed
  verification: {
    google: null,
    yandex: null,
    yahoo: null,
  },

  // Categories for app stores
  category: 'education',

  // App links for mobile
  appLinks: {
    web: {
      url: `https://${COMPANY_INFO.DOMAIN}`,
      should_fallback: true,
    },
  },

  // Alternate languages (future expansion)
  alternates: {
    canonical: `https://${COMPANY_INFO.DOMAIN}`,
    languages: {
      'en-US': `https://${COMPANY_INFO.DOMAIN}`,
      'en-CA': `https://${COMPANY_INFO.DOMAIN}/ca`,
    },
  },

  // Additional metadata
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
}

// Separate viewport export (Next.js 14+ requirement)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
}

// Root layout component with optimal performance and accessibility
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className='scroll-smooth' suppressHydrationWarning>
      <head>
        {/* Preload critical resources for performance */}
        {/* Font loading handled by Next.js Google Fonts */}

        {/* DNS prefetch for external resources */}
        <link rel='dns-prefetch' href='//cdn.example.com' />
        <link rel='dns-prefetch' href='//analytics.google.com' />

        {/* Critical CSS handled in globals.css */}

        {/* Favicon and app icons - disabled for demo */}
        {/* <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> */}
        {/* Manifest disabled for demo */}

        {/* Security headers - X-Frame-Options must be set via server headers */}
        <meta httpEquiv='X-Content-Type-Options' content='nosniff' />
        <meta httpEquiv='X-XSS-Protection' content='1; mode=block' />

        {/* Performance hints */}
        <meta name='format-detection' content='telephone=no' />
        <meta name='theme-color' content='#0ea5e9' media='(prefers-color-scheme: light)' />
        <meta name='theme-color' content='#075985' media='(prefers-color-scheme: dark)' />

        {/* Performance section styles moved to PerformanceMetrics.module.css */}
      </head>

      <body
        className={`
          font-sans antialiased
          text-secondary-900
          min-h-screen flex flex-col
          selection:bg-primary-200 selection:text-primary-900
        `}
        suppressHydrationWarning
      >
        {/* Skip link removed for cleaner UI */}

        {/* Application providers for state management and theming */}
        <Providers>
          <ErrorBoundary>
            {/* Site header with navigation */}
            <Header />

            {/* Main content area */}
            <main
              id='main-content'
              className='flex-1 min-h-0'
              role='main'
              style={{ marginTop: '60px' }}
            >
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>

            {/* Site footer */}
            <Footer />

            {/* Floating AI Assistant Button */}
            <FloatingAIButton />
          </ErrorBoundary>

          {/* Toast notifications handled in Providers */}
        </Providers>

        {/* Development-only performance monitoring - handled by browser DevTools */}

        {/* Service Worker disabled for demo */}
      </body>
    </html>
  )
}
