import { Router } from 'express'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { logger } from '../lib/logger.js'

export const videoRouter = Router()

interface VideoMetadata {
  id: string
  title: string
  slug: string
  description: string
  duration_seconds: number
  category: string
  topic_category: string
  thumbnail_url: string
  is_featured: boolean
  difficulty_level: string
  learning_objectives: string[]
  view_count: number
  prerequisites: string[]
  file_url?: string
  youtube_id?: string
}

const mockVideos: VideoMetadata[] = [
  {
    id: 'thermal-comparison-01',
    title: 'FLIR Thermal Comparison: Traditional vs Two-Phase Cooling',
    slug: 'flir-thermal-comparison-traditional-vs-two-phase',
    description:
      'Side-by-side thermal imaging comparison showing temperature differences between traditional air cooling and two-phase cooling under gaming loads.',
    duration_seconds: 180,
    category: 'thermal-fundamentals',
    topic_category: 'performance-comparison',
    thumbnail_url: '/thumbnails/thermal-comparison-01.jpg',
    is_featured: true,
    difficulty_level: 'beginner',
    learning_objectives: [
      'Understand thermal imaging visualization',
      'Compare cooling effectiveness',
      'Identify temperature hotspots',
    ],
    view_count: 0,
    prerequisites: [],
    youtube_id: 'demo-thermal-01',
  },
  {
    id: 'extreme-overclocking-demo',
    title: 'Extreme Overclocking Stress Test with Two-Phase Cooling',
    slug: 'extreme-overclocking-stress-test',
    description:
      'Demonstration of extreme overclocking scenarios using two-phase cooling technology under maximum thermal load.',
    duration_seconds: 300,
    category: 'performance-optimization',
    topic_category: 'extreme-performance',
    thumbnail_url: '/thumbnails/overclocking-demo.jpg',
    is_featured: true,
    difficulty_level: 'advanced',
    learning_objectives: [
      'Understand extreme cooling scenarios',
      'See overclocking thermal management',
      'Learn about thermal limits',
    ],
    view_count: 0,
    prerequisites: ['thermal-fundamentals'],
    youtube_id: 'demo-overclocking-01',
  },
]

videoRouter.get('/', (req, res) => {
  const { category, featured, difficulty } = req.query

  let filteredVideos = [...mockVideos]

  if (category) {
    filteredVideos = filteredVideos.filter(video => video.category === category)
  }

  if (featured === 'true') {
    filteredVideos = filteredVideos.filter(video => video.is_featured)
  }

  if (difficulty) {
    filteredVideos = filteredVideos.filter(video => video.difficulty_level === difficulty)
  }

  res.json({
    videos: filteredVideos,
    total: filteredVideos.length,
    categories: ['thermal-fundamentals', 'cooling-systems', 'performance-optimization'],
    difficulty_levels: ['beginner', 'intermediate', 'advanced'],
  })
})

videoRouter.get('/:id', (req, res) => {
  const { id } = req.params
  const video = mockVideos.find(v => v.id === id || v.slug === id)

  if (!video) {
    return res.status(404).json({
      error: 'Video not found',
      message: `No video found with ID or slug: ${id}`,
    })
  }

  res.json(video)
})

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const path = event.path
    const method = event.httpMethod
    const queryParams = event.queryStringParameters || {}

    if (method === 'GET' && path === '/api/videos') {
      const { category, featured, difficulty } = queryParams

      let filteredVideos = [...mockVideos]

      if (category) {
        filteredVideos = filteredVideos.filter(video => video.category === category)
      }

      if (featured === 'true') {
        filteredVideos = filteredVideos.filter(video => video.is_featured)
      }

      if (difficulty) {
        filteredVideos = filteredVideos.filter(video => video.difficulty_level === difficulty)
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          videos: filteredVideos,
          total: filteredVideos.length,
          categories: ['thermal-fundamentals', 'cooling-systems', 'performance-optimization'],
          difficulty_levels: ['beginner', 'intermediate', 'advanced'],
        }),
      }
    }

    if (method === 'GET' && path.startsWith('/api/videos/')) {
      const id = path.split('/').pop()
      const video = mockVideos.find(v => v.id === id || v.slug === id)

      if (!video) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Video not found',
            message: `No video found with ID or slug: ${id}`,
          }),
        }
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(video),
      }
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Not found',
        message: 'Endpoint not found',
      }),
    }
  } catch (error) {
    logger.error('Video handler error', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'An error occurred processing the request',
      }),
    }
  }
}
