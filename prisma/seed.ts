// Database Seed Script
// Two-Phase Cooling Education Center
//
// Populates the database with initial data for development and demonstration

import { PrismaClient, DifficultyLevel } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

const sampleVideos = [
  {
    title: 'Introduction to Two-Phase Cooling',
    slug: 'intro-two-phase-cooling',
    description: 'Discover the fundamentals of two-phase cooling technology and how it revolutionizes thermal management in high-performance computers.',
    duration_seconds: 480, // 8 minutes
    topic_category: 'cooling-basics',
    difficulty_level: DifficultyLevel.beginner,
    learning_objectives: [
      'Understand basic principles of two-phase cooling',
      'Learn about heat transfer mechanisms',
      'Identify key components of the cooling system'
    ],
    prerequisites: [],
    file_url: '/videos/intro-two-phase-cooling.mp4',
    thumbnail_url: '/images/thumbnails/intro-two-phase.jpg',
    published_at: new Date(),
    is_featured: true,
  },
  {
    title: 'Advanced Thermal Dynamics',
    slug: 'advanced-thermal-dynamics',
    description: 'Deep dive into the thermal dynamics principles that make two-phase cooling superior to traditional air and liquid cooling solutions.',
    duration_seconds: 720, // 12 minutes
    topic_category: 'thermal-science',
    difficulty_level: DifficultyLevel.advanced,
    learning_objectives: [
      'Master thermal dynamics equations',
      'Analyze heat transfer coefficients',
      'Calculate cooling efficiency metrics'
    ],
    prerequisites: ['intro-two-phase-cooling'],
    file_url: '/videos/advanced-thermal-dynamics.mp4',
    thumbnail_url: '/images/thumbnails/thermal-dynamics.jpg',
    published_at: new Date(),
    is_featured: false,
  },
  {
    title: 'Safety in Two-Phase Systems',
    slug: 'safety-two-phase-systems',
    description: 'Essential safety protocols and best practices when working with two-phase cooling systems.',
    duration_seconds: 360, // 6 minutes
    topic_category: 'safety',
    difficulty_level: DifficultyLevel.intermediate,
    learning_objectives: [
      'Understand safety protocols',
      'Learn emergency procedures',
      'Identify potential hazards'
    ],
    prerequisites: ['intro-two-phase-cooling'],
    file_url: '/videos/safety-two-phase-systems.mp4',
    thumbnail_url: '/images/thumbnails/safety-protocols.jpg',
    published_at: new Date(),
    is_featured: false,
  },
  {
    title: 'Environmental Impact Assessment',
    slug: 'environmental-impact-assessment',
    description: 'Learn about the minimal environmental impact of our two-phase cooling fluid with GWP equivalent to gasoline at 20 and zero ODP.',
    duration_seconds: 600, // 10 minutes
    topic_category: 'environmental',
    difficulty_level: DifficultyLevel.intermediate,
    learning_objectives: [
      'Understand GWP and ODP ratings',
      'Compare environmental impact with alternatives',
      'Learn about sustainable cooling practices'
    ],
    prerequisites: ['intro-two-phase-cooling'],
    file_url: '/videos/environmental-impact.mp4',
    thumbnail_url: '/images/thumbnails/environmental-impact.jpg',
    published_at: new Date(),
    is_featured: true,
  },
  {
    title: 'Performance Under Load Testing',
    slug: 'performance-under-load',
    description: 'Witness real-time performance testing of the two-phase cooling system under extreme computational loads.',
    duration_seconds: 900, // 15 minutes
    topic_category: 'performance',
    difficulty_level: DifficultyLevel.intermediate,
    learning_objectives: [
      'Observe real-time temperature monitoring',
      'Understand performance metrics',
      'Analyze cooling efficiency data'
    ],
    prerequisites: ['intro-two-phase-cooling'],
    file_url: '/videos/performance-under-load.mp4',
    thumbnail_url: '/images/thumbnails/performance-testing.jpg',
    published_at: new Date(),
    is_featured: true,
  },
  {
    title: 'System Installation Guide',
    slug: 'system-installation-guide',
    description: 'Step-by-step installation process for integrating the two-phase cooling system into your computer case.',
    duration_seconds: 1200, // 20 minutes
    topic_category: 'installation',
    difficulty_level: DifficultyLevel.beginner,
    learning_objectives: [
      'Follow installation procedures',
      'Identify required tools and components',
      'Complete system integration'
    ],
    prerequisites: ['intro-two-phase-cooling', 'safety-two-phase-systems'],
    file_url: '/videos/system-installation.mp4',
    thumbnail_url: '/images/thumbnails/installation-guide.jpg',
    published_at: new Date(),
    is_featured: false,
  },
]

