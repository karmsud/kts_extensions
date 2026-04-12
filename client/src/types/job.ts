export interface Job {
  id: number;
  job_name: string;
  status: 'active' | 'inactive';
  mailbox: string;
  folder: string;
  sme_emails: string;
  last_email?: string;
  save_location: string;
  
  // Filters configuration
  filters: {
    from?: string;
    attachments?: string | boolean;
    subject?: string;
  };
  
  // Parsers configuration  
  parsers: {
    detach_file?: string;
    detach_file_subject?: string;
    ignore_files?: string;
    focus_files?: string;
    unzip_files?: boolean;
    search_by_subject?: boolean;
    search_by_filename?: boolean;
  };
  
  // Optional configuration
  servicer_id?: number;
  priority?: number;
  server_side?: boolean;
  queue_one_file?: boolean;
  
  // Templates configuration
  templates?: {
    main?: string;
    [key: string]: string | undefined;
  };
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

export interface JobConfigDraft {
  job_id: number;
  config: Job;
  created_at: string;
  updated_at: string;
} 