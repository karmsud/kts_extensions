import Database from '../config/database';
import { MailboxJob, JobFilter, JobParser, JobTemplate, CompleteJob } from '../types';

export class JobRepository {
  private get db() { return Database.getInstance().getDb(); }

  getAllJobs(page: number = 1, limit: number = 50): { jobs: CompleteJob[], total: number } {
    const total = (this.db.prepare('SELECT COUNT(*) as count FROM frp_mailbox_jobs').get() as any).count;

    let jobRows: any[];
    if (!limit || limit === 0) {
      jobRows = this.db.prepare('SELECT * FROM frp_mailbox_jobs ORDER BY created_at DESC').all();
    } else {
      const offset = (page - 1) * limit;
      jobRows = this.db.prepare('SELECT * FROM frp_mailbox_jobs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    }

    const jobs: CompleteJob[] = jobRows.map(row => this.getJobWithDetails(row));
    return { jobs, total };
  }

  getJobById(id: number): CompleteJob | null {
    const row = this.db.prepare('SELECT * FROM frp_mailbox_jobs WHERE id = ?').get(id);
    if (!row) return null;
    return this.getJobWithDetails(row as any);
  }

  getJobByName(jobName: string): CompleteJob | null {
    const row = this.db.prepare('SELECT * FROM frp_mailbox_jobs WHERE job_name = ?').get(jobName);
    if (!row) return null;
    return this.getJobWithDetails(row as any);
  }

  createJob(job: CompleteJob): number {
    const createJobTx = this.db.transaction((job: CompleteJob) => {
      const result = this.db.prepare(
        `INSERT INTO frp_mailbox_jobs
         (job_name, mailbox, folder, sme_emails, last_email, save_location,
          enabled, servicer_id, priority, server_side, queue_one_file, day_adjust)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        job.job_name ?? null,
        job.mailbox ?? null,
        job.folder ?? null,
        job.sme_emails ?? null,
        job.last_email ?? null,
        job.save_location ?? null,
        job.enabled === false ? 0 : 1,
        job.servicer_id ?? null,
        job.priority ?? 0,
        job.server_side ? 1 : 0,
        job.queue_one_file ? 1 : 0,
        job.day_adjust ?? 0
      );

      const jobId = Number(result.lastInsertRowid);

      for (const filter of job.filters || []) {
        this.db.prepare('INSERT INTO frp_filters (job_id, filter_type, filter_value) VALUES (?, ?, ?)').run(jobId, filter.filter_type, filter.filter_value);
      }
      for (const parser of job.parsers || []) {
        this.db.prepare('INSERT INTO frp_parsers (job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(jobId, parser.parser_type, parser.parser_value);
      }
      for (const template of job.templates || []) {
        this.db.prepare('INSERT INTO frp_templates (job_id, template_name, template_value) VALUES (?, ?, ?)').run(jobId, template.template_name, template.template_value);
      }

      return jobId;
    });

    return createJobTx(job);
  }

  updateJob(id: number, job: CompleteJob): boolean {
    const updateJobTx = this.db.transaction((id: number, job: CompleteJob) => {
      const result = this.db.prepare(
        `UPDATE frp_mailbox_jobs
         SET job_name = ?, mailbox = ?, folder = ?, sme_emails = ?, last_email = ?,
             save_location = ?, enabled = ?, servicer_id = ?, priority = ?,
             server_side = ?, queue_one_file = ?, day_adjust = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        job.job_name, job.mailbox, job.folder, job.sme_emails, job.last_email,
        job.save_location, job.enabled ? 1 : 0, job.servicer_id, job.priority,
        job.server_side ? 1 : 0, job.queue_one_file ? 1 : 0, job.day_adjust, id
      );

      if (result.changes === 0) return false;

      this.db.prepare('DELETE FROM frp_filters WHERE job_id = ?').run(id);
      this.db.prepare('DELETE FROM frp_parsers WHERE job_id = ?').run(id);
      this.db.prepare('DELETE FROM frp_templates WHERE job_id = ?').run(id);

      for (const filter of job.filters || []) {
        this.db.prepare('INSERT INTO frp_filters (job_id, filter_type, filter_value) VALUES (?, ?, ?)').run(id, filter.filter_type, filter.filter_value);
      }
      for (const parser of job.parsers || []) {
        this.db.prepare('INSERT INTO frp_parsers (job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(id, parser.parser_type, parser.parser_value);
      }
      for (const template of job.templates || []) {
        this.db.prepare('INSERT INTO frp_templates (job_id, template_name, template_value) VALUES (?, ?, ?)').run(id, template.template_name, template.template_value);
      }

      return true;
    });

    return updateJobTx(id, job);
  }

  deleteJob(id: number): boolean {
    const result = this.db.prepare('DELETE FROM frp_mailbox_jobs WHERE id = ?').run(id);
    return result.changes > 0;
  }

  searchJobs(searchTerm: string, page: number = 1, limit: number = 50): { jobs: CompleteJob[], total: number } {
    const searchPattern = `%${searchTerm}%`;
    const total = (this.db.prepare(
      `SELECT COUNT(*) as count FROM frp_mailbox_jobs
       WHERE job_name LIKE ? OR mailbox LIKE ? OR folder LIKE ? OR sme_emails LIKE ?`
    ).get(searchPattern, searchPattern, searchPattern, searchPattern) as any).count;

    const offset = (page - 1) * limit;
    const jobRows = this.db.prepare(
      `SELECT * FROM frp_mailbox_jobs
       WHERE job_name LIKE ? OR mailbox LIKE ? OR folder LIKE ? OR sme_emails LIKE ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(searchPattern, searchPattern, searchPattern, searchPattern, limit, offset);

    const jobs: CompleteJob[] = (jobRows as any[]).map(row => this.getJobWithDetails(row));
    return { jobs, total };
  }

  getJobStats(): { totalJobs: number; enabledJobs: number; disabledJobs: number } {
    const total = (this.db.prepare('SELECT COUNT(*) as total FROM frp_mailbox_jobs').get() as any).total;
    const enabled = (this.db.prepare('SELECT COUNT(*) as total FROM frp_mailbox_jobs WHERE enabled = 1').get() as any).total;
    return { totalJobs: total, enabledJobs: enabled, disabledJobs: total - enabled };
  }

  importJobs(jobs: CompleteJob[]): { imported: number, skipped: number, errors: string[] } {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const job of jobs) {
      try {
        const existing = this.db.prepare('SELECT id FROM frp_mailbox_jobs WHERE job_name = ?').get(job.job_name);
        if (existing) { skipped++; continue; }
        this.createJob(job);
        imported++;
      } catch (error) {
        errors.push(`Failed to import job "${job.job_name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { imported, skipped, errors };
  }

  private getJobWithDetails(jobRow: any): CompleteJob {
    const jobId = jobRow.id;

    const filters = this.db.prepare('SELECT * FROM frp_filters WHERE job_id = ?').all(jobId) as JobFilter[];
    const parsers = this.db.prepare('SELECT * FROM frp_parsers WHERE job_id = ?').all(jobId) as JobParser[];
    const templates = this.db.prepare('SELECT * FROM frp_templates WHERE job_id = ?').all(jobId) as JobTemplate[];

    return { ...jobRow, filters, parsers, templates } as CompleteJob;
  }
}
