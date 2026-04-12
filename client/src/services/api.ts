import axios from 'axios';
import { CompleteJob, Deal, ApiResponse, DealStats } from '../types/api';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const jobsApi = {
  // Get all jobs with optional search and pagination
  getJobs: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get<ApiResponse<CompleteJob[]>>('/jobs', { params });
    return response.data;
  },

  // Get job by ID
  getJob: async (id: number) => {
    const response = await api.get<ApiResponse<CompleteJob>>(`/jobs/${id}`);
    return response.data;
  },

  // Create new job
  createJob: async (job: CompleteJob) => {
    const response = await api.post<ApiResponse<CompleteJob>>('/jobs', job);
    return response.data;
  },

  // Update existing job
  updateJob: async (id: number, job: CompleteJob) => {
    const response = await api.put<ApiResponse<CompleteJob>>(`/jobs/${id}`, job);
    return response.data;
  },

  // Delete job
  deleteJob: async (id: number) => {
    const response = await api.delete<ApiResponse<null>>(`/jobs/${id}`);
    return response.data;
  },

  // Import jobs from XML
  importFromXML: async () => {
    const response = await api.post<ApiResponse<{ imported: number; errors: string[] }>>('/jobs/import-xml');
    return response.data;
  },

  // Export jobs to XML
  exportToXML: async () => {
    const response = await api.post<ApiResponse<{ filePath: string; xmlContent: string }>>('/jobs/export-xml');
    return response.data;
  },
};

export const dealsApi = {
  // Get all deals with optional search and pagination
  getDeals: async (params?: { page?: number; limit?: number; search?: string; servicerId?: number }) => {
    const response = await api.get<ApiResponse<Deal[]>>('/deals', { params });
    return response.data;
  },

  // Get deal by ID
  getDeal: async (id: number) => {
    const response = await api.get<ApiResponse<Deal>>(`/deals/${id}`);
    return response.data;
  },

  // Create new deal
  createDeal: async (deal: Deal) => {
    const response = await api.post<ApiResponse<Deal>>('/deals', deal);
    return response.data;
  },

  // Update existing deal
  updateDeal: async (id: number, deal: Deal) => {
    const response = await api.put<ApiResponse<Deal>>(`/deals/${id}`, deal);
    return response.data;
  },

  // Delete deal
  deleteDeal: async (id: number) => {
    const response = await api.delete<ApiResponse<null>>(`/deals/${id}`);
    return response.data;
  },

  // Import deals from CSV
  importFromCSV: async (filePath?: string) => {
    const response = await api.post<ApiResponse<{ imported: number; skipped: number; errors: string[] }>>('/deals/import-csv', {
      filePath: filePath || './tblExternalDIDRef.csv'
    });
    return response.data;
  },

  // Export deals to CSV
  exportToCSV: async (outputPath?: string) => {
    const response = await api.get<ApiResponse<{ filePath: string }>>('/deals/export-csv', {
      params: { outputPath }
    });
    return response.data;
  },

  // Get unique servicer IDs
  getServicerIds: async () => {
    const response = await api.get<ApiResponse<number[]>>('/deals/servicer-ids');
    return response.data;
  },

  // Get deal statistics
  getStats: async () => {
    const response = await api.get<ApiResponse<DealStats>>('/deals/stats');
    return response.data;
  },
};

export const systemApi = {
  // Health check
  health: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // API info
  info: async () => {
    const response = await api.get('/');
    return response.data;
  },
};

export default api; 