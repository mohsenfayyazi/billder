'use client';

import { useState, useCallback } from 'react';

interface UseLoadingReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(asyncFunction: () => Promise<T>) => Promise<T | undefined>;
  isLoading: (key: string) => boolean;
  setLoadingState: (key: string, loading: boolean) => void;
  clearAllLoading: () => void;
}

export const useLoading = (): UseLoadingReturn => {
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const withLoading = useCallback(async <T>(asyncFunction: () => Promise<T>): Promise<T | undefined> => {
    setLoading(true);
    try {
      const result = await asyncFunction();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const setLoadingState = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoading(false);
    setLoadingStates({});
  }, []);

  return {
    loading,
    setLoading,
    withLoading,
    isLoading,
    setLoadingState,
    clearAllLoading
  };
};
