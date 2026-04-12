// Error handling utilities
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(`Database error: ${message}`, 500);
  }
}

// Error formatter for API responses
export const formatError = (error: unknown) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500
    };
  }

  return {
    success: false,
    error: 'An unknown error occurred',
    statusCode: 500
  };
};
