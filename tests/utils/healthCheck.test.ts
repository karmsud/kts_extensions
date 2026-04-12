import { healthCheckService } from '../../src/utils/healthCheck';
import Database from '../../src/config/database';

// Mock the database
jest.mock('../../src/config/database');
const mockDatabase = Database as jest.Mocked<typeof Database>;

describe('Health Check Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runHealthCheck', () => {
    it('should return healthy or degraded status when main checks pass', async () => {
      // Mock database health check to pass
      const mockDbInstance = {
        healthCheck: jest.fn().mockResolvedValue(true)
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      const result = await healthCheckService.runHealthCheck();

      // Should be healthy or degraded (environment warnings are OK in test)
      expect(['healthy', 'degraded']).toContain(result.status);
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('disk_space');
      expect(result.checks).toHaveProperty('environment');
      expect(result.checks.database.status).toBe('pass');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.version).toBeDefined();
    });

    it('should return unhealthy status when database check fails', async () => {
      // Mock database health check to fail
      const mockDbInstance = {
        healthCheck: jest.fn().mockResolvedValue(false)
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      const result = await healthCheckService.runHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('fail');
    });

    it('should return degraded status when only non-critical checks fail', async () => {
      // Mock database to pass
      const mockDbInstance = {
        healthCheck: jest.fn().mockResolvedValue(true)
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      // Mock memory usage to be high (this would cause a warning)
      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as any) = jest.fn().mockReturnValue({
        rss: 1000000000,
        heapTotal: 1000000000,
        heapUsed: 800000000, // 80% usage - should trigger warning
        external: 1000000,
        arrayBuffers: 1000000
      });

      const result = await healthCheckService.runHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.checks.memory.status).toBe('warn');

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock database to throw an error
      const mockDbInstance = {
        healthCheck: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      const result = await healthCheckService.runHealthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database.status).toBe('fail');
      expect(result.checks.database.output).toContain('Connection failed');
    });

    it('should include timing information for each check', async () => {
      // Mock database health check
      const mockDbInstance = {
        healthCheck: jest.fn().mockResolvedValue(true)
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      const result = await healthCheckService.runHealthCheck();

      Object.values(result.checks).forEach(check => {
        expect(check.duration).toBeDefined();
        expect(typeof check.duration).toBe('number');
        expect(check.duration).toBeGreaterThanOrEqual(0);
        expect(check.time).toBeDefined();
      });
    });
  });

  describe('isHealthy', () => {
    it('should return true when status is healthy or degraded', async () => {
      // Mock database health check to pass
      const mockDbInstance = {
        healthCheck: jest.fn().mockResolvedValue(true)
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      const result = await healthCheckService.isHealthy();
      expect(result).toBe(true); // isHealthy returns true for both healthy and degraded
    });

    it('should return true when status is degraded', async () => {
      // Mock database to pass but memory to be high
      const mockDbInstance = {
        healthCheck: jest.fn().mockResolvedValue(true)
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      (process.memoryUsage as any) = jest.fn().mockReturnValue({
        rss: 1000000000,
        heapTotal: 1000000000,
        heapUsed: 800000000,
        external: 1000000,
        arrayBuffers: 1000000
      });

      const result = await healthCheckService.isHealthy();
      expect(result).toBe(true);

      process.memoryUsage = originalMemoryUsage;
    });

    it('should return false when status is unhealthy', async () => {
      // Mock database health check to fail
      const mockDbInstance = {
        healthCheck: jest.fn().mockResolvedValue(false)
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      const result = await healthCheckService.isHealthy();
      expect(result).toBe(false);
    });

    it('should return false when health check throws an error', async () => {
      // Mock database to throw an error
      const mockDbInstance = {
        healthCheck: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      mockDatabase.getInstance.mockReturnValue(mockDbInstance as any);

      const result = await healthCheckService.isHealthy();
      expect(result).toBe(false);
    });
  });
}); 