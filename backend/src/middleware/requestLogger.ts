import { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.originalUrl
  const userAgent = req.get('User-Agent') || 'Unknown'
  const ip = req.ip || req.connection.remoteAddress || 'Unknown'

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`)

  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode
    console.log(`[${timestamp}] ${method} ${url} - ${statusCode} - ${duration}ms`)

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

      console.log('REQUEST_LOG:', JSON.stringify(logData))
    }
  })

  next()
}
