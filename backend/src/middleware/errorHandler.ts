import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  status?: string
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = err

  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', err)
  }

  if (statusCode === 500) {
    message = 'Internal server error'
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const createError = (statusCode: number, message: string): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error'
  error.isOperational = true
  return error
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
