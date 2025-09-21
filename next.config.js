/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simplified configuration for demo deployment
  output: 'standalone',
  compress: true,
  poweredByHeader: false,

  // Basic image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Basic security headers
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;