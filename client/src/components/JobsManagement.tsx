import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlusIcon, RefreshCwIcon, AlertCircleIcon, Edit2Icon, Trash2Icon, CopyIcon, FileTextIcon } from 'lucide-react';
import { CompleteJob } from '../types/api';
import { LoadingState } from '../types/api';
import JobConfigurationEditor from './JobConfigurationEditor';
import { jobsApi } from '../services/api';

// Define SearchColumn type at the top, outside the component
type SearchColumn = 'job_name' | 'mailbox' | 'folder' | 'sme_emails' | 'servicer_id';


function JobsManagement() {
  const [jobs, setJobs] = useState<CompleteJob[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState<SearchColumn>('job_name');
  // Modal and action state
  const [showJobConfig, setShowJobConfig] = useState(false);
  const [editingJob, setEditingJob] = useState<CompleteJob | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<CompleteJob | null>(null);
  const [showPreviewXML, setShowPreviewXML] = useState(false);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [previewJob, setPreviewJob] = useState<CompleteJob | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


  // Fetch jobs with improved error handling
  const fetchJobs = useCallback(async () => {
    setLoading('loading');
    try {
      const response = await fetch('/api/v1/jobs?all=true');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      // Handle API response shape: { success, data: [...] }
      if (data && Array.isArray(data.data)) {
        setJobs(data.data);
      } else if (Array.isArray(data)) {
        setJobs(data);
      } else {
        setJobs([]);
      }
      setError(null);
    } catch (err) {
      setError('Error loading Email extract Jobs');
    } finally {
      setLoading('idle');
    }
  }, []);

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);


  // Filtered jobs based on search
  const filteredJobs = useMemo(() => {
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    if (!searchTerm) return safeJobs;
    const term = searchTerm.toLowerCase();
    return safeJobs.filter(job => {
      let value: string = '';
      if (searchColumn === 'servicer_id') {
        value = job.servicer_id !== undefined && job.servicer_id !== null ? String(job.servicer_id) : '';
      } else {
        // @ts-ignore
        value = (job[searchColumn] ?? '').toString();
      }
      return value.toLowerCase().includes(term);
    });
  }, [jobs, searchTerm, searchColumn]);


  // Handler for creating a new job (placeholder)
  const handleCreateNewJob = () => {
    setEditingJob(null);
    setIsCloning(false);
    setShowJobConfig(true);
  };

  // Edit job
  const handleEditJob = (job: CompleteJob) => {
    setEditingJob(job);
    setIsCloning(false);
    setShowJobConfig(true);
  };

  // Clone job
  const handleCloneJob = (job: CompleteJob) => {
    // Remove id and clear job_name for user to enter a new name in the modal
    const clone = { ...job, id: undefined, job_name: '' };
    setEditingJob(clone as CompleteJob);
    setIsCloning(true);
    setShowJobConfig(true);
  };

  // Delete job
  const handleDeleteJob = (job: CompleteJob) => {
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete?.id) return;
    setDeleteLoading(true);
    try {
      await jobsApi.deleteJob(jobToDelete.id);
      setShowDeleteConfirm(false);
      setJobToDelete(null);
      fetchJobs();
    } catch (e) {
      alert('Failed to delete Email extract Job');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Preview XML (generate XML from job object)
  const handlePreviewXML = (job: CompleteJob) => {
    setPreviewJob(job);
    setShowPreviewXML(true);
    setXmlContent(generateJobXML(job));
  };

  // Helper to generate XML from job object
  function generateJobXML(job: CompleteJob): string {
    // Escape XML special characters
    const esc = (str: any) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    // Helper to check if a value is blank (empty string, null, or undefined)
    const isBlank = (val: any) => val === undefined || val === null || (typeof val === 'string' && val.trim() === '');

    // Use job name as the root tag, fallback to 'Email extract Job' if name is blank
    const rootTag = !isBlank(job.job_name) ? esc(job.job_name) : 'EmailExtractJob';
    let xml = `<${rootTag}>\n`;
    
    // Order matches PowerShell outlook.ps1 configuration (lines 239-275)
    if (!isBlank(job.mailbox)) xml += `  <Mailbox>${esc(job.mailbox)}</Mailbox>\n`;
    if (!isBlank(job.folder)) xml += `  <Folder>${esc(job.folder)}</Folder>\n`;
    if (!isBlank(job.sme_emails)) xml += `  <SME>${esc(job.sme_emails)}</SME>\n`;
    if (!isBlank(job.last_email)) xml += `  <LastEmail>${esc(job.last_email)}</LastEmail>\n`;
    if (!isBlank(job.save_location)) xml += `  <SaveLocation>${esc(job.save_location)}</SaveLocation>\n`;
    
    // Filters
    if (Array.isArray(job.filters) && job.filters.length > 0) {
      const filterTags = job.filters
        .filter(f => f && !isBlank(f.filter_type) && !isBlank(f.filter_value))
        .map(f => {
          if (f.filter_type === 'from') {
            return `    <From>${esc(f.filter_value)}</From>\n`;
          } else if (f.filter_type === 'attachments') {
            return `    <Attachments>${esc(f.filter_value)}</Attachments>\n`;
          } else if (f.filter_type === 'subject') {
            return `    <Subject>${esc(f.filter_value)}</Subject>\n`;
          }
          return '';
        })
        .join('');
      if (filterTags) {
        xml += `  <Filters>\n${filterTags}  </Filters>\n`;
      }
    }
    
    // Parsers
    if (Array.isArray(job.parsers) && job.parsers.length > 0) {
      const parserTags = job.parsers
        .filter(p => p && !isBlank(p.parser_type) && !isBlank(p.parser_value))
        .map(p => {
          // Handle both formats: 'detach_file_subject' and 'detachfilesubject'
          if (p.parser_type === 'detach_file_subject' || (p.parser_type as string) === 'detachfilesubject') {
            return `    <DetachFileSubject>${esc(p.parser_value)}</DetachFileSubject>\n`;
          } else if (p.parser_type === 'detach_file' || p.parser_type === 'detachfile') {
            return `    <DetachFile>${esc(p.parser_value)}</DetachFile>\n`;
          }
          return '';
        })
        .join('');
      if (parserTags) {
        xml += `  <Parsers>\n${parserTags}  </Parsers>\n`;
      }
    }
    
    // ServicerID, QueueOneFile and other properties
    if (!isBlank(job.servicer_id)) xml += `  <ServicerID>${esc(job.servicer_id)}</ServicerID>\n`;
    if (job.queue_one_file !== undefined && job.queue_one_file !== null) xml += `  <QueueOneFile>${job.queue_one_file ? 'True' : 'False'}</QueueOneFile>\n`;
    
    // Additional properties (conditional logic)
    // Priority: Only show if not blank and not 0
    if (!isBlank(job.priority) && String(job.priority) !== '0') {
      xml += `  <Priority>${esc(job.priority)}</Priority>\n`;
    }
    
    // ServerSide: Only show if true
    if (job.server_side === true) {
      xml += `  <ServerSide>true</ServerSide>\n`;
    }
    
    // Templates
    if (Array.isArray(job.templates) && job.templates.length > 0) {
      const templateTags = job.templates
        .filter(t => t && !isBlank(t.template_name) && !isBlank(t.template_value))
        .map(t => `    <${esc(t.template_name)}>${esc(t.template_value)}</${esc(t.template_name)}>\n`)
        .join('');
      if (templateTags) {
        xml += `  <Templates>\n${templateTags}  </Templates>\n`;
      }
    }
    xml += `</${rootTag}>`;
    return xml;
  }

  return (
    <div className="p-3">
      {/* Error Display */}
      {error && (
        <div className="mb-3 p-2 rounded-lg border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center">
            <AlertCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
            <button
              className="ml-auto text-red-600 hover:text-red-800 text-sm underline"
              onClick={fetchJobs}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Email extract Jobs management</h1>
          <p className="mt-1 text-sm text-textSecondary">
            Manage email monitoring jobs and their configurations
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchJobs}
            className="btn-secondary"
            disabled={loading === 'loading'}
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleCreateNewJob}
            className="btn-primary"
          >
            Add new Email extract Job
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <select
            value={searchColumn}
            onChange={e => setSearchColumn(e.target.value as SearchColumn)}
            className="form-input px-2 py-1 text-sm"
            aria-label="Select column to search"
          >
            <option value="job_name">Email extract Job Name</option>
            <option value="mailbox">Mailbox</option>
            <option value="folder">Folder</option>
            <option value="sme_emails">SME Emails</option>
            <option value="servicer_id">Servicer ID</option>
          </select>
          <input
            type="text"
            placeholder={`Search ${searchColumn.replace('_', ' ')}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input w-64"
          />
          <span className="ml-2 text-sm text-textSecondary whitespace-nowrap min-w-[220px] block deal-count-tabular">
            {`Showing ${filteredJobs.length} out of ${jobs.length} Email extract Jobs`}
          </span>
        </div>
      </div>

      {/* Jobs Table */}
      {loading === 'loading' ? (
        <div className="text-center py-8 text-textSecondary">
          <RefreshCwIcon className="h-8 w-8 mx-auto mb-2 animate-spin" />
          Loading Email extract Jobs...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full bg-surface">
            <thead>
              <tr className="bg-highlight">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Email extract Job name</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Servicer ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Mailbox</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Folder</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Status</th>
                <th className="px-3 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Last email</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-surface">
      {filteredJobs.map((job) => (
        <tr key={job.id} className="bg-surface hover:bg-highlight transition-colors">
          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-text">{job.job_name || '-'}</td>
          <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">{job.servicer_id ?? '-'}</td>
          <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">{job.mailbox}</td>
          <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">{job.folder}</td>
          <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">{job.enabled ? 'Enabled' : 'Disabled'}</td>
          <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">{typeof job.last_email === 'string' ? job.last_email : (job.last_email ? job.last_email.toString() : '-')}</td>
          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium flex gap-2">
            {/* Edit Button */}
            <button
              className="action-btn bg-surface border border-border hover:bg-highlight text-primary rounded p-1 transition-colors"
              title="Edit Email extract Job"
              onClick={() => handleEditJob(job)}
            >
              <Edit2Icon className="w-4 h-4" />
            </button>
            {/* Delete Button */}
            <button
              className="action-btn bg-surface border border-border hover:bg-red-100 text-red-600 rounded p-1 transition-colors"
              title="Delete Email extract Job"
              onClick={() => handleDeleteJob(job)}
            >
              <Trash2Icon className="w-4 h-4" />
            </button>
            {/* Clone Button */}
            <button
              className="action-btn bg-surface border border-border hover:bg-highlight text-purple-600 rounded p-1 transition-colors"
              title="Clone Email extract Job"
              onClick={() => handleCloneJob(job)}
            >
              <CopyIcon className="w-4 h-4" />
            </button>
            {/* Preview XML Button */}
            <button
              className="action-btn bg-surface border border-border hover:bg-highlight text-blue-600 rounded p-1 transition-colors"
              title="Preview XML"
              onClick={() => handlePreviewXML(job)}
            >
              <FileTextIcon className="w-4 h-4" />
            </button>
          </td>
        </tr>
      ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Job Configuration Modal (Edit/Create/Clone) */}
      {showJobConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-3xl">
            <JobConfigurationEditor
              job={editingJob}
              onClose={() => {
                setShowJobConfig(false);
                setEditingJob(null);
                setIsCloning(false);
              }}
              onSave={() => {
                setShowJobConfig(false);
                setEditingJob(null);
                setIsCloning(false);
                fetchJobs();
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2 text-text">Confirm Delete Email extract Job</h3>
            <p className="text-sm mb-4 text-textSecondary">Are you sure you want to delete this Email extract Job? This action cannot be undone.</p>
            <div className="space-y-2 mb-4">
              <div><span className="font-medium">Email extract Job name:</span> <span className="ml-2">{jobToDelete.job_name}</span></div>
              <div><span className="font-medium">Mailbox:</span> <span className="ml-2">{jobToDelete.mailbox}</span></div>
              <div><span className="font-medium">Folder:</span> <span className="ml-2">{jobToDelete.folder}</span></div>
              <div><span className="font-medium">Servicer ID:</span> <span className="ml-2">{jobToDelete.servicer_id ?? '-'}</span></div>
              <div><span className="font-medium">Status:</span> <span className="ml-2">{jobToDelete.enabled ? 'Enabled' : 'Disabled'}</span></div>
              <div><span className="font-medium">Last email:</span> <span className="ml-2">{typeof jobToDelete.last_email === 'string' ? jobToDelete.last_email : (jobToDelete.last_email ? jobToDelete.last_email.toString() : '-')}</span></div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setJobToDelete(null); }}
                className="btn-secondary"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteJob}
                className="btn-primary bg-error text-white"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Email extract Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview XML Slide-Out Modal */}
      {showPreviewXML && previewJob && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity" onClick={() => { setShowPreviewXML(false); setPreviewJob(null); setXmlContent(''); }} />
          {/* Slide-out panel */}
          <div
            className="fixed top-0 right-0 z-50 h-full w-full max-w-4xl bg-white shadow-2xl border-l border-border flex flex-col animate-slide-in-right"
            style={{ minWidth: '800px' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-xl font-bold text-text">Preview XML for: {previewJob.job_name}</h3>
              <button
                onClick={() => { setShowPreviewXML(false); setPreviewJob(null); setXmlContent(''); }}
                className="btn-secondary text-lg"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto min-h-[400px] max-h-[calc(100vh-120px)] whitespace-pre text-text font-mono">
                {xmlContent || 'Loading XML...'}
              </pre>
            </div>
          </div>
          {/* Slide-in animation */}
          <style>{`
            @keyframes slide-in-right {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slide-in-right {
              animation: slide-in-right 0.3s cubic-bezier(0.4,0,0.2,1);
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default JobsManagement;