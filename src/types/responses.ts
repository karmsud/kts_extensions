/**
 * Standard API response interface for consistent frontend interaction
 * @template T - The type of data being returned
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  
  /** The data payload when success is true */
  data?: T;
  
  /** Error message when success is false */
  error?: string;
  
  /** Pagination information when applicable */
  pagination?: PaginationInfo;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** Success message for user feedback */
  message?: string;
}

/**
 * Pagination information for list endpoints
 */
export interface PaginationInfo {
  /** Current page number (1-based) */
  page: number;
  
  /** Items per page */
  limit: number;
  
  /** Total number of items */
  total: number;
  
  /** Total number of pages */
  totalPages: number;
}

/**
 * Creates a success response
 * @param data - The data to return
 * @param message - Optional success message
 * @param pagination - Optional pagination info
 * @param metadata - Optional additional metadata
 */
export function createSuccessResponse<T>(
  data: T, 
  message?: string,
  pagination?: PaginationInfo,
  metadata?: Record<string, any>
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    pagination,
    metadata
  };
}

/**
 * Creates an error response
 * @param error - Error message
 * @param metadata - Optional additional metadata
 */
export function createErrorResponse(
  error: string,
  metadata?: Record<string, any>
): ApiResponse<null> {
  return {
    success: false,
    error,
    metadata
  };
}
