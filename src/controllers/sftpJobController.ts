import { Request, Response } from 'express';
import { SftpJobRepository } from '../repositories/sftpJobRepository';
import { XMLParser } from '../services/xmlParser';
import { ApiResponse, CompleteSftpJob, createSuccessResponse, createErrorResponse } from '../types';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError, DatabaseError, NotFoundError } from '../utils/errors';

export class SftpJobController {
  private sftpJobRepository: SftpJobRepository;
  private xmlParser: XMLParser;

  constructor() {
    this.sftpJobRepository = new SftpJobRepository();
    this.xmlParser = new XMLParser(process.env.SFTP_SCRIPT_PATH || './sftp.ps1');
  }

  // GET /api/v1/sftp-jobs
  getAllSftpJobs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Support ?all=true or ?limit=0 to fetch all jobs
    const all = req.query.all === 'true' || req.query.limit === '0';
    const page = all ? 1 : (parseInt(req.query.page as string) || 1);
    const limit = all ? 0 : (parseInt(req.query.limit as string) || 50);
    const search = req.query.search as string;

    let result;
    if (search) {
      result = await this.sftpJobRepository.searchSftpJobs(search, page, limit);
    } else {
      result = await this.sftpJobRepository.getAllSftpJobs(page, limit);
    }

    logger.debug('SFTP jobs response:', { count: result.jobs.length, total: result.total });
    
    const response = createSuccessResponse(result.jobs, undefined, {
      page,
      limit,
      total: result.total,
      totalPages: limit ? Math.ceil(result.total / limit) : 1
    });

