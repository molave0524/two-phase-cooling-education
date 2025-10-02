import { MetadataRoute } from 'next'
import { COMPANY_INFO } from '@/constants'

const BASE_URL = `https://${COMPANY_INFO.DOMAIN}`

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/checkout/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/checkout/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
