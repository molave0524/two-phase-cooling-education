/**
 * FAQ Content for Two-Phase Cooling Education Center
 * Based on PRD information and common customer questions
 */

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'technology' | 'performance' | 'environmental' | 'product'
}

export const FAQ_CONTENT: FAQItem[] = [
  // Technology Category
  {
    id: 'tech-01',
    question: 'How does two-phase cooling work?',
    answer:
      'Two-phase cooling utilizes the superior heat transfer properties of phase change - moving from liquid to vapor and back to liquid. The cooling fluid absorbs heat by evaporating at the hot surface (CPU/GPU), then condenses back to liquid at the cooler surface, creating a continuous cycle that transfers heat much more efficiently than traditional air or liquid cooling.',
    category: 'technology',
  },
  {
    id: 'tech-02',
    question: 'What makes two-phase cooling different from liquid cooling?',
    answer:
      'Traditional liquid cooling uses pumps to circulate coolant, while two-phase cooling relies on natural phase change physics. This eliminates pump failure points, reduces noise significantly, and provides superior heat transfer efficiency. The phase change process can move much more heat per unit of fluid than single-phase liquid cooling.',
    category: 'technology',
  },
  {
    id: 'tech-03',
    question: 'Is two-phase cooling safe for home use?',
    answer:
      'Yes, our two-phase cooling system is engineered with multiple safety systems and uses non-toxic cooling fluid. The transparent design allows for visual monitoring, and the system is designed for safe home operation with proper installation and maintenance.',
    category: 'technology',
  },
  {
    id: 'tech-04',
    question: 'What is the cooling fluid made of?',
    answer:
      'Our cooling fluid is specifically engineered for two-phase cooling applications with a Global Warming Potential (GWP) rating of 20 (equivalent to gasoline) and zero Ozone Depletion Potential (ODP), making it environmentally responsible while providing superior thermal performance.',
    category: 'technology',
  },

  // Performance Category
  {
    id: 'perf-01',
    question: 'What temperature improvements can I expect?',
    answer:
      'Two-phase cooling typically achieves 47% lower peak temperatures compared to traditional air cooling. Under sustained loads, you can expect maximum CPU temperatures around 45°C instead of 85°C with air cooling, with zero thermal throttling even under extreme conditions.',
    category: 'performance',
  },
  {
    id: 'perf-02',
    question: 'Which CPUs and GPUs are supported?',
    answer:
      'Our two-phase cooling case supports all standard ATX form factor motherboards and can handle high-performance CPUs like Intel i9 and AMD Ryzen series, as well as high-end GPUs including RTX 4090 and similar cards. The system provides 850W of cooling capacity.',
    category: 'performance',
  },
  {
    id: 'perf-03',
    question: 'How quiet is the two-phase cooling system?',
    answer:
      'Two-phase cooling operates at whisper-quiet 18dB under full load, compared to 45dB for traditional air cooling. This represents a 60% reduction in noise levels, achieved by eliminating high-speed fans and pump noise.',
    category: 'performance',
  },
  {
    id: 'perf-04',
    question: 'Can it handle extreme overclocking?',
    answer:
      'Yes, two-phase cooling enables performance impossible with traditional cooling methods. The superior thermal capacity allows for sustained extreme overclocking without thermal throttling, maintaining optimal temperatures even when pushing hardware beyond factory limits.',
    category: 'performance',
  },

  // Environmental Category
  {
    id: 'env-01',
    question: 'What is the environmental impact?',
    answer:
      'Our cooling fluid has a GWP (Global Warming Potential) rating of 20, equivalent to gasoline and 99% better than traditional refrigerants (GWP 1400). It also has zero ODP (Ozone Depletion Potential), making it environmentally responsible.',
    category: 'environmental',
  },
  {
    id: 'env-02',
    question: 'Is the cooling fluid environmentally safe?',
    answer:
      'Yes, the cooling fluid is non-toxic and environmentally conscious with minimal impact. The low GWP rating and zero ODP ensure responsible environmental stewardship while maintaining superior performance.',
    category: 'environmental',
  },
  {
    id: 'env-03',
    question: 'How does power consumption compare?',
    answer:
      'Two-phase cooling consumes only 35W compared to 85W for traditional cooling systems, representing a 59% improvement in power efficiency. This reduced power consumption also contributes to lower environmental impact.',
    category: 'environmental',
  },

  // Product Category
  {
    id: 'prod-01',
    question: 'What is included with the two-phase cooling case?',
    answer:
      'The case includes the integrated two-phase cooling system, tempered glass panels for visual monitoring, all necessary mounting hardware, installation guide, and comprehensive documentation. The system comes pre-charged and ready for installation.',
    category: 'product',
  },
  {
    id: 'prod-02',
    question: 'What are the installation requirements?',
    answer:
      'The case requires standard ATX power supply and motherboard compatibility. Installation follows standard PC building procedures with additional setup for the cooling system connections. Detailed installation guides and video tutorials are provided.',
    category: 'product',
  },
  {
    id: 'prod-03',
    question: 'What warranty and support is provided?',
    answer:
      'We provide comprehensive warranty coverage and technical support for the two-phase cooling system. Support includes installation assistance, troubleshooting guides, and access to our technical team for any questions or issues.',
    category: 'product',
  },
  {
    id: 'prod-04',
    question: 'What maintenance is required?',
    answer:
      'Two-phase cooling requires minimal maintenance compared to traditional liquid cooling. There are no pumps to maintain, and the closed-loop system is designed for long-term operation. Periodic visual inspection through the transparent design is recommended.',
    category: 'product',
  },
  {
    id: 'prod-05',
    question: 'Is the case compatible with standard PC components?',
    answer:
      'Yes, the case is designed as a mid-tower ATX form factor and accepts standard motherboards, power supplies, and expansion cards. The two-phase cooling system is integrated without compromising compatibility with standard PC hardware.',
    category: 'product',
  },
]

export const FAQ_CATEGORIES = [
  { id: 'technology', name: 'Technology', description: 'How two-phase cooling works' },
  { id: 'performance', name: 'Performance', description: 'Temperature and efficiency benefits' },
  { id: 'environmental', name: 'Environmental', description: 'Environmental impact and safety' },
  { id: 'product', name: 'Product', description: 'Case specifications and support' },
] as const
