'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useApiError } from '@/hooks/useApiError';

export default function CustomerDashboard() {
  const [user, setUser] = useState<{first_name: string; last_name: string; email: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, handleError, clearError } = useApiError();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        clearError();
        
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUser(user);
        } else {
          throw new Error('No user data found. Please log in again.');
        }
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [handleError, clearError]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <ErrorMessage
              error={error}
              title="Failed to Load Dashboard"
              onDismiss={clearError}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">Customer Dashboard</h1>
              <p className="text-muted mb-0">
                Welcome back, {user?.first_name || 'Customer'}! View your invoices and make payments.
              </p>
            </div>
            <div className="text-end">
              <span className="badge bg-info fs-6">
                <i className="bi bi-person me-1"></i>
                Customer
              </span>
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-receipt me-2"></i>
                    Your Invoices
                  </h5>
                </div>
                <div className="card-body">
                  <p className="card-text">
                    View your invoices and make payments. Click on any invoice to see details and payment options.
                  </p>
                  <div className="text-center py-4">
                    <i className="bi bi-file-text text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-2">No invoices found</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Account Information
                  </h5>
                </div>
                <div className="card-body">
                  {user ? (
                    <div>
                      <p className="mb-2">
                        <strong>Name:</strong> {user.first_name} {user.last_name}
                      </p>
                      <p className="mb-2">
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p className="mb-0">
                        <strong>Role:</strong> 
                        <span className="badge bg-info ms-2">Customer</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted">Loading user information...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
