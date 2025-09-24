/**
 * Placeholder product data for Two-Phase Cooling Systems
 * This data will be replaced with database integration in future stories
 */

import { TwoPhaseCoolingProduct, ProductComparison } from '@/types/product'

// Main product data
export const PRODUCTS: TwoPhaseCoolingProduct[] = [
  {
    id: 'two-phase-cooling-case-v1',
    name: 'Two-Phase Cooling Case Pro',
    slug: 'two-phase-cooling-case-pro',
    sku: 'TPC-CASE-PRO-001',
    price: 1299.99,
    originalPrice: 1499.99,
    currency: 'USD',
    description:
      'Revolutionary two-phase cooling system featuring transparent design and superior thermal performance. This complete cooling case provides unmatched heat dissipation for high-performance computing workloads.',
    shortDescription:
      'Professional-grade two-phase cooling system with transparent design and exceptional thermal performance.',
    features: [
      'Advanced two-phase cooling technology',
      'Transparent tempered glass construction',
      'Novec 7000 cooling fluid (GWP: 4, ODP: 0)',
      'Universal CPU and GPU compatibility',
      'Whisper-quiet operation (<20 dBA)',
      'Real-time temperature monitoring',
      'Tool-free installation system',
      '5-year comprehensive warranty',
    ],
    inStock: true,
    stockQuantity: 25,
    estimatedShipping: '5-7 business days',

    specifications: {
      cooling: {
        capacity: '200W TDP (CPU) + 400W TDP (GPU)',
        efficiency: '97% heat transfer efficiency',
        operatingRange: {
          min: -10,
          max: 85,
          optimal: 65,
          unit: '°C',
        },
        fluidType: 'Novec 7000 (3M™)',
        fluidVolume: '750ml total system capacity',
      },

      compatibility: {
        cpuSockets: [
          'Intel LGA1700',
          'Intel LGA1200',
          'AMD AM4',
          'AMD AM5',
          'Intel LGA2066 (with adapter)',
        ],
        gpuSupport: [
          'RTX 4090 (Full support)',
          'RTX 4080 / 4070 Ti',
          'RTX 3090 Ti / 3080 Ti',
          'RX 7900 XTX / 7800 XT',
          'Custom GPU blocks available',
        ],
        caseCompatibility: 'Mid-tower minimum (450mm length required)',
        motherboardClearance: 'Supports ATX, mATX, ITX motherboards',
      },

      dimensions: {
        length: 420,
        width: 200,
        height: 480,
        weight: 15.5,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4, // Significantly lower than traditional refrigerants
        odp: 0, // Ozone-friendly
        recyclable: true,
        energyEfficiency: 'A++ Rating (30% less power consumption)',
      },

      performance: {
        noiseLevel: '<18 dBA at full load (whisper quiet)',
        pumpSpeed: '1800-3200 RPM variable (PWM controlled)',
        fanSpeed: '600-1800 RPM (temperature adaptive)',
        thermalResistance: '0.12 °C/W (CPU), 0.08 °C/W (GPU)',
      },

      materials: {
        caseConstruction: 'Premium tempered glass with aerospace-grade aluminum frame',
        tubingMaterial: 'PTFE-lined stainless steel with anti-kink design',
        pumpMaterial: 'Ceramic impeller with magnetic levitation drive',
      },

      warranty: {
        duration: '5 years comprehensive',
        coverage: 'Full replacement warranty including fluid and components',
        support: '24/7 technical support with remote diagnostics',
      },
    },

    images: [
      {
        id: 'main-1',
        url: 'https://picsum.photos/800/600?random=1',
        altText: 'Two-Phase Cooling Case Pro - Main View',
        caption: 'Elegant transparent design showcasing advanced cooling technology',
        type: 'main',
        order: 1,
      },
      {
        id: 'gallery-1',
        url: 'https://picsum.photos/800/600?random=2',
        altText: 'Two-Phase Cooling Case - Internal Components',
        caption: 'Internal view showing two-phase cooling loops and components',
        type: 'gallery',
        order: 2,
      },
      {
        id: 'gallery-2',
        url: 'https://picsum.photos/800/600?random=3',
        altText: 'Two-Phase Cooling Case - Side Profile',
        caption: 'Side profile highlighting compact and efficient design',
        type: 'gallery',
        order: 3,
      },
      {
        id: 'technical-1',
        url: 'https://picsum.photos/800/600?random=4',
        altText: 'Technical Diagram - Cooling Loop',
        caption: 'Technical schematic of two-phase cooling loop operation',
        type: 'technical',
        order: 4,
      },
      {
        id: 'gallery-3',
        url: 'https://picsum.photos/800/600?random=5',
        altText: 'Two-Phase Cooling Case - Rear Panel',
        caption: 'Rear panel view showing ports and ventilation design',
        type: 'gallery',
        order: 5,
      },
      {
        id: 'technical-2',
        url: 'https://picsum.photos/800/600?random=6',
        altText: 'Performance Chart - Temperature Analysis',
        caption: 'Performance comparison chart showing thermal efficiency',
        type: 'technical',
        order: 6,
      },
    ],

    categories: ['cooling-systems', 'complete-cases'],
    tags: ['two-phase', 'transparent', 'quiet', 'high-performance', 'eco-friendly'],

    metaTitle: 'Two-Phase Cooling Case Pro - Revolutionary PC Cooling System',
    metaDescription:
      'Experience next-generation PC cooling with our transparent two-phase cooling case. 97% efficiency, whisper-quiet operation, 5-year warranty.',

    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },

  {
    id: 'two-phase-cooling-case-compact',
    name: 'Two-Phase Cooling Case Compact',
    slug: 'two-phase-cooling-case-compact',
    sku: 'TPC-CASE-COMPACT-002',
    price: 899.99,
    currency: 'USD',
    description:
      'Compact two-phase cooling solution perfect for small form factor builds without compromising on cooling performance. Ideal for ITX and mATX systems.',
    shortDescription: 'Compact two-phase cooling system designed for small form factor builds.',
    features: [
      'Compact two-phase cooling design',
      'Small form factor compatibility',
      'Efficient heat dissipation',
      'Quiet operation (<22 dBA)',
      'Easy installation',
      '3-year warranty',
    ],
    inStock: true,
    stockQuantity: 15,
    estimatedShipping: '3-5 business days',

    specifications: {
      cooling: {
        capacity: '120W TDP (CPU) + 200W TDP (GPU)',
        efficiency: '92% heat transfer efficiency',
        operatingRange: {
          min: -5,
          max: 75,
          optimal: 60,
          unit: '°C',
        },
        fluidType: 'Novec 7000 (3M™)',
        fluidVolume: '350ml total system capacity',
      },

      compatibility: {
        cpuSockets: ['Intel LGA1700', 'Intel LGA1200', 'AMD AM4', 'AMD AM5'],
        gpuSupport: ['RTX 4070 / 4060 Ti', 'RTX 3070 Ti / 3060 Ti', 'RX 7700 XT / 7600 XT'],
        caseCompatibility: 'ITX and mATX cases (300mm minimum length)',
        motherboardClearance: 'Supports ITX, mATX motherboards',
      },

      dimensions: {
        length: 280,
        width: 140,
        height: 320,
        weight: 8.2,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'A+ Rating',
      },

      performance: {
        noiseLevel: '<22 dBA at full load',
        pumpSpeed: '1500-2800 RPM variable',
        fanSpeed: '800-1600 RPM',
        thermalResistance: '0.18 °C/W (CPU), 0.15 °C/W (GPU)',
      },

      materials: {
        caseConstruction: 'Tempered glass with aluminum frame',
        tubingMaterial: 'PTFE-lined stainless steel',
        pumpMaterial: 'Ceramic impeller with magnetic drive',
      },

      warranty: {
        duration: '3 years comprehensive',
        coverage: 'Full replacement warranty',
        support: 'Email and phone technical support',
      },
    },

    images: [
      {
        id: 'compact-main-1',
        url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=600&fit=crop',
        altText: 'Two-Phase Cooling Case Compact - Main View',
        caption: 'Compact design perfect for small form factor builds',
        type: 'main',
        order: 1,
      },
      {
        id: 'compact-gallery-1',
        url: 'https://images.unsplash.com/photo-1560472355-a9a6be4a7add?w=800&h=600&fit=crop',
        altText: 'Compact Case - Internal Layout',
        caption: 'Efficient internal layout maximizing cooling in compact space',
        type: 'gallery',
        order: 2,
      },
    ],

    categories: ['cooling-systems', 'complete-cases'],
    tags: ['compact', 'itx', 'small-form-factor', 'efficient'],

    metaTitle: 'Two-Phase Cooling Case Compact - Small Form Factor PC Cooling',
    metaDescription:
      'Compact two-phase cooling solution for ITX and mATX builds. Efficient cooling in a small package with 3-year warranty.',

    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
]

// Comparison data with traditional cooling solutions
export const COOLING_COMPARISON: ProductComparison[] = [
  {
    feature: 'Cooling Efficiency',
    twoPhaseCooling: '97% heat transfer efficiency',
    traditionalAir: '65% heat transfer efficiency',
    traditionalLiquid: '85% heat transfer efficiency',
    advantage: 'two-phase',
  },
  {
    feature: 'Noise Level',
    twoPhaseCooling: '<18 dBA (whisper quiet)',
    traditionalAir: '35-45 dBA (moderate)',
    traditionalLiquid: '25-35 dBA (quiet)',
    advantage: 'two-phase',
  },
  {
    feature: 'Environmental Impact (GWP)',
    twoPhaseCooling: 'GWP: 4 (eco-friendly)',
    traditionalAir: 'N/A (no refrigerant)',
    traditionalLiquid: 'GWP: 1400+ (refrigerant-based)',
    advantage: 'two-phase',
  },
  {
    feature: 'Power Consumption',
    twoPhaseCooling: '15W (highly efficient)',
    traditionalAir: '25-40W (fan-dependent)',
    traditionalLiquid: '20-30W (pump + fans)',
    advantage: 'two-phase',
  },
  {
    feature: 'Maintenance Required',
    twoPhaseCooling: 'Sealed system (5+ years)',
    traditionalAir: 'Dust cleaning (monthly)',
    traditionalLiquid: 'Fluid replacement (2-3 years)',
    advantage: 'two-phase',
  },
  {
    feature: 'Installation Complexity',
    twoPhaseCooling: 'Tool-free installation',
    traditionalAir: 'Simple mounting',
    traditionalLiquid: 'Complex tubing/fittings',
    advantage: 'neutral',
  },
  {
    feature: 'Initial Cost',
    twoPhaseCooling: '$899 - $1,299',
    traditionalAir: '$30 - $150',
    traditionalLiquid: '$200 - $600',
    advantage: 'air',
  },
  {
    feature: 'Warranty Coverage',
    twoPhaseCooling: '5 years comprehensive',
    traditionalAir: '1-3 years limited',
    traditionalLiquid: '2-5 years limited',
    advantage: 'two-phase',
  },
]

// Helper functions for product data
export const getProductBySlug = (slug: string): TwoPhaseCoolingProduct | undefined => {
  return PRODUCTS.find(product => product.slug === slug)
}

export const getFeaturedProducts = (): TwoPhaseCoolingProduct[] => {
  return PRODUCTS.slice(0, 2) // Return first 2 products as featured
}

export const getProductsByCategory = (category: string): TwoPhaseCoolingProduct[] => {
  return PRODUCTS.filter(product => product.categories.includes(category))
}
