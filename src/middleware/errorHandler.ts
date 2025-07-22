import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/environment';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, any>;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log error details in development
  if (config.isDevelopment) {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }
  
  // Send error response
  res.status(statusCode).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown',
      ...(config.isDevelopment && { stack: error.stack }),
    },
  });
};