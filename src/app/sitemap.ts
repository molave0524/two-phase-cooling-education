import { MetadataRoute } from 'next'
import { COMPANY_INFO } from '@/constants'
import { db, products } from '@/db'

const BASE_URL = `https://${COMPANY_INFO.DOMAIN}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all products from database
  const allProducts = await db.select().from(products)

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  // Dynamic product pages
  const productPages: MetadataRoute.Sitemap = allProducts.map(product => ({
    url: `${BASE_URL}/products/${product.slug}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
}
