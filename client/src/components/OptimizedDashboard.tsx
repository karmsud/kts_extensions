import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  MailIcon, 
  DatabaseIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  WifiOffIcon,
  ServerIcon,
  ClockIcon
} from 'lucide-react';
import { jobsApi, dealsApi } from '../services/api';
import { CompleteJob, Deal, DealStats } from '../types/api';
import ErrorBoundary from './ErrorBoundary';

// Timeout configuration for API calls
const API_TIMEOUT = 15000; // 15 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

interface LoadingState {
  jobs: boolean;
  deals: boolean;
  stats: boolean;
  importing: boolean;
}

interface ErrorState {
  jobs: string | null;
  deals: string | null;
  stats: string | null;
  import: string | null;
}

// Timeout wrapper for API calls
const withTimeout = <T,>(promise: Promise<T>, timeout: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeout)
    )
  ]);
};

// Retry wrapper for API calls
const withRetry = async <T,>(
  operation: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, attempts - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<CompleteJob[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealStats, setDealStats] = useState<DealStats | null>(null);
  
  const [loading, setLoading] = useState<LoadingState>({
    jobs: true,
    deals: true,
    stats: true,
    importing: false
  });
  
  const [errors, setErrors] = useState<ErrorState>({
    jobs: null,
    deals: null,
    stats: null,
    import: null
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Memoized computed values
  const enabledJobs = useMemo(() => 
    jobs.filter(job => job.enabled !== false), 
    [jobs]
  );

  const recentJobs = useMemo(() => 
    jobs.slice(0, 5), 
    [jobs]
  );

  const recentDeals = useMemo(() => 
    deals.slice(0, 5), 
    [deals]
  );

  const stats = useMemo(() => [
    {
      name: 'Active Jobs',
      value: enabledJobs.length,
      total: jobs.length,
      icon: MailIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      href: '/jobs',
      error: errors.jobs
    },
    {
      name: 'Total Deals',
      value: dealStats?.totalDeals || 0,
      icon: DatabaseIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
      href: '/deals',
      error: errors.deals
    },
    {
      name: 'Unique Servicers',
      value: dealStats?.uniqueServicers || 0,
      icon: TrendingUpIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      href: '/deals',
      error: errors.stats
    },
    {
      name: 'System Status',
      value: Object.values(errors).some(error => error) ? 'Issues Detected' : 'Healthy',
      icon: Object.values(errors).some(error => error) ? AlertCircleIcon : CheckCircleIcon,
      color: Object.values(errors).some(error => error) ? 'text-red-600' : 'text-green-600',
      bg: Object.values(errors).some(error => error) ? 'bg-red-100' : 'bg-green-100',
    }
  ], [enabledJobs.length, jobs.length, dealStats, errors]);

  const clearError = useCallback((errorType: keyof ErrorState) => {
    setErrors(prev => ({ ...prev, [errorType]: null }));
  }, []);

  // Load jobs with timeout and retry
  const loadJobs = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, jobs: true }));
      clearError('jobs');

      const response = await withRetry(() => 
        withTimeout(jobsApi.getJobs({ limit: 10 }), API_TIMEOUT)
      );

      if (response.success && response.data) {
        setJobs(response.data);
      } else {
        throw new Error(response.error || 'Failed to load jobs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs';
      setErrors(prev => ({ ...prev, jobs: errorMessage }));
      console.error('Jobs loading error:', err);
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  }, [clearError]);

  // Load deals with timeout and retry
  const loadDeals = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, deals: true }));
      clearError('deals');

      const response = await withRetry(() => 
        withTimeout(dealsApi.getDeals({ limit: 10 }), API_TIMEOUT)
      );

      if (response.success && response.data) {
        setDeals(response.data);
      } else {
        throw new Error(response.error || 'Failed to load deals');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load deals';
      setErrors(prev => ({ ...prev, deals: errorMessage }));
      console.error('Deals loading error:', err);
    } finally {
      setLoading(prev => ({ ...prev, deals: false }));
    }
  }, [clearError]);

  // Load stats with timeout and retry
  const loadStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      clearError('stats');

      const response = await withRetry(() => 
        withTimeout(dealsApi.getStats(), API_TIMEOUT)
      );

      if (response.success && response.data) {
        setDealStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to load statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setErrors(prev => ({ ...prev, stats: errorMessage }));
      console.error('Stats loading error:', err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [clearError]);

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLastRefresh(new Date());
    
    // Load data independently to prevent one failure from blocking others
    await Promise.allSettled([
      loadJobs(),
      loadDeals(),
      loadStats()
    ]);
  }, [loadJobs, loadDeals, loadStats]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleFileImport = useCallback(async (file: File, type: 'jobs' | 'deals') => {
    try {
      setLoading(prev => ({ ...prev, importing: true }));
      clearError('import');

      const formData = new FormData();
      const fieldName = type === 'jobs' ? 'xmlFile' : 'csvFile';
      const endpoint = type === 'jobs' ? '/api/v1/jobs/import-xml' : '/api/v1/deals/import-csv';
      
      formData.append(fieldName, file);
      
      const response = await withTimeout(
        fetch(endpoint, {
          method: 'POST',
          body: formData
        }),
        API_TIMEOUT
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Import failed: ${errorText}`);
      }
      
      // Reload relevant data after successful import
      await loadDashboardData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to import ${type} file`;
      setErrors(prev => ({ ...prev, import: errorMessage }));
      console.error('Import error:', err);
    } finally {
      setLoading(prev => ({ ...prev, importing: false }));
    }
  }, [loadDashboardData, clearError]);

  const isLoading = loading.jobs || loading.deals || loading.stats;
  const hasAnyData = jobs.length > 0 || deals.length > 0 || dealStats;

  if (isLoading && !hasAnyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <span className="mt-2 text-gray-600 block">Loading dashboard...</span>
          <div className="mt-2 text-sm text-gray-500">
            {loading.jobs && <div>• Loading jobs...</div>}
            {loading.deals && <div>• Loading deals...</div>}
            {loading.stats && <div>• Loading statistics...</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
            <div className="mt-1 text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Global Error Alert */}
        {errors.import && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Import Error</h3>
                <div className="mt-2 text-sm text-red-700">{errors.import}</div>
                <div className="mt-3">
                  <button
                    onClick={() => clearError('import')}
                    className="bg-red-100 px-2 py-1 text-sm text-red-800 rounded hover:bg-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                {stat.error && (
                  <div className="mt-2 text-xs text-red-600 flex items-center">
                    <WifiOffIcon className="h-3 w-3 mr-1" />
                    {stat.error}
                  </div>
                )}
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
            Data Import
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
                    disabled={loading.importing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileImport(file, 'jobs');
                    }}
                  />
                  <div className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading.importing ? (
                      <ClockIcon className="h-5 w-5 mr-2 text-blue-500 animate-spin" />
                    ) : (
                      <MailIcon className="h-5 w-5 mr-2 text-blue-500" />
                    )}
                    {loading.importing ? 'Importing...' : 'Choose PowerShell/XML file'}
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
                    disabled={loading.importing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileImport(file, 'deals');
                    }}
                  />
                  <div className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading.importing ? (
                      <ClockIcon className="h-5 w-5 mr-2 text-green-500 animate-spin" />
                    ) : (
                      <DatabaseIcon className="h-5 w-5 mr-2 text-green-500" />
                    )}
                    {loading.importing ? 'Importing...' : 'Choose CSV file'}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Jobs */}
          <div 
            className="shadow rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 
                  className="text-lg font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  Recent Jobs
                </h3>
                {loading.jobs && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
            </div>
            <div className="px-6 py-4">
              {errors.jobs ? (
                <div className="text-center py-8">
                  <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{errors.jobs}</p>
                  <button
                    onClick={loadJobs}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Try again
                  </button>
                </div>
              ) : recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className={`w-2 h-2 rounded-full mr-3 ${
                            job.enabled === false ? 'bg-gray-400' : 'bg-green-400'
                          }`}
                        />
                        <div>
                          <p 
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {job.job_name}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: 'var(--color-textSecondary)' }}
                          >
                            Updated {job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          job.enabled === false 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {job.enabled === false ? 'Disabled' : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MailIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No jobs found</p>
                </div>
              )}
            </div>
            {!errors.jobs && recentJobs.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200">
                <Link 
                  to="/jobs" 
                  className="text-sm font-medium hover:opacity-75"
                  style={{ color: 'var(--color-primary)' }}
                >
                  View all jobs →
                </Link>
              </div>
            )}
          </div>

          {/* Recent Deals */}
          <div 
            className="shadow rounded-lg"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 
                  className="text-lg font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  Recent Deals
                </h3>
                {loading.deals && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                )}
              </div>
            </div>
            <div className="px-6 py-4">
              {errors.deals ? (
                <div className="text-center py-8">
                  <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{errors.deals}</p>
                  <button
                    onClick={loadDeals}
                    className="mt-2 text-green-600 hover:text-green-800 text-sm"
                  >
                    Try again
                  </button>
                </div>
              ) : recentDeals.length > 0 ? (
                <div className="space-y-3">
                  {recentDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between">
                      <div>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {deal.deal_name}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ color: 'var(--color-textSecondary)' }}
                        >
                          {deal.keyword}
                        </p>
                      </div>
                      <span 
                        className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                      >
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DatabaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No deals found</p>
                </div>
              )}
            </div>
            {!errors.deals && recentDeals.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200">
                <Link 
                  to="/deals" 
                  className="text-sm font-medium hover:opacity-75"
                  style={{ color: 'var(--color-primary)' }}
                >
                  View all deals →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
