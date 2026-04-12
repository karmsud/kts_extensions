import React, { useState, useEffect } from 'react';
import { SftpJob } from '../types/api';

const SftpMasterScriptGenerator: React.FC = () => {
  const [sftpJobs, setSftpJobs] = useState<SftpJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSftpJobs();
  }, []);

  const fetchSftpJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/sftp-jobs');
      if (response.ok) {
        const data = await response.json();
        // Ensure we handle various response formats
        const jobs = Array.isArray(data) ? data : (data.data || data.jobs || []);
        console.log('SFTP Jobs Response:', jobs);
        setSftpJobs(Array.isArray(jobs) ? jobs : []);
      } else {
        setError('Failed to fetch SFTP jobs');
      }
    } catch (error) {
      console.error('Error fetching SFTP jobs:', error);
      setError('Error fetching SFTP jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelection = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const generateMasterScript = async () => {
    if (selectedJobs.length === 0) {
      alert('Please select at least one SFTP job');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/sftp-jobs/generate-master-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobIds: selectedJobs }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedScript(data.script);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate master script');
      }
    } catch (error) {
      console.error('Error generating master script:', error);
      setError('Error generating master script');
    } finally {
      setLoading(false);
    }
  };

  const downloadScript = () => {
    if (!generatedScript) return;

    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sftp_master_script.ps1';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!generatedScript) return;

    try {
      await navigator.clipboard.writeText(generatedScript);
      alert('Script copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          SFTP Master Script Generator
        </h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Select the SFTP jobs you want to include in the master script. The generator will create a PowerShell script that can execute all selected SFTP jobs.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* SFTP Job Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Select SFTP Jobs
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setSelectedJobs(sftpJobs.filter(job => job.id !== undefined).map(job => job.id!))}
                className="text-blue-600 hover:text-blue-800 text-sm mr-4"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedJobs([])}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sftpJobs.map((job) => (
                <label key={job.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={job.id !== undefined && selectedJobs.includes(job.id)}
                    onChange={() => job.id !== undefined && handleJobSelection(job.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{job.job_name}</div>
                    <div className="text-sm text-gray-500">{job.path}</div>
                    <div className="text-xs text-gray-400">
                      {job.enabled ? '✓ Enabled' : '✗ Disabled'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            {sftpJobs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No SFTP jobs found. Create some SFTP jobs first.
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-6">
          <button
            onClick={generateMasterScript}
            disabled={loading || selectedJobs.length === 0}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Master Script'}
          </button>
          
          {selectedJobs.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Generated Script */}
        {generatedScript && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Master Script
              </h2>
              <div className="space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={downloadScript}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Download Script
                </button>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4 overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {generatedScript}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SftpMasterScriptGenerator;
