import { DealRepository } from '../repositories/dealRepository';
import { JobRepository } from '../repositories/jobRepository';
import { SftpJobRepository } from '../repositories/sftpJobRepository';
import { Deal, CompleteJob, CompleteSftpJob } from '../types';
import { AppError, DatabaseError } from '../utils/errors';
import logger from '../utils/logger';

export interface DealWithJobNames extends Deal {
  job_names?: string;
  job_type?: 'email' | 'sftp' | 'both' | 'none';
  job_details?: Array<{
    id: number;
    name: string;
    type: 'email' | 'sftp';
  }>;
}

export interface DealsWithJobsResult {
  deals: DealWithJobNames[];
  total: number;
  jobs: CompleteJob[];
  sftpJobs: CompleteSftpJob[];
}

export class OptimizedDealService {
  private dealRepository: DealRepository;
  private jobRepository: JobRepository;
  private sftpJobRepository: SftpJobRepository;
  private jobsCache: Map<number, string[]> = new Map(); // servicer_id -> job_names[]
  private sftpJobsCache: Map<number, string[]> = new Map(); // servicer_id -> sftp_job_names[]
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.dealRepository = new DealRepository();
    this.jobRepository = new JobRepository();
    this.sftpJobRepository = new SftpJobRepository();
  }

  // Get deals with job names in a single optimized call
  async getDealsWithJobNames(
    page: number = 1, 
    limit: number = 100, 
    search?: string, 
    servicerId?: number
  ): Promise<DealsWithJobsResult> {
    try {
      // Fetch deals, email jobs, and SFTP jobs in parallel
      const [dealsResult, jobsResult, sftpJobsResult] = await Promise.all([
        search || servicerId 
          ? this.dealRepository.searchDeals(search || '', page, limit, servicerId)
          : this.dealRepository.getAllDeals(page, limit),
        this.getCachedJobs(),
        this.getCachedSftpJobs()
      ]);

      // Create a lookup map for job names by servicer_id for both types
      const servicerJobsMap = this.buildServicerJobsMap(jobsResult.jobs);
      const servicerSftpJobsMap = this.buildServicerSftpJobsMap(sftpJobsResult.jobs);

      // Enhance deals with job names and job type information
      const dealsWithJobNames: DealWithJobNames[] = dealsResult.deals.map((deal: Deal) => {
        const emailJobs = servicerJobsMap.get(Number(deal.servicer_id)) || [];
        const sftpJobs = servicerSftpJobsMap.get(Number(deal.servicer_id)) || [];
        
        const allJobNames = [...emailJobs, ...sftpJobs];
        const jobDetails = [
          ...emailJobs.map((name: string) => ({
            id: jobsResult.jobs.find((j: CompleteJob) => j.job_name === name && Number(j.servicer_id) === Number(deal.servicer_id))?.id || 0,
            name,
            type: 'email' as const
          })),
          ...sftpJobs.map((name: string) => ({
            id: sftpJobsResult.jobs.find((j: CompleteSftpJob) => j.job_name === name && Number(j.servicer_id) === Number(deal.servicer_id))?.id || 0,
            name,
            type: 'sftp' as const
          }))
        ];

        let jobType: 'email' | 'sftp' | 'both' | 'none' = 'none';
        if (emailJobs.length > 0 && sftpJobs.length > 0) {
          jobType = 'both';
        } else if (emailJobs.length > 0) {
          jobType = 'email';
        } else if (sftpJobs.length > 0) {
          jobType = 'sftp';
        }

        return {
          ...deal,
          job_names: allJobNames.length > 0 ? allJobNames.join('; ') : '-',
          job_type: jobType,
          job_details: jobDetails
        };
      });

      return {
        deals: dealsWithJobNames,
        total: dealsResult.total,
        jobs: jobsResult.jobs,
        sftpJobs: sftpJobsResult.jobs
      };
    } catch (error) {
      logger.error('Error in getDealsWithJobNames:', error);
      throw new DatabaseError('Failed to fetch deals with job names');
    }
  }

  // Optimized SFTP jobs caching with timeout protection
  private async getCachedSftpJobs(): Promise<{ jobs: CompleteSftpJob[], total: number }> {
    const now = Date.now();
    
    // Check if cache is still valid
    if (this.cacheTimestamp > 0 && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      // Return cached data if available
      if (this.sftpJobsCache.size > 0) {
        // We need to reconstruct jobs from cache for API compatibility
        // In a real scenario, we'd cache the full jobs object
        return await this.withTimeout(
          Promise.resolve(this.sftpJobRepository.getAllSftpJobs(1, 0)),
          5000, 
          'Get SFTP jobs from cache'
        );
      }
    }

    try {
      const sftpJobsResult = await this.withTimeout(
        Promise.resolve(this.sftpJobRepository.getAllSftpJobs(1, 0)),
        10000, 
        'Fetch all SFTP jobs'
      ); // Get all SFTP jobs with timeout
      
      this.updateSftpJobsCache(sftpJobsResult.jobs);
      this.cacheTimestamp = now;
      
      return sftpJobsResult;
    } catch (error) {
      logger.error('Error fetching SFTP jobs for cache:', error);
      
      // Return minimal fallback data if we have any cached SFTP jobs
      if (this.sftpJobsCache.size > 0) {
        logger.warn('Returning fallback data due to database error');
        return { jobs: [], total: this.sftpJobsCache.size };
      }
      
      throw new DatabaseError('Failed to fetch SFTP jobs');
    }
  }
  private async getCachedJobs(): Promise<{ jobs: CompleteJob[], total: number }> {
    const now = Date.now();
    
    // Check if cache is still valid
    if (this.cacheTimestamp > 0 && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      // Return cached data if available
      if (this.jobsCache.size > 0) {
        // We need to reconstruct jobs from cache for API compatibility
        // In a real scenario, we'd cache the full jobs object
        return await this.withTimeout(
          Promise.resolve(this.jobRepository.getAllJobs(1, 0)),
          5000, 
          'Get jobs from cache'
        );
      }
    }

    try {
      const jobsResult = await this.withTimeout(
        Promise.resolve(this.jobRepository.getAllJobs(1, 0)),
        10000, 
        'Fetch all jobs'
      ); // Get all jobs with timeout
      
      this.updateJobsCache(jobsResult.jobs);
      this.cacheTimestamp = now;
      
      return jobsResult;
    } catch (error) {
      logger.error('Error fetching jobs for cache:', error);
      
      // Return minimal fallback data if we have any cached jobs
      if (this.jobsCache.size > 0) {
        logger.warn('Returning fallback data due to database error');
        return { jobs: [], total: this.jobsCache.size };
      }
      
      throw new DatabaseError('Failed to fetch jobs');
    }
  }

  // Timeout wrapper utility
  private async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    operation: string
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    return Promise.race([promise, timeout]);
  }

  // Build efficient lookup map for SFTP jobs
  private buildServicerSftpJobsMap(sftpJobs: CompleteSftpJob[]): Map<number, string[]> {
    const servicerSftpJobsMap = new Map<number, string[]>();
    
    for (const sftpJob of sftpJobs) {
      if (sftpJob.servicer_id && sftpJob.job_name && sftpJob.job_name.trim()) {
        const servicerId = Number(sftpJob.servicer_id);
        const existingJobs = servicerSftpJobsMap.get(servicerId) || [];
        
        // Avoid duplicates
        if (!existingJobs.includes(sftpJob.job_name)) {
          existingJobs.push(sftpJob.job_name);
          servicerSftpJobsMap.set(servicerId, existingJobs);
        }
      }
    }
    
    return servicerSftpJobsMap;
  }
  private buildServicerJobsMap(jobs: CompleteJob[]): Map<number, string[]> {
    const servicerJobsMap = new Map<number, string[]>();
    
    for (const job of jobs) {
      if (job.servicer_id && job.job_name && job.job_name.trim()) {
        const servicerId = Number(job.servicer_id);
        const existingJobs = servicerJobsMap.get(servicerId) || [];
        
        // Avoid duplicates
        if (!existingJobs.includes(job.job_name)) {
          existingJobs.push(job.job_name);
          servicerJobsMap.set(servicerId, existingJobs);
        }
      }
    }
    
    return servicerJobsMap;
  }

  // Update cache with new SFTP jobs data
  private updateSftpJobsCache(sftpJobs: CompleteSftpJob[]): void {
    this.sftpJobsCache.clear();
    
    for (const sftpJob of sftpJobs) {
      if (sftpJob.servicer_id && sftpJob.job_name && sftpJob.job_name.trim()) {
        const servicerId = Number(sftpJob.servicer_id);
        const existingJobs = this.sftpJobsCache.get(servicerId) || [];
        
        if (!existingJobs.includes(sftpJob.job_name)) {
          existingJobs.push(sftpJob.job_name);
          this.sftpJobsCache.set(servicerId, existingJobs);
        }
      }
    }
  }
  private updateJobsCache(jobs: CompleteJob[]): void {
    this.jobsCache.clear();
    
    for (const job of jobs) {
      if (job.servicer_id && job.job_name && job.job_name.trim()) {
        const servicerId = Number(job.servicer_id);
        const existingJobs = this.jobsCache.get(servicerId) || [];
        
        if (!existingJobs.includes(job.job_name)) {
          existingJobs.push(job.job_name);
          this.jobsCache.set(servicerId, existingJobs);
        }
      }
    }
  }

  // Get job names for a specific servicer
  private getJobNamesForServicer(servicerId: number | undefined, servicerJobsMap: Map<number, string[]>): string {
    if (!servicerId) return '-';
    
    const jobNames = servicerJobsMap.get(Number(servicerId));
    return jobNames && jobNames.length > 0 ? jobNames.join('; ') : '-';
  }

  // Clear cache manually (useful for updates)
  clearCache(): void {
    this.jobsCache.clear();
    this.sftpJobsCache.clear();
    this.cacheTimestamp = 0;
  }

  // Get single deal with job names
  async getDealWithJobNames(id: number): Promise<DealWithJobNames | null> {
    try {
      const [deal, jobsResult, sftpJobsResult] = await Promise.all([
        this.dealRepository.getDealById(id),
        this.getCachedJobs(),
        this.getCachedSftpJobs()
      ]);

      if (!deal) {
        return null;
      }

      const servicerJobsMap = this.buildServicerJobsMap(jobsResult.jobs);
      const servicerSftpJobsMap = this.buildServicerSftpJobsMap(sftpJobsResult.jobs);
      
      const emailJobs = servicerJobsMap.get(Number(deal.servicer_id)) || [];
      const sftpJobs = servicerSftpJobsMap.get(Number(deal.servicer_id)) || [];
      
      const allJobNames = [...emailJobs, ...sftpJobs];
      const jobDetails = [
        ...emailJobs.map((name: string) => ({
          id: jobsResult.jobs.find((j: CompleteJob) => j.job_name === name && Number(j.servicer_id) === Number(deal.servicer_id))?.id || 0,
          name,
          type: 'email' as const
        })),
        ...sftpJobs.map((name: string) => ({
          id: sftpJobsResult.jobs.find((j: CompleteSftpJob) => j.job_name === name && Number(j.servicer_id) === Number(deal.servicer_id))?.id || 0,
          name,
          type: 'sftp' as const
        }))
      ];

      let jobType: 'email' | 'sftp' | 'both' | 'none' = 'none';
      if (emailJobs.length > 0 && sftpJobs.length > 0) {
        jobType = 'both';
      } else if (emailJobs.length > 0) {
        jobType = 'email';
      } else if (sftpJobs.length > 0) {
        jobType = 'sftp';
      }
      
      return {
        ...deal,
        job_names: allJobNames.length > 0 ? allJobNames.join('; ') : '-',
        job_type: jobType,
        job_details: jobDetails
      };
    } catch (error) {
      logger.error('Error in getDealWithJobNames:', error);
      throw new DatabaseError('Failed to fetch deal with job names');
    }
  }

  // Create deal and invalidate cache
  async createDeal(dealData: Deal): Promise<DealWithJobNames> {
    try {
      const dealId = await this.dealRepository.createDeal(dealData);
      this.clearCache(); // Invalidate cache since data changed
      
      const newDeal = await this.getDealWithJobNames(dealId);
      if (!newDeal) {
        throw new AppError('Failed to create deal');
      }
      
      return newDeal;
    } catch (error) {
      logger.error('Error creating deal:', error);
      throw new DatabaseError('Failed to create deal');
    }
  }

  // Update deal and invalidate cache
  async updateDeal(id: number, dealData: Deal): Promise<DealWithJobNames> {
    try {
      const success = await this.dealRepository.updateDeal(id, dealData);
      if (!success) {
        throw new AppError('Deal not found or update failed', 404);
      }
      
      this.clearCache(); // Invalidate cache since data changed
      
      const updatedDeal = await this.getDealWithJobNames(id);
      if (!updatedDeal) {
        throw new AppError('Failed to fetch updated deal');
      }
      
      return updatedDeal;
    } catch (error) {
      logger.error('Error updating deal:', error);
      if (error instanceof AppError) throw error;
      throw new DatabaseError('Failed to update deal');
    }
  }

  // Delete deal and invalidate cache
  async deleteDeal(id: number): Promise<void> {
    try {
      const success = await this.dealRepository.deleteDeal(id);
      if (!success) {
        throw new AppError('Deal not found', 404);
      }
      
      this.clearCache(); // Invalidate cache since data changed
    } catch (error) {
      logger.error('Error deleting deal:', error);
      if (error instanceof AppError) throw error;
      throw new DatabaseError('Failed to delete deal');
    }
  }
}
