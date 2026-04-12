import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '../types/responses';

// Custom error class for application-specific errors
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = 'AppError';

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

// Interface for errors that can have a code property
interface ErrorWithCode extends Error {
  code?: string;
}

// Centralized error handling middleware
export const errorHandler = (
  err: Error | AppError | ErrorWithCode,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Log all errors for debugging
  console.error('🔥 Error caught by global handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle validation errors from express-validator
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = err.message;
  }
  // Handle MySQL/Database errors
  else if ('code' in err && err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Resource already exists';
  }
  else if ('code' in err && err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }
  else if ('code' in err && err.code === 'ER_BAD_FIELD_ERROR') {
    statusCode = 400;
    message = 'Invalid field in request';
  }
  // Handle JSON parsing errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON format';
  }
  // Handle file upload errors
  else if (err.name === 'MulterError') {
    const multerErr = err as ErrorWithCode;
    statusCode = 400;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if (multerErr.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else {
      message = 'File upload error';
    }
  }
  // Handle async errors
  else if (err.name === 'UnhandledPromiseRejectionWarning') {
    statusCode = 500;
    message = 'Unhandled promise rejection';
  }

  // Prepare error response
  const errorResponse = createErrorResponse(message, {
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch async function errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Graceful shutdown handler
export const gracefulShutdown = (server: any) => {
  return () => {
    console.log('🔄 Received shutdown signal, closing server gracefully...');
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      console.error('❌ Could not close server gracefully, forcing shutdown');
      process.exit(1);
    }, 30000);
  };
}; 