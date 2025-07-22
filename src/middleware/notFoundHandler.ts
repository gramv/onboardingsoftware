import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  (error as any).statusCode = 404;
  (error as any).code = 'ROUTE_NOT_FOUND';
  next(error);
};