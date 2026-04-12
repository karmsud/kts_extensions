import Database from '../config/database';
import logger from './logger';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      time: string;
      output?: string;
      duration?: number;
    };
  };
  timestamp: string;
  uptime: number;
  version: string;
}

interface HealthCheck {
  name: string;
  check: () => Promise<{ status: 'pass' | 'fail' | 'warn'; output?: string; duration?: number }>;
  timeout?: number;
}

class HealthCheckService {
  private checks: HealthCheck[] = [];

  constructor() {
    this.registerDefaultChecks();
  }

  private registerDefaultChecks() {
    // Database connectivity check
    this.registerCheck({
      name: 'database',
      check: async () => {
        const start = Date.now();
        try {
          const db = Database.getInstance();
          const isHealthy = db.healthCheck();
          const duration = Date.now() - start;
          if (isHealthy) {
            return { status: 'pass', output: `SQLite OK (${db.getDbPath()})`, duration };
          } else {
            return { status: 'fail', output: 'SQLite health check failed', duration };
          }
        } catch (error) {
          const duration = Date.now() - start;
          return { status: 'fail', output: error instanceof Error ? error.message : 'Database check failed', duration };
        }
      },
      timeout: 5000,
    });

    // Memory usage check
    this.registerCheck({
      name: 'memory',
      check: async () => {
        const start = Date.now();
        try {
          const memUsage = process.memoryUsage();
          const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
          const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
          const usagePercent = (usedMB / totalMB) * 100;
          const duration = Date.now() - start;

          if (usagePercent > 90) {
            return {
              status: 'fail',
              output: `Memory usage critical: ${usedMB}MB/${totalMB}MB (${usagePercent.toFixed(1)}%)`,
              duration
            };
          } else if (usagePercent > 75) {
            return {
              status: 'warn',
              output: `Memory usage high: ${usedMB}MB/${totalMB}MB (${usagePercent.toFixed(1)}%)`,
              duration
            };
          } else {
            return {
              status: 'pass',
              output: `Memory usage normal: ${usedMB}MB/${totalMB}MB (${usagePercent.toFixed(1)}%)`,
              duration
            };
          }
        } catch (error) {
          const duration = Date.now() - start;
          return {
            status: 'fail',
            output: error instanceof Error ? error.message : 'Memory check failed',
            duration
          };
        }
      },
    });

    // Disk space check (for logs directory)
    this.registerCheck({
      name: 'disk_space',
      check: async () => {
        const start = Date.now();
        try {
          const fs = await import('fs');
          const path = await import('path');
          
          const logsDir = path.join(process.cwd(), 'logs');
          
          // Simple disk space check by checking if we can write
          const testFile = path.join(logsDir, '.health_check');
          fs.writeFileSync(testFile, 'health check');
          fs.unlinkSync(testFile);
          
          const duration = Date.now() - start;
          return {
            status: 'pass',
            output: 'Disk space available for logging',
            duration
          };
        } catch (error) {
          const duration = Date.now() - start;
          return {
            status: 'fail',
            output: error instanceof Error ? error.message : 'Disk space check failed',
            duration
          };
        }
      },
    });

    // Environment variables check
    this.registerCheck({
      name: 'environment',
      check: async () => {
        const start = Date.now();
        try {
          const requiredEnvVars = ['NODE_ENV'];
          const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
          const duration = Date.now() - start;

          if (missingVars.length > 0) {
            return {
              status: 'warn',
              output: `Missing optional environment variables: ${missingVars.join(', ')}`,
              duration
            };
          } else {
            return {
              status: 'pass',
              output: 'All required environment variables present',
              duration
            };
          }
        } catch (error) {
          const duration = Date.now() - start;
          return {
            status: 'fail',
            output: error instanceof Error ? error.message : 'Environment check failed',
            duration
          };
        }
      },
    });
  }

  registerCheck(check: HealthCheck) {
    this.checks.push(check);
  }

  async runHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const checks: HealthCheckResult['checks'] = {};
    
    logger.debug('Starting health check');

    // Run all checks in parallel with timeouts
    const checkPromises = this.checks.map(async (check) => {
      const checkStart = Date.now();
      try {
        const timeout = check.timeout || 10000; // Default 10s timeout
        
        const timeoutPromise = new Promise<{ status: 'fail'; output: string; duration: number }>((_, reject) => {
          setTimeout(() => reject(new Error(`Health check timeout: ${check.name}`)), timeout);
        });

        const result = await Promise.race([
          check.check(),
          timeoutPromise
        ]);

        checks[check.name] = {
          ...result,
          time: new Date().toISOString(),
        };
      } catch (error) {
        const duration = Date.now() - checkStart;
        checks[check.name] = {
          status: 'fail',
          time: new Date().toISOString(),
          output: error instanceof Error ? error.message : 'Check failed with unknown error',
          duration,
        };
      }
    });

    await Promise.allSettled(checkPromises);

    // Determine overall status
    const statuses = Object.values(checks).map(check => check.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (statuses.every(status => status === 'pass')) {
      overallStatus = 'healthy';
    } else if (statuses.some(status => status === 'fail')) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      checks,
      timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };

    const duration = Date.now() - startTime;
    logger.info(`Health check completed in ${duration}ms with status: ${overallStatus}`);

    return result;
  }

  // Quick health check for load balancers
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.runHealthCheck();
      return result.status !== 'unhealthy';
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }
}

export const healthCheckService = new HealthCheckService();
export default healthCheckService; 