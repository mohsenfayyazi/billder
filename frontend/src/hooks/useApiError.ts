'use client';

import { useState, useCallback } from 'react';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

interface UseApiErrorReturn {
  error: ApiError | null;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  handleError: (error: any) => void;
  isRetrying: boolean;
  retry: () => Promise<void>;
  retryCount: number;
}

export const useApiError = (
  retryFunction?: () => Promise<any>,
  maxRetries: number = 3
): UseApiErrorReturn => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const handleError = useCallback((err: any) => {
    let apiError: ApiError;

    if (err.response) {
      // Server responded with error status
      apiError = {
        message: err.response.data?.message || err.response.data?.error || 'Server error occurred',
        status: err.response.status,
        code: err.response.data?.code,
        details: err.response.data?.details
      };
    } else if (err.request) {
      // Network error
      apiError = {
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Other error
      apiError = {
        message: err.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      };
    }

    setError(apiError);
  }, []);

  const retry = useCallback(async () => {
    if (!retryFunction || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await retryFunction();
      clearError();
    } catch (err) {
      handleError(err);
    } finally {
      setIsRetrying(false);
    }
  }, [retryFunction, retryCount, maxRetries, clearError, handleError]);

  return {
    error,
    setError,
    clearError,
    handleError,
    isRetrying,
    retry,
    retryCount
  };
};