const sampleProducts = [
  {
    name: 'Two-Phase Cooling Case Pro',
    slug: 'two-phase-cooling-case-pro',
    description: 'Our flagship computer case featuring integrated two-phase cooling system with transparent panels for visual monitoring. Engineered for high-performance computing with minimal environmental impact.',
    price_cents: 89900, // $899.00
    compare_at_price: 119900, // $1199.00
    category: 'Computer Cases',
    specifications: {
      formFactor: 'Mid-Tower ATX',
      dimensions: {
        height: '450mm',
        width: '220mm',
        depth: '480mm'
      },
      weight: '8.5kg',
      materials: ['Tempered Glass', 'Aluminum', 'Steel'],
      cooling: {
        type: 'Two-Phase Immersion',
        capacity: '2.5L',
        gwpRating: 20,
        odpRating: 0
      },
      compatibility: {
        motherboard: ['ATX', 'Micro-ATX', 'Mini-ITX'],
        gpu: 'Up to 350mm',
        cpu: 'Up to 180mm',
        psu: 'ATX (bottom mount)'
      },
      io: {
        usb: '2x USB 3.0, 1x USB-C',
        audio: '3.5mm headphone/microphone'
      }
    },
    features: [
      'Integrated two-phase cooling system',
      'Transparent tempered glass panels',
      'Real-time temperature monitoring',
      'Tool-free installation',
      'RGB lighting system',
      'Whisper-quiet operation',
      'Environmentally friendly coolant',
      '5-year manufacturer warranty'
    ],
    images: [
      '/images/products/case-pro-main.jpg',
      '/images/products/case-pro-side.jpg',
      '/images/products/case-pro-internal.jpg',
      '/images/products/case-pro-back.jpg'
    ],
    stock_quantity: 50,
    sku: 'TPC-CASE-PRO-001',
    is_active: true,
    is_featured: true,
    sort_order: 1,
    meta_title: 'Two-Phase Cooling Case Pro - Revolutionary Computer Case',
    meta_description: 'Experience superior thermal performance with our flagship two-phase cooling computer case. Transparent design, whisper-quiet operation, and environmental responsibility.'
  },
  {
    name: 'Two-Phase Cooling Case Essential',
    slug: 'two-phase-cooling-case-essential',
    description: 'Entry-level two-phase cooling case perfect for enthusiasts wanting to experience revolutionary cooling technology at an accessible price point.',
    price_cents: 59900, // $599.00
    compare_at_price: 79900, // $799.00
    category: 'Computer Cases',
    specifications: {
      formFactor: 'Micro-ATX',
      dimensions: {
        height: '380mm',
        width: '200mm',
        depth: '400mm'
      },
      weight: '6.2kg',
      materials: ['Acrylic', 'Aluminum'],
      cooling: {
        type: 'Two-Phase Immersion',
        capacity: '1.8L',
        gwpRating: 20,
        odpRating: 0
      },
      compatibility: {
        motherboard: ['Micro-ATX', 'Mini-ITX'],
        gpu: 'Up to 280mm',
        cpu: 'Up to 160mm',
        psu: 'SFX (side mount)'
      },
      io: {
        usb: '2x USB 3.0',
        audio: '3.5mm headphone'
      }
    },
    features: [
      'Compact two-phase cooling system',
      'Acrylic viewing panels',
      'Basic temperature monitoring',
      'Easy installation process',
      'Silent operation',
      'Eco-friendly coolant',
      '3-year manufacturer warranty'
    ],
    images: [
      '/images/products/case-essential-main.jpg',
      '/images/products/case-essential-side.jpg',
      '/images/products/case-essential-internal.jpg'
    ],
    stock_quantity: 75,
    sku: 'TPC-CASE-ESS-001',
    is_active: true,
    is_featured: false,
    sort_order: 2,
    meta_title: 'Two-Phase Cooling Case Essential - Affordable Innovation',
    meta_description: 'Entry-level two-phase cooling case offering revolutionary thermal performance at an accessible price. Perfect for enthusiasts and builders.'
  },
  {
    name: 'Educational Kit - Thermal Dynamics',
    slug: 'educational-kit-thermal-dynamics',
    description: 'Comprehensive educational kit for understanding thermal dynamics principles in two-phase cooling systems. Perfect for students and educators.',
    price_cents: 19900, // $199.00
    category: 'Educational Materials',
    specifications: {
      contents: [
        'Miniature two-phase cooling demonstration unit',
        'Temperature sensors and data logger',
        'Comprehensive workbook',
        'Video access codes',
        'Experiment guide'
      ],
      dimensions: {
        case: '200mm x 150mm x 100mm'
      },
      weight: '1.2kg'
    },
    features: [
      'Hands-on learning experience',
      'Real-time data collection',
      'Curriculum-aligned materials',
      'Video tutorial access',
      'Teacher resource guide',
      'STEM education certified'
    ],
    images: [
      '/images/products/edu-kit-main.jpg',
      '/images/products/edu-kit-contents.jpg',
      '/images/products/edu-kit-demo.jpg'
    ],
    stock_quantity: 100,
    sku: 'TPC-EDU-KIT-001',
    is_digital: false,
    is_active: true,
    is_featured: true,
    sort_order: 3,
    meta_title: 'Educational Kit - Thermal Dynamics Learning',
    meta_description: 'Hands-on educational kit for learning thermal dynamics and two-phase cooling principles. Perfect for STEM education.'
  },
]

