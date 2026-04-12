import Database from '../config/database';
import { SftpJob, SftpJobParser, SftpJobTemplate, CompleteSftpJob } from '../types';

export class SftpJobRepository {
  private get db() { return Database.getInstance().getDb(); }

  getAllSftpJobs(page: number = 1, limit: number = 50): { jobs: CompleteSftpJob[], total: number } {
    const total = (this.db.prepare('SELECT COUNT(*) as count FROM frp_sftp_jobs').get() as any).count;

    let jobRows: any[];
    if (!limit || limit === 0) {
      jobRows = this.db.prepare('SELECT * FROM frp_sftp_jobs ORDER BY created_at DESC').all();
    } else {
      const offset = (page - 1) * limit;
      jobRows = this.db.prepare('SELECT * FROM frp_sftp_jobs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    }

    const jobs = jobRows.map(row => this.getSftpJobWithDetails(row));
    return { jobs, total };
  }

  getSftpJobById(id: number): CompleteSftpJob | null {
    const row = this.db.prepare('SELECT * FROM frp_sftp_jobs WHERE id = ?').get(id);
    if (!row) return null;
    return this.getSftpJobWithDetails(row as any);
  }

  createSftpJob(jobData: SftpJob): CompleteSftpJob {
    const createTx = this.db.transaction((jobData: SftpJob) => {
      const result = this.db.prepare(
        `INSERT INTO frp_sftp_jobs
         (job_name, path, servicer_id, dsn, sme_emails, save_location, skip_list, ignore_list,
          zip_content_filter, day_adjust, enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        jobData.job_name,
        jobData.path,
        jobData.servicer_id ?? null,
        jobData.dsn ?? null,
        jobData.sme_emails ?? null,
        jobData.save_location ?? null,
        jobData.skip_list ?? null,
        jobData.ignore_list ?? null,
        jobData.zip_content_filter ?? '.*',
        jobData.day_adjust ?? 0,
        jobData.enabled !== undefined ? (jobData.enabled ? 1 : 0) : 1
      );

      const jobId = Number(result.lastInsertRowid);

      for (const parser of jobData.parsers || []) {
        this.db.prepare('INSERT INTO frp_sftp_job_parsers (sftp_job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(jobId, parser.parser_type, parser.parser_value);
      }
      for (const template of jobData.templates || []) {
        this.db.prepare('INSERT INTO frp_sftp_job_templates (sftp_job_id, template_name, template_value) VALUES (?, ?, ?)').run(jobId, template.template_name, template.template_value);
      }

      return jobId;
    });

    const jobId = createTx(jobData);
    const created = this.getSftpJobById(jobId);
    if (!created) throw new Error('Failed to retrieve created SFTP job');
    return created;
  }

  updateSftpJob(id: number, jobData: Partial<SftpJob>): CompleteSftpJob | null {
    const updateTx = this.db.transaction((id: number, jobData: Partial<SftpJob>) => {
      const existing = this.db.prepare('SELECT id FROM frp_sftp_jobs WHERE id = ?').get(id);
      if (!existing) return false;

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      const fieldMap: Array<[keyof SftpJob, string]> = [
        ['job_name', 'job_name'],
        ['path', 'path'],
        ['servicer_id', 'servicer_id'],
        ['dsn', 'dsn'],
        ['sme_emails', 'sme_emails'],
        ['save_location', 'save_location'],
        ['skip_list', 'skip_list'],
        ['ignore_list', 'ignore_list'],
        ['zip_content_filter', 'zip_content_filter'],
        ['day_adjust', 'day_adjust'],
        ['enabled', 'enabled'],
      ];

      for (const [key, col] of fieldMap) {
        if (jobData[key] !== undefined) {
          updateFields.push(`${col} = ?`);
          updateValues.push(key === 'enabled' ? (jobData[key] ? 1 : 0) : jobData[key]);
        }
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);
        this.db.prepare(`UPDATE frp_sftp_jobs SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
      }

      if (jobData.parsers !== undefined) {
        this.db.prepare('DELETE FROM frp_sftp_job_parsers WHERE sftp_job_id = ?').run(id);
        for (const parser of jobData.parsers) {
          this.db.prepare('INSERT INTO frp_sftp_job_parsers (sftp_job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(id, parser.parser_type, parser.parser_value);
        }
      }

      if (jobData.templates !== undefined) {
        this.db.prepare('DELETE FROM frp_sftp_job_templates WHERE sftp_job_id = ?').run(id);
        for (const template of jobData.templates) {
          this.db.prepare('INSERT INTO frp_sftp_job_templates (sftp_job_id, template_name, template_value) VALUES (?, ?, ?)').run(id, template.template_name, template.template_value);
        }
      }

      return true;
    });

    const ok = updateTx(id, jobData);
    if (!ok) return null;
    return this.getSftpJobById(id);
  }

  deleteSftpJob(id: number): boolean {
    const deleteTx = this.db.transaction((id: number) => {
      this.db.prepare('DELETE FROM frp_sftp_job_parsers WHERE sftp_job_id = ?').run(id);
      this.db.prepare('DELETE FROM frp_sftp_job_templates WHERE sftp_job_id = ?').run(id);
      const result = this.db.prepare('DELETE FROM frp_sftp_jobs WHERE id = ?').run(id);
      return result.changes > 0;
    });
    return deleteTx(id);
  }

  cloneSftpJob(id: number): CompleteSftpJob | null {
    const original = this.getSftpJobById(id);
    if (!original) return null;
    const cloned: SftpJob = {
      ...original,
      job_name: `${original.job_name}_copy`,
      id: undefined as any
    };
    return this.createSftpJob(cloned);
  }

  searchSftpJobs(searchTerm: string, page: number = 1, limit: number = 50): { jobs: CompleteSftpJob[], total: number } {
    const searchPattern = `%${searchTerm}%`;
    const total = (this.db.prepare(
      `SELECT COUNT(*) as count FROM frp_sftp_jobs
       WHERE job_name LIKE ? OR path LIKE ? OR dsn LIKE ? OR sme_emails LIKE ?`
    ).get(searchPattern, searchPattern, searchPattern, searchPattern) as any).count;

    let jobRows: any[];
    if (!limit || limit === 0) {
      jobRows = this.db.prepare(
        `SELECT * FROM frp_sftp_jobs
         WHERE job_name LIKE ? OR path LIKE ? OR dsn LIKE ? OR sme_emails LIKE ?
         ORDER BY created_at DESC`
      ).all(searchPattern, searchPattern, searchPattern, searchPattern);
    } else {
      const offset = (page - 1) * limit;
      jobRows = this.db.prepare(
        `SELECT * FROM frp_sftp_jobs
         WHERE job_name LIKE ? OR path LIKE ? OR dsn LIKE ? OR sme_emails LIKE ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).all(searchPattern, searchPattern, searchPattern, searchPattern, limit, offset);
    }

    const jobs = jobRows.map(row => this.getSftpJobWithDetails(row));
    return { jobs, total };
  }

  getSftpJobsByIds(ids: number[]): CompleteSftpJob[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const jobRows = this.db.prepare(`SELECT * FROM frp_sftp_jobs WHERE id IN (${placeholders})`).all(...ids) as any[];
    return jobRows.map(row => this.getSftpJobWithDetails(row));
  }

  private getSftpJobWithDetails(jobRow: any): CompleteSftpJob {
    const parsers: SftpJobParser[] = (this.db.prepare('SELECT * FROM frp_sftp_job_parsers WHERE sftp_job_id = ?').all(jobRow.id) as any[]).map(r => ({
      id: r.id,
      job_id: r.sftp_job_id,
      parser_type: r.parser_type,
      parser_value: r.parser_value
    }));

    const templates: SftpJobTemplate[] = (this.db.prepare('SELECT * FROM frp_sftp_job_templates WHERE sftp_job_id = ?').all(jobRow.id) as any[]).map(r => ({
      id: r.id,
      job_id: r.sftp_job_id,
      template_name: r.template_name,
      template_value: r.template_value
    }));

    return { ...jobRow, parsers, templates } as CompleteSftpJob;
  }
}
