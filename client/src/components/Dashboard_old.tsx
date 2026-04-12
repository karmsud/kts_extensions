import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MailIcon, 
  DatabaseIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  TrendingUpIcon,
  RefreshCwIcon
} from 'lucide-react';
import { jobsApi, dealsApi } from '../services/api';
import { CompleteJob, Deal, DealStats } from '../types/api';

const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<CompleteJob[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealStats, setDealStats] = useState<DealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobsResponse, dealsResponse, statsResponse] = await Promise.all([
        jobsApi.getJobs({ limit: 10 }),
        dealsApi.getDeals({ limit: 10 }),
        dealsApi.getStats()
      ]);

      if (jobsResponse.success && jobsResponse.data) {
        setJobs(jobsResponse.data);
      }

      if (dealsResponse.success && dealsResponse.data) {
        setDeals(dealsResponse.data);
      }

      if (statsResponse.success && statsResponse.data) {
        setDealStats(statsResponse.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-3">
              <button
                onClick={handleRefresh}
                className="bg-red-100 px-2 py-1 text-sm text-red-800 rounded hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const enabledJobs = jobs.filter(job => job.enabled !== false);
  const recentJobs = jobs.slice(0, 5);
  const recentDeals = deals.slice(0, 5);

  const stats = [
    {
      name: 'Active Jobs',
      value: enabledJobs.length,
      total: jobs.length,
      icon: MailIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      href: '/jobs'
    },
    {
      name: 'Total Deals',
      value: dealStats?.totalDeals || 0,
      icon: DatabaseIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
      href: '/deals'
    },
    {
      name: 'Unique Servicers',
      value: dealStats?.uniqueServicers || 0,
      icon: TrendingUpIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      href: '/deals'
    },
    {
      name: 'System Status',
      value: 'Healthy',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            Dashboard
          </h1>
          <p 
            className="mt-1 text-sm"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            Overview of your file routing and processing system
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary"
        >
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className="overflow-hidden shadow rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt 
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--color-textSecondary)' }}
                    >
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div 
                        className="text-2xl font-semibold"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </div>
                      {stat.total && (
                        <div 
                          className="ml-2 text-sm"
                          style={{ color: 'var(--color-textSecondary)' }}
                        >
                          of {stat.total}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            {stat.href && (
              <div 
                className="px-5 py-3"
                style={{ backgroundColor: 'var(--color-highlight)' }}
              >
                <div className="text-sm">
                  <Link 
                    to={stat.href} 
                    className="font-medium hover:opacity-75"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    View all
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Import Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                          Data import
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import jobs from PowerShell XML
            </label>
            <div className="mt-1">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept=".ps1,.xml"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    try {
                      const formData = new FormData();
                      formData.append('xmlFile', file);
                      
                      const response = await fetch('/api/v1/jobs/import-xml', {
                        method: 'POST',
                        body: formData
                      });
                      
                      if (!response.ok) throw new Error('Import failed');
                      
                      await loadDashboardData();
                    } catch (err) {
                      setError('Failed to import jobs file');
                      console.error('Import error:', err);
                    }
                  }}
                />
                <div className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <MailIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Choose PowerShell/XML file
                </div>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import deals from CSV
            </label>
            <div className="mt-1">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    try {
                      const formData = new FormData();
                      formData.append('csvFile', file);
                      
                      const response = await fetch('/api/v1/deals/import-csv', {
                        method: 'POST',
                        body: formData
                      });
                      
                      if (!response.ok) throw new Error('Import failed');
                      
                      await loadDashboardData();
                    } catch (err) {
                      setError('Failed to import deals file');
                      console.error('Import error:', err);
                    }
                  }}
                />
                <div className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <DatabaseIcon className="h-5 w-5 mr-2 text-green-500" />
                  Choose CSV file
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Jobs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent jobs
              </h3>
              <Link to="/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${job.enabled !== false ? 'bg-green-400' : 'bg-gray-400'}`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.job_name}</div>
                        <div className="text-sm text-gray-500">{job.mailbox}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {job.servicer_id && `ID: ${job.servicer_id}`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No jobs found. <Link to="/jobs" className="text-blue-600 hover:text-blue-500">Import or create your first job</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Keywords */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Top keywords
              </h3>
              <Link to="/deals" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {dealStats?.topKeywords && dealStats.topKeywords.length > 0 ? (
                dealStats.topKeywords.slice(0, 5).map((keyword, index) => (
                  <div key={keyword.keyword} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs font-medium mr-3">
                        {index + 1}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{keyword.keyword}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {keyword.count} deal{keyword.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No keywords found. <Link to="/deals" className="text-blue-600 hover:text-blue-500">Import or create your first deal</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Quick actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/jobs"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <div className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                <MailIcon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage jobs
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create, edit, or delete email monitoring jobs
                </p>
              </div>
            </Link>

            <Link
              to="/deals"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <div className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 group-hover:bg-green-100">
                <DatabaseIcon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage deals
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add or update deal keywords and mappings
                </p>
              </div>
            </Link>

            <button
              onClick={() => jobsApi.importFromXML()}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors text-left"
            >
              <div className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                <RefreshCwIcon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Import from XML
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Import jobs from PowerShell configuration
                </p>
              </div>
            </button>

            <button
              onClick={() => dealsApi.importFromCSV()}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors text-left"
            >
              <div className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-600 group-hover:bg-orange-100">
                <TrendingUpIcon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Import from CSV
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Import deals from CSV file
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 