// Sample learning paths for guided education
const sampleLearningPaths = [
  {
    path_name: 'Beginner\'s Guide to Two-Phase Cooling',
    video_sequence: [], // Will be populated with video IDs after videos are created
    description: 'Complete introduction to two-phase cooling technology for newcomers'
  },
  {
    path_name: 'Advanced Thermal Engineering',
    video_sequence: [], // Will be populated with video IDs after videos are created
    description: 'Deep technical knowledge for engineers and advanced users'
  },
  {
    path_name: 'Installation and Safety',
    video_sequence: [], // Will be populated with video IDs after videos are created
    description: 'Practical guide to safe installation and operation'
  }
]

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedVideos() {
  console.log('🎥 Seeding videos...')

  const videos = []
  for (const videoData of sampleVideos) {
    try {
      const video = await prisma.video.create({
        data: videoData
      })
      videos.push(video)
      console.log(`   ✅ Created video: ${video.title}`)
    } catch (error) {
      console.error(`   ❌ Failed to create video: ${videoData.title}`, error)
    }
  }

  return videos
}

async function seedProducts() {
  console.log('🛍️ Seeding products...')

  const products = []
  for (const productData of sampleProducts) {
    try {
      const product = await prisma.products.create({
        data: productData
      })
      products.push(product)
      console.log(`   ✅ Created product: ${product.name}`)
    } catch (error) {
      console.error(`   ❌ Failed to create product: ${productData.name}`, error)
    }
  }

  return products
}

async function seedLearningPaths(videos: any[]) {
  console.log('🛤️ Seeding learning paths...')

  // Create learning paths with proper video sequences
  const learningPaths = [
    {
      path_name: 'Beginner\'s Guide to Two-Phase Cooling',
      video_sequence: [
        videos.find(v => v.slug === 'intro-two-phase-cooling')?.id,
        videos.find(v => v.slug === 'safety-two-phase-systems')?.id,
        videos.find(v => v.slug === 'system-installation-guide')?.id,
      ].filter(Boolean),
    },
    {
      path_name: 'Advanced Thermal Engineering',
      video_sequence: [
        videos.find(v => v.slug === 'intro-two-phase-cooling')?.id,
        videos.find(v => v.slug === 'advanced-thermal-dynamics')?.id,
        videos.find(v => v.slug === 'performance-under-load')?.id,
      ].filter(Boolean),
    },
    {
      path_name: 'Environmental and Safety Focus',
      video_sequence: [
        videos.find(v => v.slug === 'intro-two-phase-cooling')?.id,
        videos.find(v => v.slug === 'environmental-impact-assessment')?.id,
        videos.find(v => v.slug === 'safety-two-phase-systems')?.id,
      ].filter(Boolean),
    },
  ]

  const createdPaths = []
  for (const pathData of learningPaths) {
    try {
      // Use a sample user ID (in real app, this would be dynamic)
      const path = await prisma.learningPaths.create({
        data: {
          user_id: '00000000-0000-0000-0000-000000000001', // Sample user ID
          path_name: pathData.path_name,
          video_sequence: pathData.video_sequence,
          total_videos: pathData.video_sequence.length,
        }
      })
      createdPaths.push(path)
      console.log(`   ✅ Created learning path: ${path.path_name}`)
    } catch (error) {
      console.error(`   ❌ Failed to create learning path: ${pathData.path_name}`, error)
    }
  }

  return createdPaths
}

