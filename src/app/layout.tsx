import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from 'react-hot-toast'

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
  colorScheme: 'light dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
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
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//cdn.example.com" />
        <link rel="dns-prefetch" href="//analytics.google.com" />

        {/* Critical CSS for above-the-fold content */}
        <style jsx>{`
          /* Critical CSS to prevent layout shift */
          .hero-section {
            min-height: 100vh;
            background: linear-gradient(135deg, rgb(14 165 233 / 0.1) 0%, rgb(59 130 246 / 0.05) 100%);
          }

          /* Video player container sizing */
          .video-container {
            aspect-ratio: 16 / 9;
            background: rgb(15 23 42);
            border-radius: 0.75rem;
          }

          /* Loading states to prevent CLS */
          .loading-skeleton {
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }

          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Performance hints */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#0ea5e9" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#075985" media="(prefers-color-scheme: dark)" />
      </head>

      <body
        className={`
          font-sans antialiased
          bg-white text-secondary-900
          min-h-screen flex flex-col
          selection:bg-primary-200 selection:text-primary-900
        `}
        suppressHydrationWarning
      >
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                     bg-primary-600 text-white px-4 py-2 rounded-md z-50
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Skip to main content
        </a>

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

          {/* Global toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: '0.75rem',
                border: '1px solid #334155',
                fontSize: '0.875rem',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#f1f5f9',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f1f5f9',
                },
              },
            }}
          />
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

        {/* Service Worker registration for PWA capabilities */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('SW registered: ', registration);
                    }).catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}