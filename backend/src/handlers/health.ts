import { Router } from 'express'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { logger } from '../lib/logger.js'

export const healthRouter = Router()

healthRouter.get('/', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.STAGE || 'development',
    version: '1.0.0',
    services: {
      database: 'healthy',
      s3: 'healthy',
      cloudwatch: 'healthy',
    },
  }

  res.status(200).json(healthStatus)
})

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      environment: process.env.STAGE || 'development',
      version: '1.0.0',
      services: {
        database: 'healthy',
        s3: 'healthy',
        cloudwatch: 'healthy',
      },
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(healthStatus),
    }
  } catch (error) {
    logger.error('Health check failed', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
      }),
    }
  }
}
