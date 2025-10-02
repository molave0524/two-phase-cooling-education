import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger.js'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.originalUrl
  const userAgent = req.get('User-Agent') || 'Unknown'
  const ip = req.ip || req.connection.remoteAddress || 'Unknown'

  logger.info('Request received', { method, url, ip, userAgent })

  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode
    logger.info('Request completed', { method, url, statusCode, duration })

    if (process.env.STAGE && process.env.STAGE !== 'dev') {
      const logData = {
        timestamp,
        method,
        url,
        statusCode,
        duration,
        ip,
        userAgent,
      }

      logger.info('REQUEST_LOG', logData)
    }
  })

  next()
}
