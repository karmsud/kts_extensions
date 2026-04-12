import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CompleteJob } from '../types/api';
import JobConfigurationEditor from './JobConfigurationEditor';
import { Deal } from '../types';

interface ServicerOption {
  id: number;
  name: string;
}

interface DealWithJobNames extends Deal {
  job_names?: string;
}

interface DealsApiResponse {
  success: boolean;
  data: DealWithJobNames[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata?: {
    jobsCount: number;
    fetchedAt: string;
  };
}

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
}

const OptimizedDealsManagement: React.FC = () => {
  const [deals, setDeals] = useState<DealWithJobNames[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchColumn, setSearchColumn] = useState<'deal_name' | 'keyword' | 'servicer_id' | 'job_name'>('deal_name');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [servicers, setServicers] = useState<ServicerOption[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [formData, setFormData] = useState({ 
    deal_name: '', 
    keyword: '', 
    servicer_id: 0,
    item_id: ''
  });
  const [showJobConfig, setShowJobConfig] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CompleteJob | null>(null);
  const [metadata, setMetadata] = useState<{ jobsCount: number; fetchedAt: string } | null>(null);

  // Error handling utility
  const handleError = useCallback((error: unknown, defaultMessage: string = 'An error occurred') => {
    let errorMessage = defaultMessage;
    let errorType: 'error' | 'warning' | 'info' = 'error';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Determine error type based on message
    if (errorMessage.includes('not found')) {
      errorType = 'warning';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = 'error';
    }

    setError({ message: errorMessage, type: errorType });
    
    // Auto-clear error after 5 seconds for non-critical errors
    if (errorType !== 'error') {
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Optimized fetch deals with job names in single API call
  const fetchDealsOptimized = useCallback(async () => {
    setLoading(true);
    clearError();
    
    try {
      const response = await fetch('/api/v1/deals/optimized?all=true');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: DealsApiResponse = await response.json();
      
      if (result.success && result.data) {
        setDeals(result.data);
        setMetadata(result.metadata || null);
      } else {
        throw new Error((result as any).message || 'Failed to fetch deals');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch deals');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const fetchServicers = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/servicers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setServicers(Array.isArray(data) ? data : []);
    } catch (error) {
      handleError(error, 'Failed to fetch servicers');
      setServicers([]);
    }
  }, [handleError]);

  useEffect(() => {
    fetchDealsOptimized();
    fetchServicers();
  }, [fetchDealsOptimized, fetchServicers]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    
    try {
      const url = editingDeal 
        ? `/api/v1/deals/${editingDeal.id}` 
        : '/api/v1/deals';
      
      const response = await fetch(url, {
        method: editingDeal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setIsModalVisible(false);
        setFormData({ deal_name: '', keyword: '', servicer_id: 0, item_id: '' });
        await fetchDealsOptimized(); // Refresh data
        setError({ 
          message: `Deal ${editingDeal ? 'updated' : 'created'} successfully`, 
          type: 'info' 
        });
      } else {
        throw new Error(result.error || 'Operation failed');
      }
    } catch (error) {
      handleError(error, `Failed to ${editingDeal ? 'update' : 'create'} deal`);
    } finally {
      setLoading(false);
    }
  }, [editingDeal, formData, fetchDealsOptimized, handleError, clearError]);

  const handleDeleteClick = useCallback((deal: Deal) => {
    setDealToDelete(deal);
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!dealToDelete?.id) return;
    
    setLoading(true);
    clearError();
    
    try {
      const response = await fetch(`/api/v1/deals/${dealToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchDealsOptimized();
        setShowDeleteConfirm(false);
        setDealToDelete(null);
        setError({ message: 'Deal deleted successfully', type: 'info' });
      } else {
        throw new Error(result.error || 'Failed to delete deal');
      }
    } catch (error) {
      handleError(error, 'Failed to delete deal');
    } finally {
      setLoading(false);
    }
  }, [dealToDelete, fetchDealsOptimized, handleError, clearError]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
    setDealToDelete(null);
  }, []);

  // Optimized filtering with useMemo
  const filteredDeals = useMemo(() => {
    if (!searchText) return deals;
    
    const searchLower = searchText.toLowerCase();
    
    return deals.filter(deal => {
      const value = (() => {
        switch (searchColumn) {
          case 'deal_name':
            return deal.deal_name || '';
          case 'keyword':
            return deal.keyword || '';
          case 'servicer_id':
            return String(deal.servicer_id ?? '');
          case 'job_name':
            return deal.job_names || '';
          default:
            return '';
        }
      })();
      
      return value.toLowerCase().includes(searchLower);
    });
  }, [deals, searchText, searchColumn]);

  const getServicerName = useCallback((servicerId: number) => {
    const servicer = servicers.find(s => s.id === servicerId);
    return servicer ? servicer.name : servicerId.toString();
  }, [servicers]);

  // Memoized counts
  const dealCount = useMemo(() => filteredDeals.length, [filteredDeals]);
  const totalDealCount = useMemo(() => deals.length, [deals]);

  return (
    <div className="p-3">
      <h1 className="text-2xl font-bold mb-3 text-text">Deals Management</h1>
      
      {/* Error Display */}
      {error && (
        <div className={`mb-4 p-3 rounded-md ${
          error.type === 'error' 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : error.type === 'warning' 
            ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <div className="flex justify-between items-center">
            <span>{error.message}</span>
            <button 
              onClick={clearError}
              className="text-sm font-medium underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Metadata Display */}
      {metadata && (
        <div className="mb-4 p-2 bg-gray-50 rounded-md text-sm text-gray-600">
          Jobs loaded: {metadata.jobsCount} | Last updated: {new Date(metadata.fetchedAt).toLocaleTimeString()}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <select
            value={searchColumn}
            onChange={e => setSearchColumn(e.target.value as any)}
            className="form-input px-2 py-1 text-sm"
            aria-label="Select column to search"
          >
            <option value="deal_name">Deal Name</option>
            <option value="keyword">Keyword</option>
            <option value="servicer_id">Servicer ID</option>
            <option value="job_name">Job Name</option>
          </select>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={`Search ${searchColumn.replace('_', ' ')}...`}
            className="form-input px-2 py-1 text-sm"
            aria-label={`Search by ${searchColumn.replace('_', ' ')}`}
          />
          <span className="text-sm text-gray-600">
            {dealCount} of {totalDealCount} deals
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingDeal(null);
              setFormData({ deal_name: '', keyword: '', servicer_id: 0, item_id: '' });
              setIsModalVisible(true);
            }}
            disabled={loading}
            className="btn-primary px-3 py-1 text-sm"
          >
            Add Deal
          </button>
          <button
            onClick={fetchDealsOptimized}
            disabled={loading}
            className="btn-secondary px-3 py-1 text-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading deals...</span>
        </div>
      )}

      {/* Deals Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Deal Name</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Keyword</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Servicer ID</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm font-medium text-gray-700">Job Name</th>
                <th className="border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-sm">{deal.deal_name}</td>
                  <td className="border border-gray-200 px-3 py-2 text-sm">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {deal.keyword}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-sm">{deal.servicer_id}</td>
                  <td className="border border-gray-200 px-3 py-2 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      deal.job_names === '-' 
                        ? 'bg-gray-100 text-gray-600' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {deal.job_names}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingDeal(deal);
                          setFormData({
                            deal_name: deal.deal_name,
                            keyword: deal.keyword,
                            servicer_id: deal.servicer_id,
                            item_id: deal.item_id?.toString() || ''
                          });
                          setIsModalVisible(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(deal)}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDeals.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No deals found{searchText && ` for "${searchText}"`}
            </div>
          )}
        </div>
      )}

      {/* Rest of the modals remain the same... */}
      {/* Modal and other components code would go here */}
    </div>
  );
};

export default OptimizedDealsManagement;
