import { Response } from 'express';
import { ApiResponse, ApiError, ApiErrorCode, HTTP_STATUS_MAP } from '@/types/api';
import { translationService } from '@/utils/i18n/translationService';

/**
 * Utility class for standardized API responses
 */
export class ApiResponseUtil {
  /**
   * Send a successful response
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    meta?: any
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(meta && { meta }),
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    errorCode: ApiErrorCode,
    message?: string,
    details?: any,
    locale: string = 'en'
  ): void {
    const statusCode = HTTP_STATUS_MAP[errorCode] || 500;
    
    // Get translated message or use provided message
    const translatedMessage = message || translationService.t(
      `api.errors.${errorCode.toLowerCase()}`,
      {},
      locale
    );
    
    const error: ApiError = {
      code: errorCode,
      message: translatedMessage,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    };
    
    const response: ApiResponse = {
      success: false,
      error,
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Send a validation error response
   */
  static validationError(
    res: Response,
    errors: Record<string, string>,
    locale: string = 'en'
  ): void {
    ApiResponseUtil.error(
      res,
      'VALIDATION_ERROR',
      translationService.t('api.errors.validation_error', {}, locale),
      { validationErrors: errors },
      locale
    );
  }

  /**
   * Send a not found error response
   */
  static notFound(
    res: Response,
    resource: string,
    locale: string = 'en'
  ): void {
    ApiResponseUtil.error(
      res,
      'RESOURCE_NOT_FOUND',
      translationService.t('api.errors.resource_not_found', { resource }, locale),
      { resource },
      locale
    );
  }

  /**
   * Send an unauthorized error response
   */
  static unauthorized(
    res: Response,
    locale: string = 'en'
  ): void {
    ApiResponseUtil.error(
      res,
      'AUTHENTICATION_REQUIRED',
      translationService.t('api.errors.authentication_required', {}, locale),
      undefined,
      locale
    );
  }

  /**
   * Send a forbidden error response
   */
  static forbidden(
    res: Response,
    locale: string = 'en'
  ): void {
    ApiResponseUtil.error(
      res,
      'INSUFFICIENT_PERMISSIONS',
      translationService.t('api.errors.insufficient_permissions', {}, locale),
      undefined,
      locale
    );
  }

  /**
   * Send an internal server error response
   */
  static internalError(
    res: Response,
    error?: Error,
    locale: string = 'en'
  ): void {
    // Log the actual error for debugging
    if (error) {
      console.error('Internal server error:', error);
    }
    
    ApiResponseUtil.error(
      res,
      'INTERNAL_SERVER_ERROR',
      translationService.t('api.errors.internal_server_error', {}, locale),
      process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      locale
    );
  }

  /**
   * Send a paginated response
   */
  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
    statusCode: number = 200
  ): void {
    const totalPages = Math.ceil(total / limit);
    
    const response: ApiResponse<T[]> = {
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Handle async route errors
   */
  static handleAsync(
    fn: (req: any, res: Response, next: any) => Promise<void>
  ) {
    return (req: any, res: Response, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

/**
 * Express middleware for handling unhandled errors
 */
export const errorHandler = (
  error: any,
  req: any,
  res: Response,
  next: any
) => {
  const locale = req.user?.languagePreference || 
                req.headers['accept-language']?.split(',')[0] || 
                'en';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    ApiResponseUtil.validationError(res, error.errors, locale);
    return;
  }
  
  if (error.name === 'CastError') {
    ApiResponseUtil.error(res, 'INVALID_INPUT', 'Invalid ID format', undefined, locale);
    return;
  }
  
  if (error.code === 'P2002') { // Prisma unique constraint violation
    ApiResponseUtil.error(res, 'RESOURCE_ALREADY_EXISTS', 'Resource already exists', undefined, locale);
    return;
  }
  
  if (error.code === 'P2025') { // Prisma record not found
    ApiResponseUtil.notFound(res, 'resource', locale);
    return;
  }
  
  // Default to internal server error
  ApiResponseUtil.internalError(res, error, locale);
};