import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
// Toaster is now handled in Providers

// Optimized font loading for performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// SEO optimized metadata for Two-Phase Cooling Education Center
export const metadata: Metadata = {
  title: {
    default: 'Two-Phase Cooling Education Center | Advanced Computer Case Technology',
    template: '%s | Two-Phase Cooling Education',
  },
  description: 'Discover the future of computer cooling with our innovative two-phase cooling case. Learn through interactive demonstrations how superior thermal performance revolutionizes high-performance computing.',
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
    'thermal management'
  ],
  authors: [{ name: 'Two-Phase Cooling Innovation Team' }],
  creator: 'Two-Phase Cooling Education Center',
  publisher: 'Two-Phase Cooling Technologies',

  // Open Graph for social media sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://twophasecooling.com',
    siteName: 'Two-Phase Cooling Education Center',
    title: 'Revolutionary Two-Phase Cooling Technology',
    description: 'Experience the future of computer cooling through interactive demonstrations and educational content.',
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
    creator: '@TwoPhaseCooling',
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
    'application-name': 'Two-Phase Cooling Education',
    'apple-mobile-web-app-title': 'Two-Phase Cooling',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0ea5e9',
    'msapplication-tap-highlight': 'no',
    'theme-color': '#0ea5e9',
  },

  // Verification codes for search engines
  verification: {
    google: process.env.GOOGLE_VERIFICATION_CODE,
    yandex: process.env.YANDEX_VERIFICATION_CODE,
    yahoo: process.env.YAHOO_VERIFICATION_CODE,
  },

  // Categories for app stores
  category: 'education',

  // App links for mobile
  appLinks: {
    web: {
      url: 'https://twophasecooling.com',
      should_fallback: true,
    },
  },

  // Alternate languages (future expansion)
  alternates: {
    canonical: 'https://twophasecooling.com',
    languages: {
      'en-US': 'https://twophasecooling.com',
      'en-CA': 'https://twophasecooling.com/ca',
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
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical resources for performance */}
        {/* Font loading handled by Next.js Google Fonts */}

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//cdn.example.com" />
        <link rel="dns-prefetch" href="//analytics.google.com" />

        {/* Critical CSS moved to globals.css */}
        {/* Force styles to ensure section visibility */}
        <link rel="stylesheet" href="/force-styles.css" />

        {/* Favicon and app icons - disabled for demo */}
        {/* <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" /> */}
        {/* Manifest disabled for demo */}

        {/* Security headers - X-Frame-Options must be set via server headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Performance hints */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#0ea5e9" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#075985" media="(prefers-color-scheme: dark)" />

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
          {/* Site header with navigation */}
          <Header />

          {/* Main content area */}
          <main
            id="main-content"
            className="flex-1 min-h-0"
            role="main"
          >
            {children}
          </main>

          {/* Site footer */}
          <Footer />

          {/* Toast notifications handled in Providers */}
        </Providers>

        {/* Development-only performance monitoring */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Development performance monitoring
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const paintTimings = performance.getEntriesByType('paint');
                    const fcp = paintTimings.find(entry => entry.name === 'first-contentful-paint');
                    const lcp = paintTimings.find(entry => entry.name === 'largest-contentful-paint');

                    console.group('🎯 Performance Metrics');
                    console.log('First Contentful Paint:', fcp ? fcp.startTime.toFixed(2) + 'ms' : 'Not available');
                    console.log('Largest Contentful Paint:', lcp ? lcp.startTime.toFixed(2) + 'ms' : 'Not available');
                    console.log('DOM Content Loaded:', (performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart) + 'ms');
                    console.log('Page Load Complete:', (performance.timing.loadEventEnd - performance.timing.navigationStart) + 'ms');
                    console.groupEnd();
                  }, 1000);
                });
              `,
            }}
          />
        )}

        {/* Service Worker disabled for demo */}
      </body>
    </html>
  )
}