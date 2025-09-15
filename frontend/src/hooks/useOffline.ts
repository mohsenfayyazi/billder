'use client';

import { useState, useEffect } from 'react';

interface UseOfflineReturn {
  isOffline: boolean;
  isOnline: boolean;
  lastOnline: Date | null;
  retryConnection: () => void;
}

export const useOffline = (): UseOfflineReturn => {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize with current online status
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      setLastOnline(navigator.onLine ? new Date() : null);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const retryConnection = () => {
    // Force a network check by making a simple request
    fetch('/api/health', { method: 'HEAD' })
      .then(() => {
        setIsOffline(false);
        setLastOnline(new Date());
      })
      .catch(() => {
        // Still offline
      });
  };

  return {
    isOffline,
    isOnline: !isOffline,
    lastOnline,
    retryConnection
  };
};
