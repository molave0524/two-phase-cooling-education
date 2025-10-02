import express from 'express'
import cors from 'cors'
import serverless from 'serverless-http'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { healthRouter } from './handlers/health.js'
import { videoRouter } from './handlers/video.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { logger } from './lib/logger.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.use('/health', healthRouter)
app.use('/api/videos', videoRouter)

app.use(errorHandler)

app.get('/', (req, res) => {
  res.json({
    message: 'Two-Phase Cooling Education Platform API',
    version: '1.0.0',
    environment: process.env.STAGE || 'development',
  })
})

export const handler = serverless(app)

if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3001
  app.listen(port, () => {
    logger.info(`Backend server running on port ${port}`)
  })
}
