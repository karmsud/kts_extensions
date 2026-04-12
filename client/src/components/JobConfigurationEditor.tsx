import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { CompleteJob } from '../types/api';
import TooltipHelper from './TooltipHelper';

interface Props {
  job: CompleteJob | null;
  onClose: () => void;
  onSave: () => void;
}

// Helper function to convert CompleteJob to Job format for editing
const convertCompleteJobToJob = (completeJob: CompleteJob | null): Job | null => {
  if (!completeJob) return null;
  
  return {
    id: completeJob.id || 0,
    job_name: completeJob.job_name,
    status: completeJob.enabled !== false ? 'active' : 'inactive',
    mailbox: completeJob.mailbox,
    folder: completeJob.folder,
    sme_emails: completeJob.sme_emails || '',
    last_email: typeof completeJob.last_email === 'string' ? completeJob.last_email : completeJob.last_email?.toISOString(),
    save_location: completeJob.save_location || '',
    filters: {
      from: completeJob.filters?.find(f => f.filter_type === 'from')?.filter_value,
      attachments: completeJob.filters?.find(f => f.filter_type === 'attachments')?.filter_value,
      subject: completeJob.filters?.find(f => f.filter_type === 'subject')?.filter_value
    },
    parsers: {
      detach_file: completeJob.parsers?.find(p => p.parser_type === 'detach_file')?.parser_value,
      detach_file_subject: completeJob.parsers?.find(p => p.parser_type === 'detach_file_subject')?.parser_value,
      search_by_subject: completeJob.parsers?.some(p => p.parser_type === 'detach_file_subject'),
      search_by_filename: completeJob.parsers?.some(p => p.parser_type === 'detach_file')
    },
    templates: {
      main: completeJob.templates?.find(t => t.template_name === 'main')?.template_value
    },
    servicer_id: completeJob.servicer_id,
    priority: completeJob.priority,
    server_side: completeJob.server_side,
    queue_one_file: completeJob.queue_one_file,
    created_at: typeof completeJob.created_at === 'string' ? completeJob.created_at : completeJob.created_at?.toISOString(),
    updated_at: typeof completeJob.updated_at === 'string' ? completeJob.updated_at : completeJob.updated_at?.toISOString()
  } as Job;
};

