'use client';

import React from 'react';
import { useOffline } from '@/hooks/useOffline';

const OfflineIndicator: React.FC = () => {
  const { isOffline, retryConnection, lastOnline } = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="alert alert-warning alert-dismissible fade show position-fixed top-0 start-0 end-0 m-0 rounded-0" 
         style={{ zIndex: 9999 }} 
         role="alert">
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <i className="bi bi-wifi-off me-2"></i>
          <div className="flex-grow-1">
            <strong>You're offline</strong>
            <span className="ms-2">
              {lastOnline 
                ? `Last online: ${lastOnline.toLocaleTimeString()}`
                : 'No recent connection'
              }
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-warning me-2"
            onClick={retryConnection}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Retry
          </button>
          <button 
            type="button" 
            className="btn-close" 
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
