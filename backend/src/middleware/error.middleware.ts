/**
 * Error handling middleware
 * Centralized error handling for all routes
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Global error handler middleware
 * Handles all errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      statusCode: 500,
    },
  });
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
};

