import { COMPANY_INFO, SOCIAL_MEDIA } from '@/constants'

interface ProductStructuredDataProps {
  product: {
    name: string
    description: string
    price: number
    currency: string
    images: Array<{ url: string; alt: string }>
    sku: string
    inStock: boolean
    categories: string[]
  }
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => img.url),
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: COMPANY_INFO.NAME,
    },
    offers: {
      '@type': 'Offer',
      url: `https://${COMPANY_INFO.DOMAIN}/products/${product.sku}`,
      priceCurrency: product.currency,
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: COMPANY_INFO.NAME,
      },
    },
    category: product.categories.join(', '),
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY_INFO.NAME,
    url: `https://${COMPANY_INFO.DOMAIN}`,
    logo: `https://${COMPANY_INFO.DOMAIN}/images/logo.png`,
    sameAs: [SOCIAL_MEDIA.TWITTER || '', SOCIAL_MEDIA.YOUTUBE || ''].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      email: COMPANY_INFO.EMAIL,
      contactType: 'Customer Support',
    },
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function WebsiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: COMPANY_INFO.NAME,
    url: `https://${COMPANY_INFO.DOMAIN}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://${COMPANY_INFO.DOMAIN}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