async function seedSampleProgress(videos: any[]) {
  console.log('📊 Seeding sample user progress...')

  const sampleUsers = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
  ]

  const progressEntries = []
  for (const userId of sampleUsers) {
    for (let i = 0; i < Math.min(videos.length, 3); i++) {
      const video = videos[i]
      try {
        const progress = await prisma.userProgress.create({
          data: {
            user_id: userId,
            video_id: video.id,
            completion_percentage: Math.random() * 100,
            watch_time_seconds: Math.floor(Math.random() * video.duration_seconds),
            last_position_seconds: Math.floor(Math.random() * video.duration_seconds),
            interaction_count: Math.floor(Math.random() * 10),
            pause_count: Math.floor(Math.random() * 5),
            seek_count: Math.floor(Math.random() * 8),
            completed_at: Math.random() > 0.5 ? new Date() : null,
          }
        })
        progressEntries.push(progress)
      } catch (error) {
        console.error(`   ❌ Failed to create progress for user ${userId}, video ${video.title}`, error)
      }
    }
  }

  console.log(`   ✅ Created ${progressEntries.length} progress entries`)
  return progressEntries
}

async function seedSampleConversations() {
  console.log('💬 Seeding sample AI conversations...')

  const sampleConversations = [
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      session_id: 'session_001',
      title: 'Getting Started with Two-Phase Cooling',
      context_type: 'general',
      total_messages: 6,
      avg_response_time: 2500,
      fallback_count: 0,
      satisfaction_rating: 5,
      ended_at: new Date(),
    },
    {
      user_id: '00000000-0000-0000-0000-000000000002',
      session_id: 'session_002',
      title: 'Product Specifications Inquiry',
      context_type: 'product_inquiry',
      total_messages: 4,
      avg_response_time: 1800,
      fallback_count: 1,
      satisfaction_rating: 4,
      ended_at: new Date(),
    },
  ]

  const conversations = []
  for (const convData of sampleConversations) {
    try {
      const conversation = await prisma.aIConversations.create({
        data: convData
      })
      conversations.push(conversation)
      console.log(`   ✅ Created conversation: ${conversation.title}`)
    } catch (error) {
      console.error(`   ❌ Failed to create conversation: ${convData.title}`, error)
    }
  }

  return conversations
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Starting database seed...')

  try {
    // Clear existing data (optional - be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cleaning existing data...')
      await prisma.aIMessages.deleteMany()
      await prisma.aIConversations.deleteMany()
      await prisma.orderItems.deleteMany()
      await prisma.orders.deleteMany()
      await prisma.userProgress.deleteMany()
      await prisma.learningPaths.deleteMany()
      await prisma.learningSessions.deleteMany()
      await prisma.products.deleteMany()
      await prisma.video.deleteMany()
    }

    // Seed data in order (respecting foreign key constraints)
    const videos = await seedVideos()
    const products = await seedProducts()
    const learningPaths = await seedLearningPaths(videos)
    const progressEntries = await seedSampleProgress(videos)
    const conversations = await seedSampleConversations()

    console.log('\n📈 Seed Summary:')
    console.log(`   Videos: ${videos.length}`)
    console.log(`   Products: ${products.length}`)
    console.log(`   Learning Paths: ${learningPaths.length}`)
    console.log(`   Progress Entries: ${progressEntries.length}`)
    console.log(`   AI Conversations: ${conversations.length}`)

    console.log('\n✅ Database seed completed successfully!')

  } catch (error) {
    console.error('❌ Database seed failed:', error)
    throw error
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

main()
  .catch((e) => {
    console.error('Fatal error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })