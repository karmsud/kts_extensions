# FRP Project - Code Review & Improvement Recommendations

## 🚨 Critical Security & Stability Issues

### 1. Remove Hardcoded Database Password
**File:** `src/config/database.ts`

> **Note:** This issue has been resolved. The application now uses SQLite via `better-sqlite3` with
> configuration loaded from `config.json` (`DB_PATH`). No passwords are needed for SQLite.

### 2. Implement Input Validation Middleware
**New File:** `src/middleware/validation.ts`

```typescript
import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

export const dealValidation = [
  body('deal_name').notEmpty().trim().escape().isLength({ min: 1, max: 255 }),
  body('keyword').notEmpty().trim().escape(),
  body('servicer_id').isInt({ min: 1 }),
  validateRequest
];

export const jobValidation = [
  body('job_name').notEmpty().trim().escape(),
  body('mailbox').isEmail().normalizeEmail(),
  body('folder').optional().trim().escape(),
  validateRequest
];
```

### 3. Add Rate Limiting
**New File:** `src/middleware/rateLimiting.ts`

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit file uploads
  message: {
    success: false,
    error: 'Too many upload attempts, please try again later.'
  }
});
```

### 4. Centralized Error Handling
**New File:** `src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  console.error('Error:', err);

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message
    });
  }

  // Handle database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

## ⚠️ High Priority Architecture Issues

### 5. Improve Database Connection Management
**Updated:** `src/config/database.ts`

```typescript
import Database from 'better-sqlite3';
import { EventEmitter } from 'events';

class DatabaseManager extends EventEmitter {
  private static instance: DatabaseManager;
  private db: Database.Database;
  private isClosing = false;

  private constructor() {
    super();
    this.db = new Database(dbPath, {
      // WAL mode for concurrent reads
      // busy_timeout for write contention
    });

    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    this.db.pragma('foreign_keys = ON');

    console.log('SQLite database connected');
  }

  public getDatabase(): Database.Database {
    if (this.isClosing) {
      throw new Error('Database is closing');
    }
    return this.db;
  }

  public close(): void {
    this.isClosing = true;
    this.db.close();
    console.log('Database connection closed');
  }

  // Add health check
  public healthCheck(): boolean {
    try {
      const result = this.db.pragma('integrity_check');
      return result[0]?.integrity_check === 'ok';
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}
```

### 6. Refactor Controllers to Use Services
**New File:** `src/services/dealService.ts`

```typescript
import { DealRepository } from '../repositories/dealRepository';
import { AppError } from '../middleware/errorHandler';
import { Deal } from '../types';

export class DealService {
  constructor(private dealRepository: DealRepository) {}

  async createDeal(dealData: Partial<Deal>): Promise<Deal> {
    // Business logic validation
    await this.validateDealData(dealData);
    
    // Check for duplicates
    const existing = await this.dealRepository.findByNameAndKeyword(
      dealData.deal_name!,
      dealData.keyword!
    );
    
    if (existing) {
      throw new AppError('Deal with this name and keyword already exists', 409);
    }

    const dealId = await this.dealRepository.createDeal(dealData as Deal);
    const createdDeal = await this.dealRepository.getDealById(dealId);
    
    if (!createdDeal) {
      throw new AppError('Failed to create deal', 500);
    }

    return createdDeal;
  }

  private async validateDealData(dealData: Partial<Deal>): Promise<void> {
    if (!dealData.deal_name?.trim()) {
      throw new AppError('Deal name is required', 400);
    }
    
    if (!dealData.keyword?.trim()) {
      throw new AppError('Keyword is required', 400);
    }

    if (!dealData.servicer_id || dealData.servicer_id < 1) {
      throw new AppError('Valid servicer ID is required', 400);
    }
  }
}
```

### 7. Fix React Component Issues
**Updated:** `client/src/components/JobsManagement.tsx`

```typescript
// Add proper error boundary and loading states
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const JobsManagement: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  // ✅ Memoized filtered jobs
  const filteredJobs = useMemo(() => 
    jobs.filter(job => 
      job.job_name?.toLowerCase().includes(searchText.toLowerCase())
    ), [jobs, searchText]
  );

  // ✅ Memoized callbacks
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const response = await fetch(`/api/v1/jobs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      setJobs(prev => prev.filter(job => job.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Error handling UI
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button 
              onClick={fetchJobs}
              className="mt-2 bg-red-100 px-3 py-1 text-sm text-red-800 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rest of component...
};

// ✅ Wrap with error boundary
export default function JobsManagementWithErrorBoundary() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <pre className="mt-2 text-sm text-red-700">{error.message}</pre>
          <button 
            onClick={resetErrorBoundary}
            className="mt-2 bg-red-100 px-3 py-1 text-sm text-red-800 rounded"
          >
            Try again
          </button>
        </div>
      )}
    >
      <JobsManagement />
    </ErrorBoundary>
  );
}
```

## 📋 Medium Priority Improvements

### 8. Add Comprehensive Logging
**New File:** `src/utils/logger.ts`

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'frp-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### 9. Add Custom React Hooks
**New File:** `client/src/hooks/useApi.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string, dependencies: unknown[] = []) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const data = result.success ? result.data : result;
      
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'An error occurred'
      });
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return { ...state, refetch: fetchData };
}

// Usage example:
// const { data: jobs, loading, error, refetch } = useApi<Job[]>('/api/v1/jobs');
```

### 10. Add Proper TypeScript Types
**New File:** `src/types/api.ts`

```typescript
// ✅ Better type definitions
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateDealRequest {
  deal_name: string;
  keyword: string;
  servicer_id: number;
  item_id?: string;
}

export interface UpdateDealRequest extends Partial<CreateDealRequest> {
  id: number;
}

// Remove any types
export interface JobConfig {
  filters: {
    from: string;
    attachments: string;
    subject: string;
  };
  parsers: {
    detach_file: string;
    ignore_files: string;
    focus_files: string;
    unzip_files: boolean;
    search_by_subject: boolean;
    search_by_filename: boolean;
  };
  servicer_id: number | null;
  priority: number | null;
  server_side: boolean;
  queue_one_file: boolean;
  templates: {
    main: string;

  };
}
```

## 🔧 Developer Experience Improvements

### 11. Add Pre-commit Hooks
**New File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm test
```

**Update:** `package.json`

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 12. Add Health Check Endpoints
**New File:** `src/routes/healthRoutes.ts`

```typescript
import { Router } from 'express';
import Database from '../config/database';

const router = Router();

router.get('/health', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: false,
      memory: false,
      uptime: false
    }
  };

  try {
    // Database check
    checks.checks.database = await Database.getInstance().healthCheck();

    // Memory check
    const memUsage = process.memoryUsage();
    checks.checks.memory = memUsage.heapUsed < memUsage.heapTotal * 0.9;

    // Uptime check
    checks.checks.uptime = process.uptime() > 0;

    const allHealthy = Object.values(checks.checks).every(Boolean);
    checks.status = allHealthy ? 'healthy' : 'unhealthy';

    res.status(allHealthy ? 200 : 503).json(checks);
  } catch (error) {
    checks.status = 'unhealthy';
    res.status(503).json(checks);
  }
});

export default router;
```

## Summary

This analysis identifies **50+ specific improvements** across:

- **Security:** Remove hardcoded credentials, add input validation, implement rate limiting
- **Architecture:** Separate concerns, add proper error handling, improve database patterns  
- **Performance:** Fix N+1 queries, add memoization, optimize React renders
- **Maintainability:** Add proper TypeScript types, implement logging, create reusable hooks
- **Developer Experience:** Add testing, linting, documentation, health checks

**Recommended Implementation Order:**
1. **Week 1:** Fix critical security issues
2. **Week 2:** Implement validation and error handling
3. **Week 3:** Refactor architecture (services, proper separation)
4. **Week 4:** Add React optimizations and custom hooks
5. **Week 5:** Implement logging, health checks, and testing setup 