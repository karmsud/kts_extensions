import React, { useState, useEffect } from 'react';
import { CompleteSftpJob } from '../types/api';

interface TooltipHelperProps {
  text: string;
  examples?: string[];
}

const TooltipHelper: React.FC<TooltipHelperProps> = ({ text, examples }) => (
  <span className="relative group cursor-pointer">
    <span className="text-blue-500 text-sm">ℹ</span>
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg max-w-xs">
      <div className="font-medium mb-1">{text}</div>
      {examples && examples.length > 0 && (
        <div className="text-gray-300">
          <div className="font-medium">Examples:</div>
          {examples.map((example, idx) => (
            <div key={idx}>• {example}</div>
          ))}
        </div>
      )}
    </div>
  </span>
);

interface SftpJobConfigurationEditorProps {
  job: CompleteSftpJob | null;
  onClose: () => void;
  onSave: () => void;
}

const convertToSftpJobFormat = (completeSftpJob: CompleteSftpJob): CompleteSftpJob => ({
  id: completeSftpJob.id,
  job_name: completeSftpJob.job_name,
  path: completeSftpJob.path,
  servicer_id: completeSftpJob.servicer_id,
  dsn: completeSftpJob.dsn,
  sme_emails: completeSftpJob.sme_emails,
  save_location: completeSftpJob.save_location,
  skip_list: completeSftpJob.skip_list,
  ignore_list: completeSftpJob.ignore_list,
  zip_content_filter: completeSftpJob.zip_content_filter,
  day_adjust: completeSftpJob.day_adjust,
  enabled: completeSftpJob.enabled,
  created_at: typeof completeSftpJob.created_at === 'string' ? completeSftpJob.created_at : completeSftpJob.created_at?.toISOString(),
  updated_at: typeof completeSftpJob.updated_at === 'string' ? completeSftpJob.updated_at : completeSftpJob.updated_at?.toISOString(),
  parsers: completeSftpJob.parsers,
  templates: completeSftpJob.templates
});

