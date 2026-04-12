import { useState, useEffect, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function useApi<T>(url: string, dependencies: unknown[] = []) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<T> = await response.json();
      
      if (result.success) {
        setState({ data: result.data || null, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: result.error || 'API request failed' });
      }
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'An error occurred'
      });
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return { ...state, refetch: fetchData };
}

// Custom hook for mutations (POST, PUT, DELETE)
export function useMutation<TData = unknown, TVariables = unknown>() {
  const [state, setState] = useState<{
    data: TData | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const mutate = useCallback(async (
    url: string, 
    options: {
      method: 'POST' | 'PUT' | 'DELETE';
      body?: TVariables;
      headers?: Record<string, string>;
    }
  ): Promise<TData | null> => {
    try {
      setState({ data: null, loading: true, error: null });

      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<TData> = await response.json();

      if (result.success) {
        setState({ data: result.data || null, loading: false, error: null });
        return result.data || null;
      } else {
        setState({ data: null, loading: false, error: result.error || 'Mutation failed' });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  }, []);

  return { ...state, mutate };
} 