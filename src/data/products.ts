/**
 * Placeholder product data for Two-Phase Cooling Systems
 * This data will be replaced with database integration in future stories
 */

import { TwoPhaseCoolingProduct, ProductComparison } from '@/types/product'
import { PRICING, PRODUCT_CONFIG, TECHNICAL_SPECS } from '@/constants'

// Main product data
export const PRODUCTS: TwoPhaseCoolingProduct[] = [
  {
    id: 'two-phase-cooling-case-v1',
    name: 'Two-Phase Cooling Case Pro',
    slug: 'two-phase-cooling-case-pro',
    sku: 'TPC-CASE-PRO-001',
    price: PRICING.PRO_CASE,
    originalPrice: PRICING.PRO_CASE * 1.15, // 15% markup for original price
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
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
        gwp: TECHNICAL_SPECS.GWP_RATING, // Significantly lower than traditional refrigerants
        odp: TECHNICAL_SPECS.ODP_RATING, // Ozone-friendly
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
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?random=1`,
        altText: 'Two-Phase Cooling Case Pro - Main View',
        caption: 'Elegant transparent design showcasing advanced cooling technology',
        type: 'main',
        order: 1,
      },
      {
        id: 'gallery-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?random=2`,
        altText: 'Two-Phase Cooling Case - Internal Components',
        caption: 'Internal view showing two-phase cooling loops and components',
        type: 'gallery',
        order: 2,
      },
      {
        id: 'gallery-2',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?random=3`,
        altText: 'Two-Phase Cooling Case - Side Profile',
        caption: 'Side profile highlighting compact and efficient design',
        type: 'gallery',
        order: 3,
      },
      {
        id: 'technical-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?random=4`,
        altText: 'Technical Diagram - Cooling Loop',
        caption: 'Technical schematic of two-phase cooling loop operation',
        type: 'technical',
        order: 4,
      },
      {
        id: 'gallery-3',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?random=5`,
        altText: 'Two-Phase Cooling Case - Rear Panel',
        caption: 'Rear panel view showing ports and ventilation design',
        type: 'gallery',
        order: 5,
      },
      {
        id: 'technical-2',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?random=6`,
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
    price: PRICING.COMPACT_CASE,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
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
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=compact-main`,
        altText: 'Two-Phase Cooling Case Compact - Main View',
        caption: 'Compact design perfect for small form factor builds',
        type: 'main',
        order: 1,
      },
      {
        id: 'compact-gallery-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=compact-gallery`,
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

  {
    id: 'two-phase-cooling-case-elite',
    name: 'Two-Phase Cooling Case Elite',
    slug: 'two-phase-cooling-case-elite',
    sku: 'TPC-CASE-ELITE-003',
    price: 1599.99,
    originalPrice: 1799.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Ultimate two-phase cooling system with RGB lighting, dual-zone cooling, and premium materials. Perfect for extreme overclocking and enthusiast builds.',
    shortDescription: 'Premium two-phase cooling system with RGB lighting and dual-zone cooling.',
    features: [
      'Dual-zone independent cooling loops',
      'RGB lighting system with sync support',
      'Premium titanium and carbon fiber construction',
      'Extreme overclocking support (up to 300W TDP)',
      'Silent operation (<15 dBA)',
      'AI-powered thermal management',
      'Modular design for future upgrades',
      '7-year platinum warranty',
    ],
    inStock: true,
    stockQuantity: 8,
    estimatedShipping: '7-10 business days',

    specifications: {
      cooling: {
        capacity: '300W TDP (CPU) + 500W TDP (GPU)',
        efficiency: '99% heat transfer efficiency',
        operatingRange: {
          min: -15,
          max: 95,
          optimal: 70,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Elite Grade (3M™)',
        fluidVolume: '1200ml total system capacity',
      },

      compatibility: {
        cpuSockets: [
          'Intel LGA1700',
          'Intel LGA1200',
          'AMD AM4',
          'AMD AM5',
          'Intel LGA2066',
          'AMD sTRX4',
        ],
        gpuSupport: [
          'RTX 4090 Ti (Future support)',
          'RTX 4090 (Full support)',
          'RTX 4080 / 4070 Ti',
          'All current high-end GPUs',
          'Custom GPU blocks included',
        ],
        caseCompatibility: 'Full-tower (500mm length required)',
        motherboardClearance: 'Supports E-ATX, ATX, mATX motherboards',
      },

      dimensions: {
        length: 480,
        width: 240,
        height: 550,
        weight: 22.8,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'A+++ Rating (40% less power consumption)',
      },

      performance: {
        noiseLevel: '<15 dBA at full load (ultra-quiet)',
        pumpSpeed: '2000-4000 RPM variable (PWM controlled)',
        fanSpeed: '400-2000 RPM (AI adaptive)',
        thermalResistance: '0.08 °C/W (CPU), 0.05 °C/W (GPU)',
      },

      materials: {
        caseConstruction: 'Titanium frame with carbon fiber panels and premium tempered glass',
        tubingMaterial: 'Aerospace-grade titanium tubing with PTFE lining',
        pumpMaterial: 'Ceramic impeller with magnetic levitation and AI control',
      },

      warranty: {
        duration: '7 years platinum',
        coverage: 'Full replacement warranty with priority support',
        support: '24/7 premium technical support with remote diagnostics',
      },
    },

    images: [
      {
        id: 'elite-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=elite-main`,
        altText: 'Two-Phase Cooling Case Elite - Main View',
        caption: 'Premium design with RGB lighting and titanium construction',
        type: 'main',
        order: 1,
      },
      {
        id: 'elite-gallery-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=elite-gallery-1`,
        altText: 'Elite Case - RGB Lighting System',
        caption: 'Customizable RGB lighting with sync support',
        type: 'gallery',
        order: 2,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'premium'],
    tags: ['elite', 'rgb', 'overclocking', 'premium', 'dual-zone'],

    metaTitle: 'Two-Phase Cooling Case Elite - Premium PC Cooling System',
    metaDescription:
      'Ultimate two-phase cooling with RGB lighting, dual-zone cooling, and premium materials. Perfect for extreme overclocking.',

    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-22'),
  },

  {
    id: 'two-phase-cooling-case-gaming',
    name: 'Two-Phase Cooling Case Gaming Edition',
    slug: 'two-phase-cooling-case-gaming',
    sku: 'TPC-CASE-GAMING-004',
    price: 1199.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Gaming-focused two-phase cooling system with optimized thermal profiles for sustained gaming performance and eye-catching design.',
    shortDescription:
      'Gaming-optimized two-phase cooling system with performance thermal profiles.',
    features: [
      'Gaming-optimized thermal profiles',
      'Burst cooling for intensive gaming sessions',
      'Tempered glass side panel with RGB accents',
      'GPU-priority cooling design',
      'One-click performance modes',
      'Gaming aesthetic with customizable lighting',
      'Quick-release maintenance system',
      '4-year gaming warranty',
    ],
    inStock: true,
    stockQuantity: 18,
    estimatedShipping: '4-6 business days',

    specifications: {
      cooling: {
        capacity: '250W TDP (CPU) + 450W TDP (GPU)',
        efficiency: '96% heat transfer efficiency',
        operatingRange: {
          min: -8,
          max: 88,
          optimal: 68,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Gaming Grade (3M™)',
        fluidVolume: '900ml total system capacity',
      },

      compatibility: {
        cpuSockets: ['Intel LGA1700', 'Intel LGA1200', 'AMD AM4', 'AMD AM5'],
        gpuSupport: [
          'RTX 4090 (Gaming optimized)',
          'RTX 4080 / 4070 Ti',
          'RTX 3090 Ti / 3080 Ti',
          'RX 7900 XTX / 7800 XT',
          'Gaming GPU blocks included',
        ],
        caseCompatibility: 'Mid-tower gaming cases (430mm length required)',
        motherboardClearance: 'Gaming ATX, mATX motherboards',
      },

      dimensions: {
        length: 430,
        width: 210,
        height: 490,
        weight: 17.2,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'A++ Gaming Rating',
      },

      performance: {
        noiseLevel: '<19 dBA at gaming load',
        pumpSpeed: '1900-3500 RPM gaming tuned',
        fanSpeed: '700-1900 RPM gaming adaptive',
        thermalResistance: '0.10 °C/W (CPU), 0.07 °C/W (GPU)',
      },

      materials: {
        caseConstruction: 'Gaming tempered glass with RGB-enabled aluminum frame',
        tubingMaterial: 'Gaming-grade PTFE tubing with RGB lighting integration',
        pumpMaterial: 'High-performance ceramic impeller with gaming RGB',
      },

      warranty: {
        duration: '4 years gaming',
        coverage: 'Gaming performance warranty with replacement guarantee',
        support: 'Gaming technical support with performance optimization',
      },
    },

    images: [
      {
        id: 'gaming-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=gaming-main`,
        altText: 'Two-Phase Cooling Case Gaming Edition - Main View',
        caption: 'Gaming-focused design with RGB accents and performance optimization',
        type: 'main',
        order: 1,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'gaming'],
    tags: ['gaming', 'rgb', 'performance', 'gpu-optimized'],

    metaTitle: 'Two-Phase Cooling Case Gaming Edition - High-Performance Gaming Cooling',
    metaDescription:
      'Gaming-optimized two-phase cooling with performance thermal profiles and RGB lighting for sustained gaming performance.',

    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-25'),
  },

  {
    id: 'two-phase-cooling-case-workstation',
    name: 'Two-Phase Cooling Case Workstation',
    slug: 'two-phase-cooling-case-workstation',
    sku: 'TPC-CASE-WS-005',
    price: 1899.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Professional workstation cooling system designed for 24/7 operation, multi-GPU setups, and enterprise reliability standards.',
    shortDescription:
      'Professional workstation cooling system for 24/7 operation and enterprise use.',
    features: [
      '24/7 continuous operation rated',
      'Multi-GPU cooling support (up to 4 GPUs)',
      'Enterprise-grade reliability',
      'Redundant cooling loops for mission-critical tasks',
      'Professional monitoring and alerting',
      'Tool-free hot-swappable components',
      'Rack-mount compatibility option',
      '10-year enterprise warranty',
    ],
    inStock: true,
    stockQuantity: 5,
    estimatedShipping: '10-14 business days',

    specifications: {
      cooling: {
        capacity: '400W TDP (CPU) + 1200W TDP (Multi-GPU)',
        efficiency: '98% heat transfer efficiency',
        operatingRange: {
          min: -12,
          max: 90,
          optimal: 65,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Enterprise Grade (3M™)',
        fluidVolume: '1800ml total system capacity',
      },

      compatibility: {
        cpuSockets: [
          'Intel LGA1700',
          'Intel LGA2066',
          'Intel LGA4189',
          'AMD AM4',
          'AMD AM5',
          'AMD sTRX4',
          'AMD sWRX8',
        ],
        gpuSupport: [
          'Multi-GPU configurations (up to 4x)',
          'RTX A6000 / A5000 Professional',
          'Tesla V100 / A100',
          'Quadro RTX series',
          'Custom workstation blocks',
        ],
        caseCompatibility: 'Full-tower workstation cases (600mm length required)',
        motherboardClearance: 'Supports E-ATX, EATX, server motherboards',
      },

      dimensions: {
        length: 580,
        width: 280,
        height: 620,
        weight: 32.5,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'Enterprise A+++ Rating',
      },

      performance: {
        noiseLevel: '<20 dBA at workstation load',
        pumpSpeed: '2200-4200 RPM enterprise grade',
        fanSpeed: '500-2200 RPM workstation optimized',
        thermalResistance: '0.06 °C/W (CPU), 0.04 °C/W (per GPU)',
      },

      materials: {
        caseConstruction: 'Enterprise aluminum with ESD protection and EMI shielding',
        tubingMaterial: 'Medical-grade PTFE tubing with anti-bacterial coating',
        pumpMaterial: 'Industrial ceramic impeller with MTBF >100,000 hours',
      },

      warranty: {
        duration: '10 years enterprise',
        coverage: 'Full enterprise warranty with next-business-day replacement',
        support: '24/7 enterprise technical support with SLA guarantee',
      },
    },

    images: [
      {
        id: 'workstation-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=workstation-main`,
        altText: 'Two-Phase Cooling Case Workstation - Main View',
        caption: 'Professional design built for enterprise reliability and 24/7 operation',
        type: 'main',
        order: 1,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'workstation'],
    tags: ['workstation', 'enterprise', '24/7', 'multi-gpu', 'professional'],

    metaTitle: 'Two-Phase Cooling Case Workstation - Enterprise PC Cooling System',
    metaDescription:
      'Professional workstation cooling for 24/7 operation with multi-GPU support and enterprise reliability standards.',

    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-28'),
  },

  {
    id: 'two-phase-cooling-case-silent',
    name: 'Two-Phase Cooling Case Silent Pro',
    slug: 'two-phase-cooling-case-silent',
    sku: 'TPC-CASE-SILENT-006',
    price: 1099.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Ultra-quiet two-phase cooling system engineered for absolute silence while maintaining exceptional cooling performance.',
    shortDescription: 'Ultra-quiet two-phase cooling system for silent operation.',
    features: [
      'Ultra-silent operation (<12 dBA)',
      'Passive cooling mode for near-zero noise',
      'Sound-dampening materials throughout',
      'Vibration isolation system',
      'Intelligent noise-optimized fan curves',
      'Silent pump technology',
      'Acoustic foam interior lining',
      '5-year silent operation warranty',
    ],
    inStock: true,
    stockQuantity: 12,
    estimatedShipping: '5-7 business days',

    specifications: {
      cooling: {
        capacity: '180W TDP (CPU) + 320W TDP (GPU)',
        efficiency: '94% heat transfer efficiency',
        operatingRange: {
          min: -5,
          max: 80,
          optimal: 62,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Silent Grade (3M™)',
        fluidVolume: '650ml total system capacity',
      },

      compatibility: {
        cpuSockets: ['Intel LGA1700', 'Intel LGA1200', 'AMD AM4', 'AMD AM5'],
        gpuSupport: [
          'RTX 4080 / 4070 (Silent optimized)',
          'RTX 3080 / 3070 Ti',
          'RX 7800 XT / 7700 XT',
          'Silent GPU blocks included',
        ],
        caseCompatibility: 'Silent cases with sound dampening (400mm length)',
        motherboardClearance: 'ATX, mATX with acoustic clearance',
      },

      dimensions: {
        length: 400,
        width: 190,
        height: 460,
        weight: 14.8,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'A+ Silent Rating',
      },

      performance: {
        noiseLevel: '<12 dBA at full load (ultra-silent)',
        pumpSpeed: '1200-2400 RPM silent operation',
        fanSpeed: '300-1200 RPM whisper mode',
        thermalResistance: '0.15 °C/W (CPU), 0.12 °C/W (GPU)',
      },

      materials: {
        caseConstruction: 'Sound-dampened tempered glass with acoustic aluminum frame',
        tubingMaterial: 'Vibration-isolated PTFE tubing with sound dampening',
        pumpMaterial: 'Silent ceramic impeller with magnetic levitation',
      },

      warranty: {
        duration: '5 years silent operation',
        coverage: 'Silent performance warranty with noise level guarantee',
        support: 'Silent operation technical support',
      },
    },

    images: [
      {
        id: 'silent-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=silent-main`,
        altText: 'Two-Phase Cooling Case Silent Pro - Main View',
        caption: 'Ultra-quiet design with sound dampening materials for silent operation',
        type: 'main',
        order: 1,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'silent'],
    tags: ['silent', 'quiet', 'noise-dampening', 'whisper'],

    metaTitle: 'Two-Phase Cooling Case Silent Pro - Ultra-Quiet PC Cooling',
    metaDescription:
      'Ultra-quiet two-phase cooling system engineered for absolute silence while maintaining exceptional cooling performance.',

    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-30'),
  },

  {
    id: 'two-phase-cooling-case-overclock',
    name: 'Two-Phase Cooling Case Overclock Edition',
    slug: 'two-phase-cooling-case-overclock',
    sku: 'TPC-CASE-OC-007',
    price: 1799.99,
    originalPrice: 1999.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Extreme overclocking two-phase cooling system with sub-ambient cooling capability and world-record breaking potential.',
    shortDescription: 'Extreme overclocking cooling system with sub-ambient cooling capability.',
    features: [
      'Sub-ambient cooling capability (-10°C to -20°C)',
      'World-record overclocking support',
      'Extreme TDP handling (up to 500W)',
      'Competition-grade thermal management',
      'Real-time overclocking monitoring',
      'Championship-proven design',
      'Condensation prevention system',
      '6-year extreme performance warranty',
    ],
    inStock: true,
    stockQuantity: 3,
    estimatedShipping: '14-21 business days (Made to order)',

    specifications: {
      cooling: {
        capacity: '500W TDP (CPU) + 600W TDP (GPU)',
        efficiency: '99.5% heat transfer efficiency',
        operatingRange: {
          min: -25,
          max: 100,
          optimal: -10,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Extreme Grade (3M™)',
        fluidVolume: '1500ml total system capacity',
      },

      compatibility: {
        cpuSockets: [
          'Intel LGA1700 (Extreme OC)',
          'Intel LGA2066 (Extreme OC)',
          'AMD AM4 (Extreme OC)',
          'AMD AM5 (Extreme OC)',
          'Custom extreme OC mounting',
        ],
        gpuSupport: [
          'RTX 4090 (World record potential)',
          'Custom extreme OC GPU blocks',
          'Multi-GPU extreme cooling',
          'Championship-grade cooling',
        ],
        caseCompatibility: 'Extreme OC cases (650mm length required)',
        motherboardClearance: 'E-ATX with extreme OC clearance',
      },

      dimensions: {
        length: 650,
        width: 300,
        height: 700,
        weight: 45.2,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'Extreme Performance Rating',
      },

      performance: {
        noiseLevel: '<25 dBA at extreme load',
        pumpSpeed: '3000-5000 RPM extreme performance',
        fanSpeed: '1000-3000 RPM extreme cooling',
        thermalResistance: '0.03 °C/W (CPU), 0.02 °C/W (GPU)',
      },

      materials: {
        caseConstruction: 'Championship-grade titanium with extreme thermal conductivity',
        tubingMaterial: 'Extreme OC titanium tubing with maximum thermal transfer',
        pumpMaterial: 'Extreme performance ceramic with championship reliability',
      },

      warranty: {
        duration: '6 years extreme performance',
        coverage: 'World record performance warranty with competition support',
        support: '24/7 extreme overclocking technical support',
      },
    },

    images: [
      {
        id: 'overclock-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=overclock-main`,
        altText: 'Two-Phase Cooling Case Overclock Edition - Main View',
        caption: 'Extreme overclocking design with sub-ambient cooling and world-record potential',
        type: 'main',
        order: 1,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'extreme'],
    tags: ['overclocking', 'extreme', 'sub-ambient', 'world-record', 'competition'],

    metaTitle: 'Two-Phase Cooling Case Overclock Edition - Extreme OC Cooling System',
    metaDescription:
      'Extreme overclocking cooling with sub-ambient capability and world-record breaking potential for competition overclocking.',

    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-02-01'),
  },

  {
    id: 'two-phase-cooling-case-eco',
    name: 'Two-Phase Cooling Case Eco-Friendly',
    slug: 'two-phase-cooling-case-eco',
    sku: 'TPC-CASE-ECO-008',
    price: 999.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Environmentally conscious two-phase cooling system made from recycled materials with carbon-neutral operation.',
    shortDescription: 'Eco-friendly two-phase cooling system made from recycled materials.',
    features: [
      '100% recycled aluminum construction',
      'Carbon-neutral operation',
      'Biodegradable packaging',
      'Energy-efficient design (10W power consumption)',
      'Recyclable cooling fluid',
      'Green certification compliance',
      'Tree planting program inclusion',
      '5-year eco-warranty with carbon offset',
    ],
    inStock: true,
    stockQuantity: 20,
    estimatedShipping: '3-5 business days',

    specifications: {
      cooling: {
        capacity: '160W TDP (CPU) + 280W TDP (GPU)',
        efficiency: '93% heat transfer efficiency',
        operatingRange: {
          min: 0,
          max: 75,
          optimal: 60,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Eco Grade (3M™)',
        fluidVolume: '500ml total system capacity',
      },

      compatibility: {
        cpuSockets: ['Intel LGA1700', 'Intel LGA1200', 'AMD AM4', 'AMD AM5'],
        gpuSupport: [
          'RTX 4070 / 4060 Ti (Eco optimized)',
          'RTX 3070 / 3060 Ti',
          'RX 7700 XT / 7600 XT',
          'Eco-friendly GPU blocks',
        ],
        caseCompatibility: 'Eco-friendly cases (380mm length minimum)',
        motherboardClearance: 'ATX, mATX with eco design',
      },

      dimensions: {
        length: 380,
        width: 180,
        height: 440,
        weight: 12.1,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'A+++ Eco Rating (50% less power)',
      },

      performance: {
        noiseLevel: '<20 dBA at eco load',
        pumpSpeed: '1400-2600 RPM eco-optimized',
        fanSpeed: '600-1400 RPM eco-friendly',
        thermalResistance: '0.16 °C/W (CPU), 0.13 °C/W (GPU)',
      },

      materials: {
        caseConstruction: '100% recycled aluminum with eco-friendly tempered glass',
        tubingMaterial: 'Recycled PTFE tubing with biodegradable components',
        pumpMaterial: 'Eco-friendly ceramic with recycled materials',
      },

      warranty: {
        duration: '5 years eco-warranty',
        coverage: 'Eco-friendly warranty with carbon offset program',
        support: 'Green technical support with sustainability focus',
      },
    },

    images: [
      {
        id: 'eco-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=eco-main`,
        altText: 'Two-Phase Cooling Case Eco-Friendly - Main View',
        caption: 'Environmentally conscious design made from 100% recycled materials',
        type: 'main',
        order: 1,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'eco-friendly'],
    tags: ['eco-friendly', 'recycled', 'carbon-neutral', 'sustainable', 'green'],

    metaTitle: 'Two-Phase Cooling Case Eco-Friendly - Sustainable PC Cooling',
    metaDescription:
      'Environmentally conscious two-phase cooling made from recycled materials with carbon-neutral operation and green certification.',

    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-03'),
  },

  {
    id: 'two-phase-cooling-case-mini',
    name: 'Two-Phase Cooling Case Mini-ITX',
    slug: 'two-phase-cooling-case-mini-itx',
    sku: 'TPC-CASE-MINI-009',
    price: 799.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Ultra-compact two-phase cooling system designed specifically for Mini-ITX builds, delivering full-size performance in the smallest form factor.',
    shortDescription: 'Ultra-compact Mini-ITX two-phase cooling system with full-size performance.',
    features: [
      'Mini-ITX optimized design',
      'Full-size cooling performance in compact form',
      'Single-slot GPU cooling support',
      'Integrated cable management',
      'Tool-free maintenance access',
      'Portable gaming rig support',
      'Space-efficient installation',
      '3-year compact warranty',
    ],
    inStock: true,
    stockQuantity: 30,
    estimatedShipping: '2-4 business days',

    specifications: {
      cooling: {
        capacity: '95W TDP (CPU) + 150W TDP (GPU)',
        efficiency: '90% heat transfer efficiency',
        operatingRange: {
          min: 5,
          max: 70,
          optimal: 55,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Compact Grade (3M™)',
        fluidVolume: '250ml total system capacity',
      },

      compatibility: {
        cpuSockets: ['Intel LGA1700', 'AMD AM4', 'AMD AM5'],
        gpuSupport: [
          'RTX 4060 / 4050 (Mini-ITX optimized)',
          'RTX 3060 / 3050',
          'RX 7600 / 7500',
          'Single-slot GPU designs',
        ],
        caseCompatibility: 'Mini-ITX cases (220mm length minimum)',
        motherboardClearance: 'Mini-ITX motherboards only',
      },

      dimensions: {
        length: 200,
        width: 120,
        height: 250,
        weight: 4.5,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'A+ Compact Rating',
      },

      performance: {
        noiseLevel: '<25 dBA at compact load',
        pumpSpeed: '1000-2200 RPM compact optimized',
        fanSpeed: '800-1800 RPM mini-ITX tuned',
        thermalResistance: '0.22 °C/W (CPU), 0.18 °C/W (GPU)',
      },

      materials: {
        caseConstruction: 'Compact aluminum with space-efficient glass panel',
        tubingMaterial: 'Flexible PTFE micro-tubing for tight spaces',
        pumpMaterial: 'Miniature ceramic impeller with low-profile design',
      },

      warranty: {
        duration: '3 years compact',
        coverage: 'Compact system warranty with space-saving guarantee',
        support: 'Mini-ITX specialized technical support',
      },
    },

    images: [
      {
        id: 'mini-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=mini-main`,
        altText: 'Two-Phase Cooling Case Mini-ITX - Main View',
        caption: 'Ultra-compact design delivering full performance in Mini-ITX form factor',
        type: 'main',
        order: 1,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'mini-itx'],
    tags: ['mini-itx', 'compact', 'portable', 'space-efficient'],

    metaTitle: 'Two-Phase Cooling Case Mini-ITX - Ultra-Compact PC Cooling',
    metaDescription:
      'Ultra-compact Mini-ITX two-phase cooling system delivering full-size performance in the smallest form factor available.',

    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
  },

  {
    id: 'two-phase-cooling-case-creator',
    name: 'Two-Phase Cooling Case Creator Studio',
    slug: 'two-phase-cooling-case-creator',
    sku: 'TPC-CASE-CREATOR-010',
    price: 1699.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Content creator optimized two-phase cooling system with streaming-focused features, RGB controls, and render-optimized thermal profiles.',
    shortDescription:
      'Creator-optimized cooling system with streaming features and render-focused thermal profiles.',
    features: [
      'Content creation optimized thermal profiles',
      'Stream-safe ultra-quiet operation (<16 dBA)',
      'Creator RGB ecosystem integration',
      'Render workload cooling optimization',
      'Multi-monitor thermal management',
      'Creator software integration',
      'Stream overlay temperature monitoring',
      '5-year creator warranty with priority support',
    ],
    inStock: true,
    stockQuantity: 14,
    estimatedShipping: '6-8 business days',

    specifications: {
      cooling: {
        capacity: '280W TDP (CPU) + 480W TDP (GPU)',
        efficiency: '98% heat transfer efficiency',
        operatingRange: {
          min: -8,
          max: 90,
          optimal: 67,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Creator Grade (3M™)',
        fluidVolume: '1000ml total system capacity',
      },

      compatibility: {
        cpuSockets: [
          'Intel LGA1700',
          'Intel LGA1200',
          'AMD AM4',
          'AMD AM5',
          'Intel LGA2066 (Creator workstations)',
        ],
        gpuSupport: [
          'RTX 4090 (Creator optimized)',
          'RTX 4080 / 4070 Ti',
          'RTX A4000 / A5000 Professional',
          'Creator GPU blocks with streaming optimization',
        ],
        caseCompatibility: 'Creator cases with RGB integration (460mm length)',
        motherboardClearance: 'Creator ATX, E-ATX motherboards',
      },

      dimensions: {
        length: 460,
        width: 220,
        height: 520,
        weight: 19.8,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'A++ Creator Rating',
      },

      performance: {
        noiseLevel: '<16 dBA during streaming (stream-safe)',
        pumpSpeed: '1800-3600 RPM creator optimized',
        fanSpeed: '500-1700 RPM stream-quiet mode',
        thermalResistance: '0.09 °C/W (CPU), 0.06 °C/W (GPU)',
      },

      materials: {
        caseConstruction: 'Creator-grade tempered glass with RGB-enabled premium aluminum',
        tubingMaterial: 'Creator PTFE tubing with RGB lighting channels',
        pumpMaterial: 'Creator ceramic impeller with RGB integration and stream optimization',
      },

      warranty: {
        duration: '5 years creator',
        coverage: 'Creator workflow warranty with streaming performance guarantee',
        support: '24/7 creator technical support with workflow optimization',
      },
    },

    images: [
      {
        id: 'creator-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=creator-main`,
        altText: 'Two-Phase Cooling Case Creator Studio - Main View',
        caption: 'Creator-optimized design with RGB integration and stream-safe operation',
        type: 'main',
        order: 1,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'creator'],
    tags: ['creator', 'streaming', 'content-creation', 'rgb', 'render-optimized'],

    metaTitle: 'Two-Phase Cooling Case Creator Studio - Content Creator PC Cooling',
    metaDescription:
      'Content creator optimized two-phase cooling with streaming features, RGB controls, and render-optimized thermal profiles.',

    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-12'),
  },

  {
    id: 'two-phase-cooling-case-server',
    name: 'Two-Phase Cooling Case Server Rack',
    slug: 'two-phase-cooling-case-server',
    sku: 'TPC-CASE-SERVER-011',
    price: 2299.99,
    currency: PRODUCT_CONFIG.DEFAULT_CURRENCY,
    description:
      'Enterprise server-grade two-phase cooling system designed for data center deployment with redundant cooling and 24/7/365 operation.',
    shortDescription: 'Enterprise server-grade cooling system for data center deployment.',
    features: [
      'Data center rack-mount design (1U/2U/4U options)',
      'Redundant cooling loops for fault tolerance',
      '24/7/365 continuous operation rated',
      'Hot-swappable components for zero downtime',
      'Enterprise monitoring and SNMP integration',
      'Dual power supply compatibility',
      'Server-grade EMI/RFI shielding',
      '10-year enterprise server warranty',
    ],
    inStock: true,
    stockQuantity: 2,
    estimatedShipping: '21-28 business days (Enterprise fulfillment)',

    specifications: {
      cooling: {
        capacity: '600W TDP (Multi-CPU) + 800W TDP (Multi-GPU)',
        efficiency: '99.2% heat transfer efficiency',
        operatingRange: {
          min: -15,
          max: 95,
          optimal: 65,
          unit: '°C',
        },
        fluidType: 'Novec 7000 Server Grade (3M™)',
        fluidVolume: '2400ml total system capacity',
      },

      compatibility: {
        cpuSockets: [
          'Intel LGA4189 (Server)',
          'Intel LGA2066 (Workstation)',
          'AMD sWRX8 (Server)',
          'AMD sTRX4 (Workstation)',
          'Dual/Quad CPU configurations',
        ],
        gpuSupport: [
          'Tesla A100 / V100 (Server)',
          'RTX A6000 / A5000 (Workstation)',
          'Multi-GPU server configurations',
          'Enterprise GPU blocks with redundancy',
        ],
        caseCompatibility: 'Server rack chassis (1U/2U/4U standard)',
        motherboardClearance: 'Server/workstation motherboards (E-ATX+)',
      },

      dimensions: {
        length: 700,
        width: 450,
        height: 175, // 4U rack height
        weight: 48.5,
        unit: 'mm',
        weightUnit: 'kg',
      },

      environmental: {
        gwp: 4,
        odp: 0,
        recyclable: true,
        energyEfficiency: 'Enterprise A+++ Rating (Data center optimized)',
      },

      performance: {
        noiseLevel: '<30 dBA at server load (data center compliant)',
        pumpSpeed: '2500-5000 RPM enterprise grade with redundancy',
        fanSpeed: '1000-4000 RPM server optimized with fault tolerance',
        thermalResistance: '0.04 °C/W (per CPU), 0.03 °C/W (per GPU)',
      },

      materials: {
        caseConstruction: 'Server-grade steel with EMI shielding and enterprise durability',
        tubingMaterial: 'Server-grade stainless steel with redundant pathways',
        pumpMaterial: 'Enterprise ceramic with MTBF >200,000 hours and hot-swap capability',
      },

      warranty: {
        duration: '10 years enterprise server',
        coverage: 'Enterprise server warranty with 4-hour replacement SLA',
        support: '24/7/365 enterprise server support with on-site service',
      },
    },

    images: [
      {
        id: 'server-main-1',
        url: `${PRODUCT_CONFIG.IMAGE_SERVICE}/800/600?id=server-main`,
        altText: 'Two-Phase Cooling Case Server Rack - Main View',
        caption: 'Enterprise server-grade design for data center deployment with redundant cooling',
        type: 'main',
        order: 1,
      },
    ],

    categories: ['cooling-systems', 'complete-cases', 'server'],
    tags: ['server', 'enterprise', 'data-center', 'rack-mount', '24/7', 'redundant'],

    metaTitle: 'Two-Phase Cooling Case Server Rack - Enterprise Server Cooling',
    metaDescription:
      'Enterprise server-grade two-phase cooling for data center deployment with redundant cooling and 24/7/365 operation.',

    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-20'),
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
  return PRODUCTS.slice(0, 6) // Return first 6 products as featured (including the 3 new ones)
}

export const getProductsByCategory = (category: string): TwoPhaseCoolingProduct[] => {
  return PRODUCTS.filter(product => product.categories.includes(category))
}
