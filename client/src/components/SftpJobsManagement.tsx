import React, { useState, useEffect } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { CompleteSftpJob } from '../types/api';
import SftpJobConfigurationEditor from './SftpJobConfigurationEditor';

const SftpJobsManagement: React.FC = () => {
  const [sftpJobs, setSftpJobs] = useState<CompleteSftpJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchColumn, setSearchColumn] = useState<'job_name' | 'path' | 'servicer_id' | 'dsn'>('job_name');
  const [showJobConfig, setShowJobConfig] = useState(false);
  const [editingJob, setEditingJob] = useState<CompleteSftpJob | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<CompleteSftpJob | null>(null);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [xmlContent, setXmlContent] = useState('');

  useEffect(() => {
    fetchSftpJobs();
  }, []);

  const fetchSftpJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/sftp-jobs?all=true');
      const result = await response.json();
      if (result.success && result.data) {
        setSftpJobs(result.data);
      } else if (Array.isArray(result)) {
        setSftpJobs(result);
      } else {
        setSftpJobs([]);
      }
    } catch (error) {
      console.error('Failed to fetch SFTP jobs:', error);
      setSftpJobs([]);
    }
    setLoading(false);
  };

  const handleCreateNewJob = () => {
    setEditingJob(null);
    setIsCloning(false);
    setShowJobConfig(true);
  };

  const handleEditJob = (job: CompleteSftpJob) => {
    setEditingJob(job);
    setIsCloning(false);
    setShowJobConfig(true);
  };

  const handleCloneJob = async (job: CompleteSftpJob) => {
    try {
      const response = await fetch(`/api/v1/sftp-jobs/${job.id}/clone`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchSftpJobs();
        alert('SFTP job cloned successfully');
      } else {
        alert('Failed to clone SFTP job');
      }
    } catch (error) {
      console.error('Error cloning SFTP job:', error);
      alert('Failed to clone SFTP job');
    }
  };

  const handleDeleteClick = (job: CompleteSftpJob) => {
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/sftp-jobs/${jobToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSftpJobs();
        setShowDeleteConfirm(false);
        setJobToDelete(null);
        alert('SFTP job deleted successfully');
      } else {
        alert('Failed to delete SFTP job');
      }
    } catch (error) {
      console.error('Error deleting SFTP job:', error);
      alert('Failed to delete SFTP job');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setJobToDelete(null);
  };

  const handleLoadFromXml = async () => {
    if (!confirm('This will load SFTP jobs from the sftp.ps1 XML file. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/sftp-jobs/load-from-xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchSftpJobs();
        alert(`Successfully loaded ${result.data.loaded_count} SFTP jobs from XML file. ${result.data.error_count} errors encountered.`);
        if (result.data.errors.length > 0) {
          console.log('Loading errors:', result.data.errors);
        }
      } else {
        alert(`Failed to load SFTP jobs: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading SFTP jobs from XML:', error);
      alert('Failed to load SFTP jobs from XML file');
    } finally {
      setLoading(false);
    }
  };

  const handleViewXml = async (job: CompleteSftpJob) => {
    try {
      const response = await fetch(`/api/v1/sftp-jobs/${job.id}/xml-preview`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setXmlContent(result.data);
        setShowXmlPreview(true);
      } else {
        alert('Failed to generate XML preview');
      }
    } catch (error) {
      console.error('Error generating XML preview:', error);
      alert('Failed to generate XML preview');
    }
  };

  const filteredJobs = sftpJobs.filter(job => {
    if (!searchText) return true;
    const value = (() => {
      if (searchColumn === 'job_name') return job.job_name || '';
      if (searchColumn === 'path') return job.path || '';
      if (searchColumn === 'servicer_id') return String(job.servicer_id ?? '');
      if (searchColumn === 'dsn') return job.dsn || '';
      return '';
    })();
    return String(value).toLowerCase().includes(searchText.toLowerCase());
  });

  const getStatusIcon = (enabled: boolean | undefined) => {
    return enabled !== false ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  return (
    <div className="p-3">
      <h1 className="text-2xl font-bold mb-3 text-text">SFTP Jobs management</h1>
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <select
            value={searchColumn}
            onChange={e => setSearchColumn(e.target.value as any)}
            className="form-input px-2 py-1 text-sm"
            aria-label="Select column to search"
          >
            <option value="job_name">SFTP Job Name</option>
            <option value="path">Path</option>
            <option value="servicer_id">Servicer ID</option>
            <option value="dsn">DSN</option>
          </select>
          <input
            type="text"
            placeholder={`Search ${searchColumn.replace('_', ' ')}...`}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="form-input w-64"
          />
          <span className="ml-2 text-sm text-textSecondary whitespace-nowrap min-w-[220px] block">
            {`Showing ${filteredJobs.length} out of ${sftpJobs.length} SFTP jobs`}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleLoadFromXml}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            title="Load SFTP jobs from sftp.ps1 XML file"
            disabled={loading}
          >
            Load from XML
          </button>
          <button
            onClick={handleCreateNewJob}
            className="btn-primary"
            title="Add new SFTP job"
          >
            Add new SFTP Job
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-2 text-textSecondary">Loading SFTP jobs...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full bg-surface">
            <thead>
              <tr className="bg-highlight">
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">SFTP Job name</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Path</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Servicer ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">DSN</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-textSecondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-surface border-border">
              {filteredJobs.length > 0
                ? filteredJobs.map((job) => (
                    <tr 
                      key={job.id} 
                      className="hover:opacity-75 transition-opacity bg-surface"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-text">
                        {job.job_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">
                        {job.path}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">
                        {job.servicer_id || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">
                        {job.dsn || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-textSecondary">
                        {getStatusIcon(job.enabled)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="px-3 py-1 text-xs rounded-md border hover:opacity-75 transition-opacity inline-flex items-center justify-center text-link border-link bg-linkBg min-h-[28px]"
                          title="Edit SFTP job"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCloneJob(job)}
                          className="px-3 py-1 text-xs rounded-md border hover:opacity-75 transition-opacity inline-flex items-center justify-center text-info border-info bg-infoBg min-h-[28px]"
                          title="Clone SFTP job"
                        >
                          Clone
                        </button>
                        <button
                          onClick={() => handleViewXml(job)}
                          className="px-3 py-1 text-xs rounded-md border hover:opacity-75 transition-opacity inline-flex items-center justify-center text-warning border-warning bg-warningBg min-h-[28px]"
                          title="View XML preview"
                        >
                          XML
                        </button>
                        <button
                          onClick={() => handleDeleteClick(job)}
                          className="px-3 py-1 text-xs rounded-md border hover:opacity-75 transition-opacity inline-flex items-center justify-center text-error border-error bg-errorBg min-h-[28px]"
                          title="Delete SFTP job"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                : (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-textSecondary">
                      {loading ? 'Loading...' : 'No SFTP jobs found'}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      )}

      {/* SFTP Job Configuration Modal (Edit/Create/Clone) */}
      {showJobConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-3xl">
            <SftpJobConfigurationEditor
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
                fetchSftpJobs();
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && jobToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 opacity-75 bg-overlay" onClick={handleDeleteCancel} />
            </div>
            <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-6 py-4 border-b bg-surface border-border">
                <h3 className="text-lg leading-6 font-medium text-text">Confirm Delete SFTP Job</h3>
              </div>
              <div className="px-6 py-4 bg-surface">
                <p className="text-sm mb-4 text-textSecondary">Are you sure you want to delete this SFTP job? This action cannot be undone.</p>
                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-sm font-medium text-text">SFTP Job name: </span>
                    <span className="text-sm ml-2 text-textSecondary">{jobToDelete.job_name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text">Path: </span>
                    <span className="text-sm ml-2 text-textSecondary">{jobToDelete.path}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text">Servicer ID: </span>
                    <span className="text-sm ml-2 text-textSecondary">{jobToDelete.servicer_id || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text">SFTP Job ID: </span>
                    <span className="text-sm ml-2 text-textSecondary">{jobToDelete.id}</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="px-4 py-2 text-sm rounded-md border hover:opacity-75 transition-opacity text-textSecondary border-border bg-surface"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 text-sm rounded-md hover:opacity-75 transition-opacity text-white bg-error"
                  >
                    Delete SFTP Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XML Preview Modal */}
      {showXmlPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-lg font-medium text-text">XML Preview</h3>
              <button
                onClick={() => setShowXmlPreview(false)}
                className="text-2xl hover:opacity-75 transition-opacity text-textSecondary"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <pre className="text-sm bg-gray-100 p-4 rounded border overflow-auto whitespace-pre-wrap">
                {xmlContent}
              </pre>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(xmlContent);
                  alert('XML copied to clipboard!');
                }}
                className="btn-primary mr-3"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowXmlPreview(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SftpJobsManagement;