    res.json(response);
  });

  // GET /api/v1/sftp-jobs/:id
  getSftpJobById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid job ID');
    }

    const job = await this.sftpJobRepository.getSftpJobById(id);
    if (!job) {
      throw new NotFoundError('SFTP job');
    }

    res.json(createSuccessResponse(job));
  });

  // POST /api/v1/sftp-jobs
  createSftpJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const jobData = req.body;

    // Validate required fields
    if (!jobData.job_name || !jobData.path) {
      throw new ValidationError('Job name and path are required');
    }

    const newJob = await this.sftpJobRepository.createSftpJob(jobData);
    res.status(201).json(createSuccessResponse(newJob));
  });

  // PUT /api/v1/sftp-jobs/:id
  updateSftpJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid job ID');
    }

    const jobData = req.body;
    const updatedJob = await this.sftpJobRepository.updateSftpJob(id, jobData);
    
    if (!updatedJob) {
      throw new NotFoundError('SFTP job');
    }

    res.json(createSuccessResponse(updatedJob));
  });

  // DELETE /api/v1/sftp-jobs/:id
  deleteSftpJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid job ID');
    }

    const deleted = await this.sftpJobRepository.deleteSftpJob(id);
    if (!deleted) {
      throw new NotFoundError('SFTP job');
    }

    res.json(createSuccessResponse(null, 'SFTP job deleted successfully'));
  });

  // POST /api/v1/sftp-jobs/:id/clone
  cloneSftpJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid job ID');
    }

    const clonedJob = await this.sftpJobRepository.cloneSftpJob(id);
    if (!clonedJob) {
      throw new NotFoundError('SFTP job');
    }

    res.status(201).json(createSuccessResponse(clonedJob));
  });

  // GET /api/v1/sftp-jobs/:id/xml-preview
  getSftpJobXmlPreview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid job ID');
    }

    const job = await this.sftpJobRepository.getSftpJobById(id);
    if (!job) {
      throw new NotFoundError('SFTP job');
    }

    const xmlContent = this.generateSftpJobXml(job);
    res.json(createSuccessResponse(xmlContent));
  });

  private generateSftpJobXml(job: CompleteSftpJob): string {
    const parsers = job.parsers?.map(p => 
      `                  <${p.parser_type}>${p.parser_value}</${p.parser_type}>`
    ).join('\n') || '';

    const templates = job.templates?.map(t => 
      `                  <${t.template_name}>${t.template_value || t.template_name}</${t.template_name}>`
    ).join('\n') || '';

    return `  <${job.job_name}>
                <Path>${job.path}</Path>
                <ServicerID>${job.servicer_id || ''}</ServicerID>
                <DSN>${job.dsn || ''}</DSN>
                <SME>${job.sme_emails || ''}</SME>
                <SaveLocation>${job.save_location || ''}</SaveLocation>
                <SkipList>${job.skip_list || ''}</SkipList>
                <IgnoreList>${job.ignore_list || ''}</IgnoreList>
                <Parsers>
${parsers}
                </Parsers>
                <ZipContentFilter>${job.zip_content_filter || '.*'}</ZipContentFilter>
${templates ? `                <Templates>
${templates}
                </Templates>` : ''}
                <DayAdjust>${job.day_adjust || 0}</DayAdjust>
  </${job.job_name}>`;
  }

  private generateMasterSftpScript(jobs: CompleteSftpJob[]): string {
    const folderCollection = jobs.map(job => this.generateSftpJobXml(job)).join('\n\n');

    return `<?xml version="1.0"?>

<Settings>

  <DisableJob>0</DisableJob>

  <MapDrives>
    <N>\\\\your-domain.com\\NAS\\share1</N>
    <F>\\\\your-domain.com\\NAS\\share2</F>
    <J>\\\\your-domain.com\\NAS\\share3</J>
    <M>\\\\your-domain.com\\NAS\\share4</M>
    <T>\\\\your-domain.com\\NAS\\share5</T>
    <X>\\\\your-domain.com\\NAS\\share6</X>
  </MapDrives>

  <Server>your-db-server.your-domain.com,49001</Server>
  <Db>YourDatabase</Db>
  <StagingServer>your-staging-server.database.windows.net,1433</StagingServer>
  <StagingDb>YourStagingDb</StagingDb>
  <HashiAPI>/v1/your-vault-path</HashiAPI>

  <Email>
    <SMTPServer>smtp.your-domain.com</SMTPServer>
    <SubjectTag>SFTP Monitor</SubjectTag>
    <From>automation@your-domain.com</From>
    <Support>admin@your-domain.com</Support>
  </Email>

  <FolderCollection>

${folderCollection}

  </FolderCollection>

</Settings>`;
  }

  // POST /api/v1/sftp-jobs/generate-master-script
  async generateMasterScript(req: Request, res: Response): Promise<void> {
    try {
      const { jobIds } = req.body;
      
      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        res.status(400).json({ error: 'Job IDs array is required' });
        return;
      }

      const jobs = await this.sftpJobRepository.getSftpJobsByIds(jobIds);
      
      if (jobs.length === 0) {
        res.status(404).json({ error: 'No jobs found for the provided IDs' });
        return;
      }

      // Read the sftp.ps1 template
      const templatePath = path.join(process.cwd(), 'sftp.ps1');
      let template: string;
      
      try {
        template = await fs.readFile(templatePath, 'utf8');
      } catch (error) {
        logger.error('Failed to read SFTP template:', error);
        res.status(500).json({ error: 'SFTP template not found' });
        return;
      }

      // Generate master script header
      let masterScript = `# SFTP Master Script - Generated on ${new Date().toISOString()}
# This script executes multiple SFTP jobs
# Generated for ${jobs.length} job(s)

param(
    [string]$LogLevel = "INFO",
    [string]$JobFilter = "",
    [switch]$DryRun = $false
)

# Import required modules and functions
$ErrorActionPreference = "Stop"

# Initialize logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

Write-Log "Starting SFTP Master Script execution"
Write-Log "Jobs to process: ${jobs.length}"

$successCount = 0
$failureCount = 0
$jobResults = @()

`;

      // Add each job's configuration and execution
      for (const job of jobs) {
        masterScript += `
# ===== SFTP Job: ${job.job_name} =====
Write-Log "Processing SFTP Job: ${job.job_name}"

if ($JobFilter -eq "" -or "${job.job_name}" -like "*$JobFilter*") {
    try {
        $jobStartTime = Get-Date
        
        # Job Configuration
        $jobConfig = @{
            JobName = "${job.job_name}"
            Path = "${job.path}"
            ServicerID = ${job.servicer_id || 'null'}
            DSN = "${job.dsn || ''}"
            SMEEmails = "${job.sme_emails || ''}"
            SaveLocation = "${job.save_location}"
            SkipList = "${job.skip_list || ''}"
            IgnoreList = "${job.ignore_list || ''}"
            ZipContentFilter = "${job.zip_content_filter || '.*'}"
            DayAdjust = ${job.day_adjust || 0}
            Enabled = $${job.enabled ? 'true' : 'false'}
        }
        
        Write-Log "Job Config: $($jobConfig | ConvertTo-Json -Compress)"
        
        if (-not $DryRun) {
            # Execute SFTP operations for this job
            # Add your SFTP processing logic here based on sftp.ps1
            
            # Placeholder for actual SFTP processing
            Write-Log "Executing SFTP operations for ${job.job_name}"
            Start-Sleep -Seconds 1  # Simulate processing time
            
            $successCount++
            $jobResults += @{
                JobName = "${job.job_name}"
                Status = "Success"
                StartTime = $jobStartTime
                EndTime = Get-Date
                Duration = (Get-Date) - $jobStartTime
            }
            
            Write-Log "SFTP Job ${job.job_name} completed successfully"
        } else {
            Write-Log "DRY RUN: Would execute SFTP job ${job.job_name}"
            $jobResults += @{
                JobName = "${job.job_name}"
                Status = "DryRun"
                StartTime = $jobStartTime
                EndTime = Get-Date
                Duration = New-TimeSpan
            }
        }
    }
    catch {
        $failureCount++
        $errorMsg = $_.Exception.Message
        Write-Log "SFTP Job ${job.job_name} failed: $errorMsg" "ERROR"
        
        $jobResults += @{
            JobName = "${job.job_name}"
            Status = "Failed"
            Error = $errorMsg
            StartTime = $jobStartTime
            EndTime = Get-Date
            Duration = (Get-Date) - $jobStartTime
        }
    }
} else {
    Write-Log "Skipping SFTP Job ${job.job_name} (filtered out)"
}

`;
      }

      // Add script footer with summary
      masterScript += `
# ===== EXECUTION SUMMARY =====
Write-Log "SFTP Master Script execution completed"
Write-Log "Total jobs processed: $($jobResults.Count)"
Write-Log "Successful jobs: $successCount"
Write-Log "Failed jobs: $failureCount"

# Display detailed results
Write-Log "Job execution results:"
foreach ($result in $jobResults) {
    $status = $result.Status
    $duration = if ($result.Duration) { "$($result.Duration.TotalSeconds.ToString('F2'))s" } else { "N/A" }
    
    if ($result.Error) {
        Write-Log "  $($result.JobName): $status (Duration: $duration) - Error: $($result.Error)" "ERROR"
    } else {
        Write-Log "  $($result.JobName): $status (Duration: $duration)"
    }
}

# Send notification emails if configured
$emailResults = $jobResults | Where-Object { $_.Status -eq "Failed" }
if ($emailResults.Count -gt 0) {
    Write-Log "Found $($emailResults.Count) failed jobs - notifications may be required" "WARNING"
}

Write-Log "SFTP Master Script completed with $successCount successes and $failureCount failures"
exit $failureCount
`;

      res.json({
        script: masterScript,
        jobCount: jobs.length,
        jobNames: jobs.map((job: CompleteSftpJob) => job.job_name)
      });

    } catch (error) {
      logger.error('Error generating SFTP master script:', error);
      res.status(500).json({ 
        error: 'Failed to generate SFTP master script',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/sftp-jobs/load-from-xml
  async loadFromXmlFile(req: Request, res: Response): Promise<void> {
    try {
      const xmlFilePath = path.resolve(process.cwd(), 'sftp.ps1');
      logger.info(`Loading SFTP jobs from XML file: ${xmlFilePath}`);

      // Read and parse the XML file
      const xmlContent = await fs.readFile(xmlFilePath, 'utf-8');
      const xmlParser = require('xml2js');
      const parser = new xmlParser.Parser({ explicitArray: false });
      
      const result = await parser.parseStringPromise(xmlContent);
      const folderCollection = result.Settings.FolderCollection;
      
      if (!folderCollection) {
        res.status(400).json({
          success: false,
          error: 'No FolderCollection found in XML file'
        });
        return;
      }

      const loadedJobs: any[] = [];
      const errors: string[] = [];

      // Process each job in the XML
      for (const [jobName, jobConfig] of Object.entries(folderCollection)) {
        if (typeof jobConfig !== 'object' || !jobConfig) continue;
        
        try {
          const config = jobConfig as any;
          
          // Extract parsers
          const parsers: any[] = [];
          if (config.Parsers) {
            for (const [parserType, parserValue] of Object.entries(config.Parsers)) {
              if (typeof parserValue === 'string') {
                parsers.push({
                  parser_type: parserType,
                  parser_value: parserValue
                });
              }
            }
          }

          // Extract templates
          const templates: any[] = [];
          if (config.Templates) {
            for (const [templateName, templateValue] of Object.entries(config.Templates)) {
              if (typeof templateValue === 'string') {
                templates.push({
                  template_name: templateName,
                  template_value: templateValue
                });
              }
            }
          }

          const sftpJobData = {
            job_name: jobName,
            path: config.Path || '',
            servicer_id: parseInt(config.ServicerID) || undefined,
            dsn: config.DSN || undefined,
            sme_emails: config.SME || undefined,
            save_location: config.SaveLocation || undefined,
            skip_list: config.SkipList || undefined,
            ignore_list: config.IgnoreList || undefined,
            zip_content_filter: config.ZipContentFilter || undefined,
            day_adjust: parseInt(config.DayAdjust) || 0,
            enabled: true,
            parsers,
            templates
          };

          // Check if job already exists
          const existingJobs = await this.sftpJobRepository.searchSftpJobs(jobName, 1, 1);
          if (existingJobs.jobs.length > 0) {
            logger.info(`SFTP job '${jobName}' already exists, skipping...`);
            continue;
          }

          // Create the job
          const createdJob = await this.sftpJobRepository.createSftpJob(sftpJobData);
          loadedJobs.push(createdJob);
          logger.info(`Successfully created SFTP job: ${jobName}`);

        } catch (jobError) {
          const errorMsg = `Failed to create job '${jobName}': ${jobError instanceof Error ? jobError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      const response = {
        success: true,
        message: `Successfully loaded ${loadedJobs.length} SFTP jobs from XML file`,
        data: {
          loaded_count: loadedJobs.length,
          error_count: errors.length,
          loaded_jobs: loadedJobs.map(job => ({
            id: job.id,
            job_name: job.job_name,
            servicer_id: job.servicer_id
          })),
          errors: errors
        }
      };

      res.json(response);

    } catch (error) {
      logger.error('Error loading SFTP jobs from XML:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load SFTP jobs from XML file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
