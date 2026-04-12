import React, { useState, useEffect } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';

// Only keeping the JobDetail interface which is actually used
interface JobDetail {
  id: number;
  name: string;
  type: 'email' | 'sftp';
  mailbox?: string;
  path?: string;
  folder?: string;
  save_location?: string;
  templates?: { id: number; name: string }[];
}

interface DealWithJobNames {
  id: number;
  deal_name: string;
  keyword: string;
  servicer_id: number;
  servicer_name?: string;
  job_type: 'email' | 'sftp' | 'both' | 'none';
  job_details?: JobDetail[];
}

const DealsManagement: React.FC = () => {
  const [deals, setDeals] = useState<DealWithJobNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchColumn, setSearchColumn] = useState<string>('deal_name');

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the optimized endpoint for better performance
      const dealsResponse = await fetch('/api/v1/deals/optimized?all=true');
      
      if (!dealsResponse.ok) {
        throw new Error(`Failed to fetch deals: ${dealsResponse.status}`);
      }
      
      const dealsData = await dealsResponse.json();
      console.log('Deals Response:', dealsData);
      
      if (!dealsData.success) {
        throw new Error(dealsData.error || 'Failed to fetch deals data');
      }
      
      // Safely extract deals data with fallbacks
      const dealsArray = dealsData.data || [];
      
      // Update state with the extracted data
      setDeals(dealsArray);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get job names for a deal
  const getJobNamesForDeal = (deal: DealWithJobNames): string => {
    if (deal.job_details && deal.job_details.length > 0) {
      return deal.job_details.map(jobDetail => jobDetail.name).join(', ');
    }
    return 'No jobs assigned';
  };

  // Get mailbox/path info directly from the deal object
  const getMailboxForDeal = (deal: DealWithJobNames): string => {
    if (!deal.job_details || deal.job_details.length === 0) {
      return '-';
    }
    
    // The optimized endpoint now includes this information directly
    return deal.job_details
      .filter(job => job.mailbox || job.path)
      .map(job => job.mailbox || job.path)
      .filter(Boolean)
      .join('; ') || '-';
  };

  // Get save location directly from the deal object
  const getSaveLocationForDeal = (deal: DealWithJobNames): string => {
    if (!deal.job_details || deal.job_details.length === 0) {
      return '-';
    }
    
    // The optimized endpoint now includes this information directly
    return deal.job_details
      .filter(job => job.save_location)
      .map(job => job.save_location)
      .filter(Boolean)
      .join('; ') || '-';
  };

  // Helper function to get scrubber template for a deal
  const getScrubberTemplateForDeal = (deal: DealWithJobNames): string => {
    if (deal.job_details && deal.job_details.length > 0) {
      const templates: string[] = [];
      
      deal.job_details.forEach(jobDetail => {
        if (jobDetail.templates && jobDetail.templates.length > 0) {
          templates.push(...jobDetail.templates.map((t: { id: number; name: string }) => t.name));
        }
      });
      
      return templates.join(', ');
    }
    return '-';
  };

  // Helper function to truncate text with character limit
  const truncateText = (text: string, limit: number = 50): string => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  // Helper function to handle job name clicks and open modals
  const handleJobNameClick = (jobDetail: JobDetail) => {
    if (jobDetail.type === 'email') {
      // Navigate to email jobs page with edit modal
      window.location.href = `/jobs?edit=${jobDetail.id}`;
    } else if (jobDetail.type === 'sftp') {
      // Navigate to SFTP jobs page with edit modal
      window.location.href = `/sftp-jobs?edit=${jobDetail.id}`;
    }
  };

  // Filter deals based on search
  const filteredDeals = Array.isArray(deals) ? deals.filter(deal => {
    if (!searchText) return true;
    
    const value = (() => {
      switch (searchColumn) {
        case 'deal_name': return deal.deal_name || '';
        case 'keyword': return deal.keyword || '';
        case 'servicer_id': return String(deal.servicer_id ?? '');
        case 'job_name': return getJobNamesForDeal(deal);
        case 'job_type': return deal.job_type || 'none';
        case 'mailbox': return getMailboxForDeal(deal);
        case 'save_location': return getSaveLocationForDeal(deal);
        case 'scrubber_template': return getScrubberTemplateForDeal(deal);
        default: return '';
      }
    })();
    
    return value.toLowerCase().includes(searchText.toLowerCase());
  }) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Deals Management</h1>
        <button
          onClick={fetchData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Refresh
        </button>
      </div>

      {/* Search Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search deals..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="min-w-48">
          <select
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Select search column"
          >
            <option value="deal_name">Deal Name</option>
            <option value="keyword">Keyword</option>
            <option value="servicer_id">Servicer ID</option>
            <option value="job_name">Job Name</option>
            <option value="job_type">Job Type</option>
            <option value="mailbox">Mailbox/In Folder</option>
            <option value="save_location">Save Location</option>
            <option value="scrubber_template">Scrubber Template</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredDeals.length} of {deals.length} deals
      </div>

      {/* Deals Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keyword
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mailbox/In Folder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Save Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scrubber Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {deal.deal_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.keyword}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.servicer_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.job_details && deal.job_details.length > 0 ? (
                      <div className="space-y-1">
                        {deal.job_details.map((jobDetail, index) => (
                          <button
                            key={index}
                            onClick={() => handleJobNameClick(jobDetail)}
                            className="text-blue-600 hover:text-blue-800 underline block text-left"
                          >
                            {jobDetail.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-red-500">No jobs assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        deal.job_type === 'email'
                          ? 'bg-blue-100 text-blue-800'
                          : deal.job_type === 'sftp'
                          ? 'bg-green-100 text-green-800'
                          : deal.job_type === 'both'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {deal.job_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getMailboxForDeal(deal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span title={getSaveLocationForDeal(deal)}>
                      {truncateText(getSaveLocationForDeal(deal), 50)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getScrubberTemplateForDeal(deal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => {
                          // Handle edit deal logic
                          console.log('Edit deal:', deal.id);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {
                          // Handle delete deal logic
                          console.log('Delete deal:', deal.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDeals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AiOutlineInfoCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No deals found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DealsManagement;
