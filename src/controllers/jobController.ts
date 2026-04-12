import { Request, Response } from 'express';
import { JobRepository } from '../repositories/jobRepository';
import { XMLParser } from '../services/xmlParser';
import { ApiResponse, CompleteJob } from '../types';
import fs from 'fs/promises';

export class JobController {
  private jobRepository: JobRepository;
  private xmlParser: XMLParser;

  constructor() {
    this.jobRepository = new JobRepository();
    this.xmlParser = new XMLParser(process.env.POWERSHELL_SCRIPT_PATH || './outlook.ps1');
  }

  // GET /api/v1/jobs
  async getAllJobs(req: Request, res: Response): Promise<void> {
    try {
      // Support ?all=true or ?limit=0 to fetch all jobs
      const all = req.query.all === 'true' || req.query.limit === '0';
      const page = all ? 1 : (parseInt(req.query.page as string) || 1);
      const limit = all ? 0 : (parseInt(req.query.limit as string) || 50);
      const search = req.query.search as string;

      let result;
      if (search) {
        result = await this.jobRepository.searchJobs(search, page, limit);
      } else {
        result = await this.jobRepository.getAllJobs(page, limit);
      }

      const response: ApiResponse<CompleteJob[]> = {
        success: true,
        data: result.jobs,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: limit ? Math.ceil(result.total / limit) : 1
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getAllJobs:', error);
      const response: ApiResponse<CompleteJob[]> = {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/v1/jobs/:id
  async getJobById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const job = await this.jobRepository.getJobById(id);

      if (!job) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Job not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<CompleteJob> = {
        success: true,
        data: job
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getJobById:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      res.status(500).json(response);
    }
  }

  // POST /api/v1/jobs
  async createJob(req: Request, res: Response): Promise<void> {
    try {
      const jobData = req.body as CompleteJob;
      const jobId = await this.jobRepository.createJob(jobData);
      
      const newJob = await this.jobRepository.getJobById(jobId);
      
      const response: ApiResponse<CompleteJob> = {
        success: true,
        data: newJob!,
        message: 'Job created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error in createJob:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      res.status(500).json(response);
    }
  }

  // PUT /api/v1/jobs/:id
  async updateJob(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const jobData = req.body as CompleteJob;
      
      const success = await this.jobRepository.updateJob(id, jobData);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Job not found or update failed'
        };
        res.status(404).json(response);
        return;
      }

      const updatedJob = await this.jobRepository.getJobById(id);
      
      const response: ApiResponse<CompleteJob> = {
        success: true,
        data: updatedJob!,
        message: 'Job updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error in updateJob:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      res.status(500).json(response);
    }
  }

  // DELETE /api/v1/jobs/:id
  async deleteJob(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const success = await this.jobRepository.deleteJob(id);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Job not found or deletion failed'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Job deleted successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error in deleteJob:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      res.status(500).json(response);
    }
  }

  // POST /api/v1/jobs/import-xml
  async importFromXML(req: Request, res: Response): Promise<void> {
    try {
      const xmlPath = process.env.POWERSHELL_SCRIPT_PATH || './outlook.ps1';
      
      // Check if file exists
      try {
        await fs.access(xmlPath);
      } catch (error) {
        const response: ApiResponse<null> = {
          success: false,
          error: `PowerShell file not found at ${xmlPath}`
        };
        res.status(400).json(response);
        return;
      }

      const jobs = await this.xmlParser.parseXMLToJobs(xmlPath);
      
      // Import jobs to database
      let imported = 0;
      const errors: string[] = [];

      for (const job of jobs) {
        try {
          // Check if job already exists
          const existingJobs = await this.jobRepository.searchJobs(job.job_name);
          if (existingJobs.jobs.length === 0) {
            await this.jobRepository.createJob(job);
            imported++;
          } else {
            console.log(`Skipping existing job: ${job.job_name}`);
          }
        } catch (error) {
          console.error(`Error importing job ${job.job_name}:`, error);
          errors.push(`${job.job_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const response: ApiResponse<{ imported: number; errors: string[] }> = {
        success: true,
        data: { imported, errors },
        message: `Successfully imported ${imported} jobs`
      };

      res.json(response);
    } catch (error) {
      console.error('Error in importFromXML:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/v1/jobs/:id/xml-preview
  async getXmlPreview(req: Request, res: Response): Promise<void> {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid job ID'
        };
        res.status(400).json(response);
        return;
      }

      const job = await this.jobRepository.getJobById(jobId);
      if (!job) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Job not found'
        };
        res.status(404).json(response);
        return;
      }

      const xml = await this.xmlParser.generateXMLFromJobs([job]);
      
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error in getXmlPreview:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      res.status(500).json(response);
    }
  }

  // GET /api/v1/jobs/export-xml
  async exportToXML(req: Request, res: Response): Promise<void> {
    try {
      const { jobs } = await this.jobRepository.getAllJobs(1, 1000); // Get all jobs
      const xml = await this.xmlParser.generateXMLFromJobs(jobs);
      
      res.header('Content-Type', 'application/xml');
      res.header('Content-Disposition', 'attachment; filename="outlook_export.ps1"');
      res.send(xml);
    } catch (error) {
      console.error('Error in exportToXML:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      res.status(500).json(response);
    }
  }
}

// Create controller instance
const jobController = new JobController();

// Export individual functions for routes
export const getJobs = (req: Request, res: Response) => jobController.getAllJobs(req, res);
export const getJobById = (req: Request, res: Response) => jobController.getJobById(req, res);
export const getXmlPreview = (req: Request, res: Response) => jobController.getXmlPreview(req, res);
export const createJob = (req: Request, res: Response) => jobController.createJob(req, res);
export const updateJob = (req: Request, res: Response) => jobController.updateJob(req, res);
export const deleteJob = (req: Request, res: Response) => jobController.deleteJob(req, res);
export const importJobs = (req: Request, res: Response) => jobController.importFromXML(req, res); 