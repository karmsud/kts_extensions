export interface MailboxJob {
  id?: number;
  job_name: string;
  mailbox: string;
  folder: string;
  sme_emails?: string;
  last_email?: Date;
  save_location?: string;
  enabled?: boolean;
  servicer_id?: number;
  priority?: number;
  server_side?: boolean;
  queue_one_file?: boolean;
  day_adjust?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Re-export API response interfaces
export * from './responses';

export interface SftpJob {
  id?: number;
  job_name: string;
  path: string;
  servicer_id?: number;
  dsn?: string;
  sme_emails?: string;
  save_location?: string;
  skip_list?: string;
  ignore_list?: string;
  zip_content_filter?: string;
  day_adjust?: number;
  enabled?: boolean;
  created_at?: Date;
  updated_at?: Date;
  parsers?: SftpJobParser[];
  templates?: SftpJobTemplate[];
}

export interface SftpJobParser {
  id?: number;
  job_id?: number;
  parser_type: 'MoveFile' | 'MoveFile2';
  parser_value: string;
}

export interface SftpJobTemplate {
  id?: number;
  job_id?: number;
  template_name: string;
  template_value?: string;
}

export interface JobFilter {
  id?: number;
  job_id?: number;
  filter_type: 'from' | 'subject' | 'attachments';
  filter_value: string;
}

export interface JobParser {
  id?: number;
  job_id?: number;
  parser_type: 'detach_file' | 'detach_file_subject';
  parser_value: string;
}

export interface JobTemplate {
  id?: number;
  job_id?: number;
  template_name: string;
  template_value?: string;
}

export interface Deal {
  id?: number;
  item_id?: number;
  deal_name: string;
  keyword: string;
  servicer_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ScriptVersion {
  id?: number;
  version_number: number;
  file_path: string;
  created_by?: string;
  created_at?: Date;
  description?: string;
  is_active?: boolean;
}

export interface CompleteJob extends MailboxJob {
  filters: JobFilter[];
  parsers: JobParser[];
  templates: JobTemplate[];
}

export interface CompleteSftpJob extends SftpJob {
  parsers: SftpJobParser[];
  templates: SftpJobTemplate[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 