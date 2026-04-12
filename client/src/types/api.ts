export interface MailboxJob {
  id?: number;
  job_name: string;
  mailbox: string;
  folder: string;
  sme_emails?: string;
  last_email?: Date | string;
  save_location?: string;
  enabled?: boolean;
  servicer_id?: number;
  priority?: number;
  server_side?: boolean;
  queue_one_file?: boolean;
  day_adjust?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
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
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface DealWithJobNames extends Deal {
  job_names?: string;
  job_type?: 'email' | 'sftp' | 'both' | 'none';
  job_details?: Array<{
    id: number;
    name: string;
    type: 'email' | 'sftp';
  }>;
}

export interface CompleteJob extends MailboxJob {
  filters: JobFilter[];
  parsers: JobParser[];
  templates: JobTemplate[];
}

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
  created_at?: Date | string;
  updated_at?: Date | string;
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

export interface CompleteSftpJob extends SftpJob {
  parsers: SftpJobParser[];
  templates: SftpJobTemplate[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
  path?: string;
  method?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DealStats {
  totalDeals: number;
  uniqueServicers: number;
  topKeywords: Array<{ keyword: string; count: number }>;
}

// Enhanced error response type
export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
  timestamp: string;
  path: string;
  method: string;
  stack?: string; // Only in development
}

// API request options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Generic async operation state
export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
  lastUpdated?: Date;
}

// Paginated data with enhanced functionality
export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 