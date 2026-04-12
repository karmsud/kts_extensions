import React, { useState, useEffect } from 'react';
import { useMutation } from '../hooks/useApi';

interface Job {
  id: number;
  job_name: string;
  mailbox: string;
  folder: string;
  sme_emails: string;
  last_email: string;
  save_location: string;
  enabled: number;
  servicer_id: string | null;
  priority: number;
  server_side: number;
  queue_one_file: number;
  day_adjust: number;
  filters: Array<{
    filter_type: string;
    filter_value: string;
  }>;
  parsers: Array<{
    parser_type: string;
    parser_value: string;
  }>;
  templates: Array<{
    template_name: string;
    template_value: string;
  }>;
}

const OutlookScriptGenerator: React.FC = () => {
  const { mutate } = useMutation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('DEV');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  const environments = ['DEV', 'IT', 'UAT', 'Prod'];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/jobs?all=true');
      const result = await response.json();
      if (result.success) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const generateJobXML = (job: Job): string => {
    let xml = `      <${job.job_name}>\n\n`;
    
    // Basic job information
    xml += `        <Mailbox>${job.mailbox}</Mailbox>\n\n`;
    xml += `        <Folder>${job.folder}</Folder>\n\n`;
    xml += `        <SME>${job.sme_emails}</SME>\n\n`;
    xml += `        <LastEmail>${formatDate(job.last_email)}</LastEmail>\n\n`;
    xml += `        <SaveLocation>${job.save_location}</SaveLocation>\n\n`;

    // Filters
    xml += `        <Filters>\n\n`;
    job.filters.forEach(filter => {
      const tagName = filter.filter_type.charAt(0).toUpperCase() + filter.filter_type.slice(1);
      xml += `          <${tagName}>${filter.filter_value}</${tagName}>\n\n`;
    });
    xml += `        </Filters>\n\n`;

    // Parsers
    xml += `        <Parsers>\n\n`;
    job.parsers.forEach(parser => {
      if (parser.parser_type === 'detach_file_subject' || parser.parser_type === 'detachfilesubject') {
        xml += `          <DetachFileSubject>${parser.parser_value}</DetachFileSubject>\n\n`;
      } else if (parser.parser_type === 'detach_file' || parser.parser_type === 'detachfile') {
        xml += `          <DetachFile>${parser.parser_value}</DetachFile>\n\n`;
      }
    });
    xml += `        </Parsers>\n\n`;

    // ServicerID (if present)
    if (job.servicer_id) {
      xml += `        <ServicerID>${job.servicer_id}</ServicerID>\n\n`;
    }

    // QueueOneFile
    xml += `        <QueueOneFile>${job.queue_one_file ? 'True' : 'False'}</QueueOneFile>\n\n`;

    // DayAdjust (if not 0)
    if (job.day_adjust !== 0) {
      xml += `        <DayAdjust>${job.day_adjust}</DayAdjust>\n\n`;
    }

    // Templates
    if (job.templates.length > 0) {
      xml += `        <Templates>\n\n`;
      job.templates.forEach(template => {
        xml += `          <${template.template_name}>${template.template_value.trim()}</${template.template_name}>\n\n`;
      });
      xml += `        </Templates>\n\n`;
    }

    // Priority (if not 0)
    if (job.priority > 0) {
      xml += `        <Priority>${job.priority}</Priority>\n\n`;
    }

    // ServerSide (if true)
    if (job.server_side === 1) {
      xml += `        <ServerSide>1</ServerSide>\n\n`;
    }

    xml += `      </${job.job_name}>\n\n`;
    
    return xml;
  };

  const generateMasterScript = async () => {
    setIsGenerating(true);
    setGenerationStatus('Generating master script...');

    try {
      // Generate XML for all jobs
      const allJobsXML = jobs.map(job => generateJobXML(job)).join('');

      // Create the complete script content
      const scriptContent = `<?xml version="1.0"?>

<Settings>

  <DisableJob>0</DisableJob>

  <MapDrives>

    <N>\\\\your-domain.com\\NAS\\share1</N>

    <F>\\\\your-domain.com\\NAS\\share2</F>

    <J>\\\\your-domain.com\\NAS\\share3</J>

    <M>\\\\your-domain.com\\NAS\\share4</M>

    <S>\\\\your-domain.com\\NAS\\share5</S>

    <T>\\\\your-domain.com\\NAS\\share6</T>

    <X>\\\\your-domain.com\\NAS\\share7</X>

  </MapDrives>

  <Server>your-db-server.your-domain.com,49001</Server>

  <Db>YourDatabase</Db>

  <StagingServer>your-staging-server.database.windows.net,1433</StagingServer>

  <StagingDb>YourStagingDb</StagingDb>

  <HashiAPI>/v1/your-vault-path</HashiAPI>

  <Email>

    <SMTPServer>smtp.your-domain.com</SMTPServer>

    <SubjectTag>Email Monitor</SubjectTag>

    <From>automation@your-domain.com</From>

    <Support>admin@your-domain.com</Support>

  </Email>

  <Outlook>

    <Enabled>1</Enabled>

    <CredFileLocation>N:\\Automation\\Outlook\\EmailCred.xml</CredFileLocation>

    <MailboxCollection>

${allJobsXML}    </MailboxCollection>

  </Outlook>

</Settings>
`;

      // Send to backend to create the file
      setGenerationStatus('Creating file in environment folder...');
      const response = await mutate('/api/v1/outlook-script/generate', {
        method: 'POST',
        body: {
          environment: selectedEnvironment,
          content: scriptContent
        }
      });

      if (response) {
        setGenerationStatus(`✅ Master script successfully generated for ${selectedEnvironment} environment!`);
        setTimeout(() => {
          setGenerationStatus('');
        }, 5000);
      } else {
        setGenerationStatus('❌ Error generating script');
      }

    } catch (error) {
      console.error('Error generating master script:', error);
      setGenerationStatus('❌ Failed to generate master script');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Outlook Master Script Generator
            </h1>
            <p className="text-gray-600">
              Generate master outlook_{`{environment}`}.ps1 files for all jobs across different environments
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Script Generation Overview
            </h2>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Total Jobs:</strong> {jobs.length}</p>
              <p>• <strong>Output Location:</strong> PS_Scripts/{`{environment}`}/outlook_{`{environment}`}.ps1</p>
              <p>• <strong>Auto Backup:</strong> Existing files are automatically versioned before overwrite</p>
              <p>• <strong>Format:</strong> Complete PowerShell XML configuration with all job definitions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target Environment
              </label>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                title="Select target environment"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              >
                {environments.map(env => (
                  <option key={env} value={env}>
                    {env} Environment
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={generateMasterScript}
                disabled={isGenerating || jobs.length === 0}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  `Generate Master Script for ${selectedEnvironment}`
                )}
              </button>
            </div>
          </div>

          {generationStatus && (
            <div className={`p-4 rounded-md mb-6 ${
              generationStatus.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : generationStatus.includes('❌')
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <p className="font-medium">{generationStatus}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Jobs to be included ({jobs.length} total)
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading jobs...</span>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicer ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mailbox
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {job.job_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {job.servicer_id || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {job.mailbox}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            job.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {job.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutlookScriptGenerator;
