/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for optimal performance
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    optimizePackageImports: ['@heroicons/react'],
  },

  // Image optimization for product photos and thumbnails
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd*.cloudfront.net', // CloudFront CDN for images
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com', // S3 direct access for development
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers for production deployment
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Enable CORS for video streaming
        source: '/api/video/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Range, Content-Type',
          },
        ],
      },
    ];
  },

  // Optimize video streaming and static assets
  async rewrites() {
    return [
      {
        source: '/videos/:path*',
        destination: `${process.env.CDN_BASE_URL || 'https://cdn.example.com'}/videos/:path*`,
      },
    ];
  },

  // Webpack configuration for optimal bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Optimize for video.js and streaming libraries
    config.externals.push({
      'video.js': 'videojs',
    });

    // Handle CSS for video player components
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });

    return config;
  },

  // Environment variables for different deployment stages
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Output configuration for serverless deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Compression and optimization
  compress: true,
  poweredByHeader: false,

  // Redirects for SEO optimization
  async redirects() {
    return [
      {
        source: '/cooling-technology',
        destination: '/technology',
        permanent: true,
      },
      {
        source: '/products/case',
        destination: '/products',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;