import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../lib/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code,
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};