const SftpJobConfigurationEditor: React.FC<SftpJobConfigurationEditorProps> = ({ job, onClose, onSave }) => {
  const isNewJob = !job;
  const convertedJob = job ? convertToSftpJobFormat(job) : null;

  const [config, setConfig] = useState<CompleteSftpJob>(convertedJob || {
    id: 0,
    job_name: '',
    path: '',
    servicer_id: undefined,
    dsn: '',
    sme_emails: '',
    save_location: '',
    skip_list: 'N:\\Automation\\BV_Script\\Settings\\SkipListOCW.txt',
    ignore_list: 'N:\\Automation\\BV_Script\\Settings\\IgnoreListOCW.txt',
    zip_content_filter: '.*',
    day_adjust: 0,
    enabled: true,
    parsers: [{ parser_type: 'MoveFile', parser_value: '.*' }],
    templates: []
  });

  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (job) {
      setConfig(convertToSftpJobFormat(job));
    }
  }, [job]);

  const handleChange = (path: string, value: any) => {
    setConfig((prevConfig: CompleteSftpJob) => {
      const newConfig = { ...prevConfig };
      const keys = path.split('.');
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
    setIsDirty(true);
  };

  const handleParserChange = (index: number, field: 'parser_type' | 'parser_value', value: string) => {
    const newParsers = [...(config.parsers || [])];
    newParsers[index] = { ...newParsers[index], [field]: value };
    handleChange('parsers', newParsers);
  };

  const addParser = () => {
    const newParsers = [...(config.parsers || [])];
    newParsers.push({ parser_type: 'MoveFile', parser_value: '.*' });
    handleChange('parsers', newParsers);
  };

  const removeParser = (index: number) => {
    const newParsers = [...(config.parsers || [])];
    newParsers.splice(index, 1);
    handleChange('parsers', newParsers);
  };

  const handleTemplateChange = (index: number, field: 'template_name' | 'template_value', value: string) => {
    const newTemplates = [...(config.templates || [])];
    newTemplates[index] = { ...newTemplates[index], [field]: value };
    handleChange('templates', newTemplates);
  };

  const addTemplate = () => {
    const newTemplates = [...(config.templates || [])];
    newTemplates.push({ template_name: 'Main', template_value: '' });
    handleChange('templates', newTemplates);
  };

  const removeTemplate = (index: number) => {
    const newTemplates = [...(config.templates || [])];
    newTemplates.splice(index, 1);
    handleChange('templates', newTemplates);
  };

  const handleSoftSave = async () => {
    // Validation
    if (!config.job_name?.trim()) {
      alert('SFTP Job name is required');
      setLoading(false);
      return;
    }
    
    if (!config.path?.trim()) {
      alert('Path is required');
      setLoading(false);
      return;
    }
    
    if (!config.save_location?.trim()) {
      alert('Save location is required');
      setLoading(false);
      return;
    }
    
    // SME emails validation (if provided, must be valid emails separated by commas)
    if (config.sme_emails?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const smeEmails = config.sme_emails.split(',').map((email: string) => email.trim());
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
        const response = await fetch('/api/v1/sftp-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          alert('SFTP Job created successfully');
          setIsDirty(false);
          onSave();
        } else {
          alert('Failed to create SFTP job');
        }
      } else {
        const response = await fetch(`/api/v1/sftp-jobs/${job?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          alert('SFTP Job updated successfully');
          setIsDirty(false);
          onSave();
        } else {
          alert('Failed to update SFTP job');
        }
      }
    } catch (error) {
      console.error('Error saving SFTP job:', error);
      alert(isNewJob ? 'Failed to create SFTP job' : 'Failed to update SFTP job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg w-full h-full max-h-[90vh] overflow-y-auto"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div 
        className="sticky top-0 z-10 p-4 border-b"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            {isNewJob ? 'Create new SFTP Job' : `Configure SFTP job: ${job?.job_name}`}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-75 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        {/* Basic Configuration */}
        <div 
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: 'var(--color-highlight)' }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Basic Configuration
          </h3>
          
          <div className="space-y-4">
            {/* Editable SFTP Job Name */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                SFTP Job Name <span className="text-red-500">*</span>
                <TooltipHelper
                  text="A unique name for this SFTP job."
                  examples={['Ocwen', 'AVM_LTV_reports', 'SPS_FMSCRT_3001']}
                />
              </label>
              <input
                type="text"
                value={config.job_name || ''}
                onChange={e => handleChange('job_name', e.target.value)}
                className="form-input w-full"
                placeholder="Enter SFTP job name"
                required
              />
            </div>

            <div>
              <label 
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Path <span className="text-red-500">*</span>
                <TooltipHelper
                  text="The SFTP path where files will be monitored and downloaded from"
                  examples={['M:\\!Sweeps\\Ocwen\\In', 'M:\\!Sweeps\\Freddie\\AVM_IN\\', 'M:\\!Sweeps\\SPS\\In\\']}
                />
              </label>
              <input
                type="text"
                value={config.path || ''}
                onChange={(e) => handleChange('path', e.target.value)}
                className="form-input w-full"
                placeholder="e.g., M:\\!Sweeps\\Ocwen\\In"
                required
              />
            </div>

            <div>
              <label 
                className="flex items-center gap-2 text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                Save Location <span className="text-red-500">*</span>
                <TooltipHelper
                  text="The local path where downloaded files will be saved"
                  examples={['M:\\{DealFolder}\\Data\\{YYYY}\\{M}', 'M:\\BATCH\\Freddie\\Data\\AVM\\{YYYY}\\{M}\\', 'M:\\BATCH\\SPS\\{YYYY}\\{M}\\CF\\EmailExtract\\']}
                />
              </label>
              <input
                type="text"
                value={config.save_location || ''}
                onChange={(e) => handleChange('save_location', e.target.value)}
                className="form-input w-full"
                placeholder="e.g., M:\\{DealFolder}\\Data\\{YYYY}\\{M}"
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
                  text="Subject Matter Expert email addresses that will receive notifications and updates about this SFTP job's processing"
                  examples={['admin@example.com', 'john.doe@company.com,jane.smith@company.com']}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Servicer ID
                  <TooltipHelper
                    text="Numerical identifier for the servicer associated with this SFTP job"
                    examples={['150', '6001', '3001', '3601']}
                  />
                </label>
                <input
                  type="number"
                  value={config.servicer_id || ''}
                  onChange={(e) => handleChange('servicer_id', parseInt(e.target.value) || undefined)}
                  className="form-input w-full"
                  placeholder="e.g., 150"
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  DSN
                  <TooltipHelper
                    text="Data Source Name for database connection"
                    examples={['xf00.ocwen3.iman', 'xf00.fhlmavm.iman', 'xf00.sps2.iman']}
                  />
                </label>
                <input
                  type="text"
                  value={config.dsn || ''}
                  onChange={(e) => handleChange('dsn', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., xf00.ocwen3.iman"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Day Adjust
                  <TooltipHelper
                    text="Number of days to adjust for file processing (can be negative)"
                    examples={['0', '-2', '1']}
                  />
                </label>
                <input
                  type="number"
                  value={config.day_adjust ?? 0}
                  onChange={(e) => handleChange('day_adjust', parseInt(e.target.value) || 0)}
                  className="form-input w-full"
                  placeholder="Default: 0"
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Zip Content Filter
                  <TooltipHelper
                    text="Regex pattern to filter content within zip files"
                    examples={['.*', '.xls', '.xlsx', '.pdf']}
                  />
                </label>
                <input
                  type="text"
                  value={config.zip_content_filter || '.*'}
                  onChange={(e) => handleChange('zip_content_filter', e.target.value)}
                  className="form-input w-full"
                  placeholder="Default: .*"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Skip List
                  <TooltipHelper
                    text="Path to file containing patterns of files to skip"
                    examples={['N:\\Automation\\BV_Script\\Settings\\SkipListOCW.txt']}
                  />
                </label>
                <input
                  type="text"
                  value={config.skip_list || ''}
                  onChange={(e) => handleChange('skip_list', e.target.value)}
                  className="form-input w-full"
                  placeholder="Path to skip list file"
                />
              </div>

              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  Ignore List
                  <TooltipHelper
                    text="Path to file containing patterns of files to ignore"
                    examples={['N:\\Automation\\BV_Script\\Settings\\IgnoreListOCW.txt']}
                  />
                </label>
                <input
                  type="text"
                  value={config.ignore_list || ''}
                  onChange={(e) => handleChange('ignore_list', e.target.value)}
                  className="form-input w-full"
                  placeholder="Path to ignore list file"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enabled !== false}
                  onChange={(e) => handleChange('enabled', e.target.checked)}
                  className="rounded"
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  Enable this SFTP job
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Parsers Configuration */}
        <div 
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: 'var(--color-highlight)' }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Parsers Configuration
          </h3>
          
          <div className="space-y-4">
            {(config.parsers || []).map((parser, index) => (
              <div key={index} className="border rounded p-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Parser {index + 1}
                  </span>
                  {(config.parsers || []).length > 1 && (
                    <button
                      onClick={() => removeParser(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Parser Type
                    </label>
                    <select
                      value={parser.parser_type}
                      onChange={(e) => handleParserChange(index, 'parser_type', e.target.value as 'MoveFile' | 'MoveFile2')}
                      className="form-input w-full text-sm"
                    >
                      <option value="MoveFile">MoveFile</option>
                      <option value="MoveFile2">MoveFile2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Parser Value
                    </label>
                    <input
                      type="text"
                      value={parser.parser_value}
                      onChange={(e) => handleParserChange(index, 'parser_value', e.target.value)}
                      className="form-input w-full text-sm"
                      placeholder="e.g., .*"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={addParser}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Parser
            </button>
          </div>
        </div>

        {/* Templates Configuration */}
        <div 
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: 'var(--color-highlight)' }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Templates Configuration
          </h3>
          
          <div className="space-y-4">
            {(config.templates || []).map((template, index) => (
              <div key={index} className="border rounded p-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Template {index + 1}
                  </span>
                  <button
                    onClick={() => removeTemplate(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={template.template_name}
                      onChange={(e) => handleTemplateChange(index, 'template_name', e.target.value)}
                      className="form-input w-full text-sm"
                      placeholder="e.g., Main"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Template Value
                    </label>
                    <input
                      type="text"
                      value={template.template_value || ''}
                      onChange={(e) => handleTemplateChange(index, 'template_value', e.target.value)}
                      className="form-input w-full text-sm"
                      placeholder="Template value (optional)"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={addTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Template
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div 
          className="sticky bottom-0 p-4 border-t flex justify-end space-x-3"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border hover:opacity-75 transition-opacity"
            style={{ 
              color: 'var(--color-text-secondary)', 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSoftSave}
            disabled={!isDirty || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : (isNewJob ? 'Create SFTP Job' : 'Save Configuration')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SftpJobConfigurationEditor;
