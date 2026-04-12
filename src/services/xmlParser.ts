import fs from 'fs-extra';
import xml2js from 'xml2js';
import { CompleteJob, JobFilter, JobParser, JobTemplate } from '../types';

export class XMLParser {
  constructor(private xmlFilePath: string) {}

  public async parseXMLToJobs(xmlPath: string): Promise<CompleteJob[]> {
    try {
      const xml = await fs.readFile(xmlPath, 'utf8');
      const data = await xml2js.parseStringPromise(xml, {
        explicitArray: false,
        tagNameProcessors: [xml2js.processors.stripPrefix],
        trim: true,
      });

      if (!data?.Settings?.Outlook?.MailboxCollection) {
        throw new Error('Invalid XML structure: MailboxCollection not found');
      }

      const mailboxCollection = data.Settings.Outlook.MailboxCollection;
      const jobs: CompleteJob[] = [];
      const usedNames = new Map<string, number>();

      // Parse each mailbox job
      for (const [jobName, jobConfig] of Object.entries(mailboxCollection)) {
        try {
          console.log(`Processing job from XML: ${jobName}`);
          if (typeof jobConfig === 'object' && jobConfig !== null) {
            let uniqueJobName = jobName;
            
            // If the job name is already used, append or increment counter
            if (usedNames.has(jobName)) {
              const counter = usedNames.get(jobName)! + 1;
              uniqueJobName = `${jobName}_${counter}`;
              usedNames.set(jobName, counter);
            } else {
              usedNames.set(jobName, 1);
            }

            const job = this.parseJobFromXML(uniqueJobName, jobConfig as any);
            if (job) {
              jobs.push(job);
            }
          }
        } catch (jobError) {
          console.error(`Failed to process job "${jobName}":`, jobError);
        }
      }

      return jobs;
    } catch (error) {
      console.error('Error parsing XML:', error);
      throw error;
    }
  }

  private parseJobFromXML(jobName: string, jobConfig: any): CompleteJob | null {
    if (!jobConfig) return null;

    const job: CompleteJob = {
      job_name: jobName,
      mailbox: jobConfig.Mailbox,
      folder: jobConfig.Folder,
      sme_emails: jobConfig.SME,
      last_email: jobConfig.LastEmail ? new Date(jobConfig.LastEmail) : undefined,
      save_location: jobConfig.SaveLocation,
      enabled: true, // Assuming default
      servicer_id: jobConfig.ServicerID ? parseInt(jobConfig.ServicerID, 10) : undefined,
      priority: jobConfig.Priority ? parseInt(jobConfig.Priority, 10) : undefined,
      server_side: jobConfig.ServerSide === '1',
      queue_one_file: jobConfig.QueueOneFile === 'True',
      day_adjust: jobConfig.DayAdjust ? parseInt(jobConfig.DayAdjust, 10) : undefined,
      filters: this.parseFilters(jobConfig.Filters),
      parsers: this.parseParsers(jobConfig.Parsers),
      templates: this.parseTemplates(jobConfig.Templates),
    };

    return job;
  }

  private parseFilters(filters: any): JobFilter[] {
    const result: JobFilter[] = [];
    if (!filters) return result;

    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string') {
        result.push({ filter_type: key.toLowerCase() as any, filter_value: value });
      }
    }
    return result;
  }

  private parseParsers(parsers: any): JobParser[] {
    const result: JobParser[] = [];
    if (!parsers) return result;

    // Mapping for parser type conversion from XML tags to database format
    const parserTypeMap: { [key: string]: string } = {
      'detachfilesubject': 'detach_file_subject',
      'detachfile': 'detach_file'
    };

    for (const [key, value] of Object.entries(parsers)) {
      if (typeof value === 'string') {
        const normalizedKey = key.toLowerCase();
        const parserType = parserTypeMap[normalizedKey] || normalizedKey;
        result.push({ parser_type: parserType as any, parser_value: value });
      }
    }
    return result;
  }

  private parseTemplates(templates: any): JobTemplate[] {
    const result: JobTemplate[] = [];
    if (!templates) return result;

    for (const [key, value] of Object.entries(templates)) {
      if (typeof value === 'string') {
        result.push({ template_name: key, template_value: value });
      }
    }
    return result;
  }

  public async generateXMLFromJobs(jobs: CompleteJob[]): Promise<string> {
    const jobCollection = jobs.reduce((acc, job) => {
      const jobData: any = {
        Mailbox: job.mailbox,
        Folder: job.folder,
        SME: job.sme_emails,
        LastEmail: job.last_email?.toLocaleString(),
        SaveLocation: job.save_location,
        Filters: job.filters.reduce((fAcc, f) => ({ ...fAcc, [this.capitalize(f.filter_type)]: f.filter_value }), {}),
        Parsers: job.parsers.reduce((pAcc, p) => ({ ...pAcc, [this.parserTypeToXmlTag(p.parser_type)]: p.parser_value }), {}),
        Templates: job.templates.reduce((tAcc, t) => ({ ...tAcc, [t.template_name]: t.template_value }), {}),
        ServicerID: job.servicer_id,
        Priority: job.priority,
        ServerSide: job.server_side ? '1' : '0',
        QueueOneFile: job.queue_one_file ? 'True' : 'False',
        DayAdjust: job.day_adjust,
      };
      // remove null or undefined properties
      Object.keys(jobData).forEach(key => (jobData[key] === undefined || jobData[key] === null) && delete jobData[key]);
      
      acc[job.job_name] = jobData;
      return acc;
    }, {} as any);

    const xmlBuilder = new xml2js.Builder({
      cdata: true,
      headless: true,
      rootName: 'MailboxCollection'
    });
    const xml = xmlBuilder.buildObject({ MailboxCollection: jobCollection });
    return xml;
  }

  private capitalize(s: string) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  private parserTypeToXmlTag(parserType: string): string {
    // Reverse mapping from database format to XML tag format
    const xmlTagMap: { [key: string]: string } = {
      'detach_file_subject': 'DetachFileSubject',
      'detach_file': 'DetachFile'
    };
    
    return xmlTagMap[parserType] || this.capitalize(parserType);
  }
} 