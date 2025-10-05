import { MetadataRoute } from 'next'
import { COMPANY_INFO } from '@/constants'
import { db, products } from '@/db'

const BASE_URL = `https://${COMPANY_INFO.DOMAIN}`

// Make this route dynamic so it doesn't fail during build
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all products from database
  let allProducts: any[] = []
  try {
    allProducts = await (db.select() as any).from(products)
  } catch (error) {
    // Database not available during build, skip product pages
    // eslint-disable-next-line no-console
    console.warn('Database not available for sitemap generation, using static pages only')
  }

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
  const productPages: MetadataRoute.Sitemap = allProducts.map((product: any) => ({
    url: `${BASE_URL}/products/${product.slug}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
}
