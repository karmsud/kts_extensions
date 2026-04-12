import { Request, Response } from 'express';
import Database from '../config/database';
import fs from 'fs/promises';
import path from 'path';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError, DatabaseError, NotFoundError } from '../utils/errors';
import { createSuccessResponse, createErrorResponse } from '../types';
import logger from '../utils/logger';

export const getJobConfig = asyncHandler(async (req: Request, res: Response) => {
  const jobId = req.params.id;
  if (!jobId) throw new ValidationError('Job ID is required');

  const db = Database.getInstance().getDb();

  try {
    const jobData = db.prepare(
      'SELECT servicer_id, priority, server_side, queue_one_file FROM frp_mailbox_jobs WHERE id = ?'
    ).get(jobId) as any;

    if (!jobData) throw new NotFoundError('Job');

    const filterRows = db.prepare('SELECT filter_type, filter_value FROM frp_filters WHERE job_id = ?').all(jobId) as any[];
    const parserRows = db.prepare('SELECT parser_type, parser_value FROM frp_parsers WHERE job_id = ?').all(jobId) as any[];
    const templateRows = db.prepare('SELECT template_name, template_value FROM frp_templates WHERE job_id = ?').all(jobId) as any[];

    const filters = { from: '', attachments: 'True', subject: '' };
    filterRows.forEach(f => {
      if (f.filter_type === 'from') filters.from = f.filter_value;
      else if (f.filter_type === 'attachments') filters.attachments = f.filter_value;
      else if (f.filter_type === 'subject') filters.subject = f.filter_value;
    });

    const parsers: any = { detach_file: '.*', ignore_files: '', focus_files: '', unzip_files: false, search_by_subject: false, search_by_filename: false };
    parserRows.forEach(p => {
      if (p.parser_type === 'detach_file' || p.parser_type === 'detachfile') parsers.detach_file = p.parser_value;
      else if (p.parser_type === 'ignore_files' || p.parser_type === 'ignorefiles') parsers.ignore_files = p.parser_value;
      else if (p.parser_type === 'focus_files' || p.parser_type === 'focusfiles') parsers.focus_files = p.parser_value;
      else if (p.parser_type === 'unzip_files') parsers.unzip_files = p.parser_value === 'true' || p.parser_value === '1';
      else if (p.parser_type === 'search_by_subject') parsers.search_by_subject = p.parser_value === 'true' || p.parser_value === '1';
      else if (p.parser_type === 'search_by_filename') parsers.search_by_filename = p.parser_value === 'true' || p.parser_value === '1';
    });

    const templates = { main: '' };
    templateRows.forEach(t => {
      if (t.template_name === 'main' || t.template_name === 'Main') templates.main = t.template_value;
    });

    res.json(createSuccessResponse({
      filters,
      parsers,
      servicer_id: jobData.servicer_id || null,
      priority: jobData.priority || null,
      server_side: jobData.server_side === 1 || jobData.server_side === true,
      queue_one_file: jobData.queue_one_file === 1 || jobData.queue_one_file === true,
      templates
    }));
  } catch (error) {
    logger.error('Error fetching job config:', { error, jobId });
    if (error instanceof DatabaseError || error instanceof ValidationError || error instanceof NotFoundError) throw error;
    throw new DatabaseError(`Failed to fetch job configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
});

export const updateJobConfig = asyncHandler(async (req: Request, res: Response) => {
  const jobId = req.params.id;
  if (!jobId) throw new ValidationError('Job ID is required');
  const config = req.body;
  if (!config) throw new ValidationError('Config data is required');
  try {
    updateJobConfigInDB(jobId, config);
    res.json(createSuccessResponse(null, 'Job configuration updated successfully'));
  } catch (error) {
    logger.error('Error updating job config:', { error, jobId });
    throw new DatabaseError(`Failed to update job configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
});

export const saveDraftConfig = asyncHandler(async (req: Request, res: Response) => {
  const jobId = req.params.id;
  if (!jobId) throw new ValidationError('Job ID is required');
  const config = req.body;
  if (!config) throw new ValidationError('Config data is required');

  const db = Database.getInstance().getDb();
  try {
    if (config.isNewJob) {
      updateJobConfigInDB(jobId, config);
      res.json(createSuccessResponse(null, 'Configuration saved successfully'));
      return;
    }
    const existing = db.prepare('SELECT id FROM frp_job_config_drafts WHERE job_id = ?').get(jobId);
    if (!existing) {
      db.prepare('INSERT INTO frp_job_config_drafts (job_id, config, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(jobId, JSON.stringify(config));
    } else {
      db.prepare('UPDATE frp_job_config_drafts SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?').run(JSON.stringify(config), jobId);
    }
    res.json(createSuccessResponse(null, 'Draft configuration saved successfully'));
  } catch (error) {
    logger.error('Error saving draft config:', { error, jobId });
    throw new DatabaseError(`Failed to save draft configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
});

const updateJobConfigInDB = (jobId: string, config: any): void => {
  const db = Database.getInstance().getDb();
  db.transaction(() => {
    db.prepare(
      `UPDATE frp_mailbox_jobs SET mailbox=?, folder=?, sme_emails=?, save_location=?,
       servicer_id=?, priority=?, server_side=?, queue_one_file=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(config.mailbox, config.folder, config.sme_emails, config.save_location,
      config.servicer_id || null, config.priority || null,
      config.server_side ? 1 : 0, config.queue_one_file ? 1 : 0, jobId);

    db.prepare('DELETE FROM frp_filters WHERE job_id = ?').run(jobId);
    db.prepare('DELETE FROM frp_parsers WHERE job_id = ?').run(jobId);
    db.prepare('DELETE FROM frp_templates WHERE job_id = ?').run(jobId);

    if (config.filters) {
      if (config.filters.from) db.prepare('INSERT INTO frp_filters (job_id, filter_type, filter_value) VALUES (?, ?, ?)').run(jobId, 'from', config.filters.from);
      if (config.filters.attachments) db.prepare('INSERT INTO frp_filters (job_id, filter_type, filter_value) VALUES (?, ?, ?)').run(jobId, 'attachments', config.filters.attachments);
      if (config.filters.subject) db.prepare('INSERT INTO frp_filters (job_id, filter_type, filter_value) VALUES (?, ?, ?)').run(jobId, 'subject', config.filters.subject);
    }
    if (config.parsers) {
      if (config.parsers.detach_file) db.prepare('INSERT INTO frp_parsers (job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(jobId, 'detach_file', config.parsers.detach_file);
      if (config.parsers.ignore_files) db.prepare('INSERT INTO frp_parsers (job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(jobId, 'ignore_files', config.parsers.ignore_files);
      if (config.parsers.focus_files) db.prepare('INSERT INTO frp_parsers (job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(jobId, 'focus_files', config.parsers.focus_files);
      if (config.parsers.unzip_files !== undefined) db.prepare('INSERT INTO frp_parsers (job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(jobId, 'unzip_files', config.parsers.unzip_files ? '1' : '0');
      if (config.parsers.search_by_subject !== undefined) db.prepare('INSERT INTO frp_parsers (job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(jobId, 'search_by_subject', config.parsers.search_by_subject ? '1' : '0');
      if (config.parsers.search_by_filename !== undefined) db.prepare('INSERT INTO frp_parsers (job_id, parser_type, parser_value) VALUES (?, ?, ?)').run(jobId, 'search_by_filename', config.parsers.search_by_filename ? '1' : '0');
    }
    if (config.templates?.main) db.prepare('INSERT INTO frp_templates (job_id, template_name, template_value) VALUES (?, ?, ?)').run(jobId, 'main', config.templates.main);
  })();
};

export const commitConfig = asyncHandler(async (req: Request, res: Response) => {
  const jobId = req.params.id;
  if (!jobId) throw new ValidationError('Job ID is required');

  const db = Database.getInstance().getDb();
  try {
    const draftRow = db.prepare('SELECT config FROM frp_job_config_drafts WHERE job_id = ?').get(jobId) as any;
    if (!draftRow) throw new ValidationError('No draft configuration found for this job');
    updateJobConfigInDB(jobId, JSON.parse(draftRow.config));
    db.prepare('DELETE FROM frp_job_config_drafts WHERE job_id = ?').run(jobId);
    res.json(createSuccessResponse(null, 'Draft configuration committed successfully'));
  } catch (error) {
    logger.error('Error committing config:', { error, jobId });
    if (error instanceof ValidationError) throw error;
    throw new DatabaseError(`Failed to commit configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
});