const JobConfigurationEditor: React.FC<Props> = ({ job, onClose, onSave }) => {
  const convertedJob = convertCompleteJobToJob(job);
  const [config, setConfig] = useState<Job>(convertedJob || {
    id: 0,
    job_name: '',
    mailbox: 'reports@example.com',
    folder: 'Inbox',
    status: 'active',
    sme_emails: '',
    save_location: '',
    servicer_id: Math.floor(Math.random() * 9000) + 1000, // Auto-generate 4-digit number
    priority: 0,
    server_side: false,
    queue_one_file: false,
    filters: {
      from: '',
      attachments: 'True',
      subject: ''
    },
    parsers: {
      detach_file: '.*',
      ignore_files: '',
      focus_files: '',
      unzip_files: true,
      search_by_subject: true,
      search_by_filename: false
    },
    templates: {
      main: ''
    }
  } as Job);
  const [isDirty, setIsDirty] = useState(!job); // New jobs start as dirty
  const [loading, setLoading] = useState(false);
  const [showCommitOptions, setShowCommitOptions] = useState(false);
  const [searchMethod, setSearchMethod] = useState<'subject' | 'filename'>('subject');
  const isNewJob = !job;

  useEffect(() => {
    if (job?.id) {
      fetchJobConfig();
    }
  }, [job?.id]);

  useEffect(() => {
    // Set initial search method based on existing config or default for new jobs
    if (config.parsers?.search_by_subject) {
      setSearchMethod('subject');
    } else if (config.parsers?.search_by_filename) {
      setSearchMethod('filename');
    } else {
      // Default to subject search
      setSearchMethod('subject');
    }
  }, [config.parsers?.search_by_subject, config.parsers?.search_by_filename]);

  const fetchJobConfig = async () => {
    if (!job?.id) return;
    
    try {
      const response = await fetch(`/api/v1/jobs/${job!.id}/config`);
      if (response.ok) {
        const result = await response.json();
        // Clean up old field that was removed
        if (result.parsers?.detach_file_subject) {
          delete result.parsers.detach_file_subject;
        }
        setConfig({ ...job, ...result });
      }
    } catch (error) {
      console.error('Failed to fetch job config:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    const keys = field.split('.');
    const newConfig = { ...config };
    
    if (keys.length === 1) {
      (newConfig as any)[keys[0]] = value;
    } else if (keys.length === 2) {
      if (!(newConfig as any)[keys[0]]) {
        (newConfig as any)[keys[0]] = {};
      }
      (newConfig as any)[keys[0]][keys[1]] = value;
    }
    
    setConfig(newConfig);
    setIsDirty(true);
  };

  const handleSearchMethodChange = (method: 'subject' | 'filename') => {
    setSearchMethod(method);
    
    // Update config to reflect the radio button selection
    const newConfig = { ...config };
    if (!newConfig.parsers) newConfig.parsers = {};
    
    if (method === 'subject') {
      newConfig.parsers.search_by_subject = true;
      newConfig.parsers.search_by_filename = false;
    } else {
      newConfig.parsers.search_by_subject = false;
      newConfig.parsers.search_by_filename = true;
    }
    
    setConfig(newConfig);
    setIsDirty(true);
  };

  const handleSoftSave = async () => {
    // Validation
    if (!config.job_name?.trim()) {
      alert('Job name is required');
      setLoading(false);
      return;
    }
    
    if (!config.mailbox?.trim()) {
      alert('Mailbox is required');
      setLoading(false);
      return;
    }
    
    // Email validation for mailbox
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.mailbox)) {
      alert('Please enter a valid email address for mailbox');
      setLoading(false);
      return;
    }
    
    if (!config.folder?.trim()) {
      alert('Folder is required');
      setLoading(false);
      return;
    }
    
    if (!config.save_location?.trim()) {
      alert('File save location is required');
      setLoading(false);
      return;
    }
    
    // SME emails validation (if provided, must be valid emails separated by commas)
    if (config.sme_emails?.trim()) {
      const smeEmails = config.sme_emails.split(',').map(email => email.trim());
      for (const email of smeEmails) {
        if (email && !emailRegex.test(email)) {
          alert(`Invalid email address in SME emails: ${email}`);
          setLoading(false);
          return;
        }
      }
    }
    
    setLoading(true);
    try {
      if (isNewJob) {
        // For new jobs, create the job first
        const response = await fetch('/api/v1/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          alert('Job created successfully');
          setIsDirty(false);
          onSave();
        } else {
          alert('Failed to create job');
        }
      } else {
        const response = await fetch(`/api/v1/jobs/${job?.id}/config/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          alert('Configuration saved as draft');
          setIsDirty(false);
          setShowCommitOptions(true);
        } else {
          alert('Failed to save draft');
        }
      }
    } catch (error) {
      alert(isNewJob ? 'Failed to create job' : 'Failed to save draft');
    }
    setLoading(false);
  };

  const handleCommit = async (action: 'update' | 'deploy') => {
    if (!job?.id) return; // Can't commit if no job ID
    
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/jobs/${job!.id}/config/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, config }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Configuration ${action === 'deploy' ? 'deployed' : 'updated'} successfully`);
        setShowCommitOptions(false);
        setIsDirty(false);
        onSave();
      } else {
        alert(`Failed to ${action} configuration`);
      }
    } catch (error) {
      alert(`Failed to ${action} configuration`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div 
        className="relative top-4 mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md mb-8"
        style={{ 
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            {isNewJob ? 'Create new Email extract Job' : `Configure job: ${job?.job_name}`}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-75 transition-opacity"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Configuration */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--color-highlight)' }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-text)' }}
            >
              Basic configuration
            </h3>
            
            <div className="space-y-4">
              {/* Editable Job Name */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Job Name <span className="text-red-500">*</span>
                  <TooltipHelper
                    text="A unique name for this job."
                    examples={['Daily Report Job', 'Servicer 123 Monitor', 'Weekly Processing']}
                  />
                </label>
                <input
                  type="text"
                  value={config.job_name || ''}
                  onChange={e => handleChange('job_name', e.target.value)}
                  className="form-input w-full"
                  placeholder="Enter job name"
                  required
                />
              </div>
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Mailbox <span className="text-red-500">*</span>
                  <TooltipHelper
                    text="The email address that this job will monitor for incoming emails"
                    examples={['reports@example.com', 'deals@company.com', 'processing@bank.com']}
                  />
                </label>
                <input
                  type="email"
                  value={config.mailbox || ''}
                  onChange={(e) => handleChange('mailbox', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., reports@example.com"
                  required
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Folder <span className="text-red-500">*</span>
                  <TooltipHelper
                    text="The specific email folder to monitor within the mailbox"
                    examples={['Inbox', 'Mid Monthly', 'Weekly Reports', 'Processing']}
                  />
                </label>
                <input
                  type="text"
                  value={config.folder || ''}
                  onChange={(e) => handleChange('folder', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., Inbox, Mid Monthly"
                  required
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  SME Emails
                  <TooltipHelper
                    text="Subject Matter Expert email addresses that will receive notifications and updates about this job's processing"
                    examples={['john.doe@company.com,jane.smith@company.com', 'team-lead@bank.com', 'manager@company.com']}
                  />
                </label>
                <input
                  type="text"
                  value={config.sme_emails || ''}
                  onChange={(e) => handleChange('sme_emails', e.target.value)}
                  className="form-input w-full"
                  placeholder="email1@domain.com,email2@domain.com"
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  File save location <span className="text-red-500">*</span>
                  <TooltipHelper
                    text="The network path or directory where processed files will be saved"
                    examples={['S:\\Deals\\COOF Information\\...', 'C:\\ProcessedFiles\\', '\\\\server\\share\\folder']}
                  />
                </label>
                <input
                  type="text"
                  value={config.save_location || ''}
                  onChange={(e) => handleChange('save_location', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., S:\Deals\COOF Information\..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="flex items-center gap-2 text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Servicer ID (auto-generated)
                    <TooltipHelper
                      text="Optional numerical identifier for the servicer associated with this job"
                      examples={['123', '456', '789']}
                    />
                  </label>
                                  <input
                  type="number"
                  value={config.servicer_id || ''}
                  onChange={(e) => handleChange('servicer_id', parseInt(e.target.value) || undefined)}
                  className="form-input w-full bg-gray-100"
                  placeholder="Auto-generated"
                  disabled={isNewJob}
                />
                </div>

                <div>
                  <label 
                    className="flex items-center gap-2 text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Priority level
                    <TooltipHelper
                      text="Processing priority for this job. Lower numbers = higher priority"
                      examples={['1 (Highest)', '5 (Normal)', '10 (Lowest)']}
                    />
                  </label>
                  <input
                    type="number"
                    value={config.priority ?? 0}
                    onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                    className="form-input w-full"
                    placeholder="Default: 0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Configuration */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--color-highlight)' }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-text)' }}
            >
              Email filters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  From (email/domain)
                  <TooltipHelper
                    text="Filter emails by sender address or domain. Only emails from these sources will be processed"
                    examples={['@sba.gov', 'fta@sba.gov', 'sender@company.com', '@bank.com']}
                  />
                </label>
                <input
                  type="text"
                  value={config.filters?.from || ''}
                  onChange={(e) => handleChange('filters.from', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., @sba.gov, fta@sba.gov"
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Attachments filter
                  <TooltipHelper
                    text="Filter emails based on attachment requirements. Use 'True' to require attachments, 'False' for no attachments, or regex patterns for specific file types"
                    examples={['True', 'False', '*.pdf', '*.xls*', '\\.(pdf|xlsx?)$']}
                  />
                </label>
                <input
                  type="text"
                  value={config.filters?.attachments?.toString() || ''}
                  onChange={(e) => handleChange('filters.attachments', e.target.value)}
                  className="form-input w-full"
                  placeholder="True, False, or regex pattern"
                />
              </div>

              {/* Search Method Radio Buttons */}
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-3"
                  style={{ color: 'var(--color-text)' }}
                >
                  Deal matching method
                  <TooltipHelper
                    text="Choose how to match emails to deals or processes. You can search either by email subject keywords or by attachment filenames, but not both"
                    examples={['Subject: Use email subject line keywords', 'Filename: Use attachment filename patterns']}
                  />
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="searchMethod"
                      value="subject"
                      checked={searchMethod === 'subject'}
                      onChange={() => handleSearchMethodChange('subject')}
                      className="rounded"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span 
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Search by email subject keyword
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="searchMethod"
                      value="filename"
                      checked={searchMethod === 'filename'}
                      onChange={() => handleSearchMethodChange('filename')}
                      className="rounded"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span 
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Search by filename keyword
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Parsers Configuration */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--color-highlight)' }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-text)' }}
            >
              File processing & extraction
            </h3>
            
            <div className="space-y-4">
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Filename keyword
                  <TooltipHelper
                    text="Pattern to specify which files to extract from email attachments. Use .* for all files or specific patterns"
                    examples={['.*', '*.pdf', '*.xls*', '\\.(pdf|xlsx?)$', 'Report*.pdf']}
                  />
                </label>
                <input
                  type="text"
                  value={config.parsers?.detach_file || ''}
                  onChange={(e) => handleChange('parsers.detach_file', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., .*, *.pdf, *.xls"
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Ignore files pattern
                  <TooltipHelper
                    text="Pattern to specify which files to ignore during processing. These files will not be extracted or processed"
                    examples={['*.tmp', '*.log', 'temp*.*', '\\.(exe|bat)$']}
                  />
                </label>
                <input
                  type="text"
                  value={config.parsers?.ignore_files || ''}
                  onChange={(e) => handleChange('parsers.ignore_files', e.target.value)}
                  className="form-input w-full"
                  placeholder="Files to ignore"
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Focus files pattern
                  <TooltipHelper
                    text="When specified, only files matching this pattern will be processed. All other files will be ignored"
                    examples={['Data*.xlsx', '*.pdf', 'Report_\\d{8}\\.pdf', 'Final*.*']}
                  />
                </label>
                <input
                  type="text"
                  value={config.parsers?.focus_files || ''}
                  onChange={(e) => handleChange('parsers.focus_files', e.target.value)}
                  className="form-input w-full"
                  placeholder="Only process these files"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.parsers?.unzip_files || false}
                    onChange={(e) => handleChange('parsers.unzip_files', e.target.checked)}
                    className="rounded"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Extract ZIP files after processing
                  </span>
                  <TooltipHelper
                    text="Automatically extract ZIP archive files after they are saved to the storage location"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--color-highlight)' }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--color-text)' }}
            >
              Advanced options
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.queue_one_file || false}
                    onChange={(e) => handleChange('queue_one_file', e.target.checked)}
                    className="rounded"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Queue one file only
                  </span>
                  <TooltipHelper
                    text="Limit queueing to only one file per email. Useful for emails with multiple attachments where only one should be queued"
                  />
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.server_side || false}
                    onChange={(e) => handleChange('server_side', e.target.checked)}
                    className="rounded"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Server side processing
                  </span>
                  <TooltipHelper
                    text="Enable server-side processing for this job. Processing will happen on the server rather than locally"
                  />
                </label>
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Scrubber to queue
                  <TooltipHelper
                    text="List the scrubbingDB scrubber template to queue"
                    examples={['QueueCMBS_Scrubber_x', 'StandardProcessor', 'DealTemplate_v2']}
                  />
                </label>
                <input
                  type="text"
                  value={config.templates?.main || ''}
                  onChange={(e) => handleChange('templates.main', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., QueueCMBS_Scrubber_x"
                />
              </div>


            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          className="mt-8 border-t pt-6"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex justify-between items-center">
            <div>
              {isDirty && (
                <span 
                  className="text-sm flex items-center gap-2"
                  style={{ color: '#EA580C' }}
                >
                  ⚠ You have unsaved changes
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSoftSave}
                disabled={!isDirty || loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : (isNewJob ? 'Create Email extract Job' : 'Save Configuration')}
              </button>
              
              {showCommitOptions && !isNewJob && (
                <>
                  <button
                    onClick={() => handleCommit('update')}
                    disabled={loading}
                    className="px-4 py-2 text-white rounded-md hover:opacity-75 disabled:opacity-50 transition-opacity"
                    style={{ backgroundColor: '#059669' }}
                  >
                    Update Database
                  </button>
                  
                  <button
                    onClick={() => handleCommit('deploy')}
                    disabled={loading}
                    className="px-4 py-2 text-white rounded-md hover:opacity-75 disabled:opacity-50 transition-opacity"
                    style={{ backgroundColor: '#DC2626' }}
                  >
                    Deploy & Update Script
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobConfigurationEditor; 