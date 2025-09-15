'use client';

import { useEffect, useState } from 'react';
import { fetchPayments } from '@/lib/api';
import ClientOnly from '@/components/ClientOnly';

interface Payment {
  id: string;
  invoice: string; // This is the invoice ID, not an object
  invoice_reference: string; // This comes directly from the API
  amount: string;
  currency: string;
  status: string;
  payment_method: string;
  payment_provider: string;
  created_at: string;
  processed_at?: string;
  description?: string;
}

export default function CustomerPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await fetchPayments();
      setPayments(data.results || data || []);
    } catch (err) {
      setError('Failed to load payment history');
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const statusMap = {
      'succeeded': { class: 'bg-success', text: 'SUCCESS' },
      'pending': { class: 'bg-warning', text: 'PENDING' },
      'failed': { class: 'bg-danger', text: 'FAILED' },
      'canceled': { class: 'bg-secondary', text: 'CANCELED' },
      'processing': { class: 'bg-info', text: 'PROCESSING' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { class: 'bg-secondary', text: status.toUpperCase() };
    
    return (
      <span className={`badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
        return <i className="bi bi-credit-card"></i>;
      case 'bank_transfer':
        return <i className="bi bi-bank"></i>;
      case 'paypal':
        return <i className="bi bi-paypal"></i>;
      default:
        return <i className="bi bi-wallet2"></i>;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = (payment.invoice_reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (payment.amount || '').includes(searchTerm) ||
                         (payment.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const successfulPayments = filteredPayments.filter(p => p.status === 'succeeded').length;

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Error!</h4>
              <p>{error}</p>
            </div>
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
              <h1 className="h3 mb-0">Payment History</h1>
              <p className="text-muted mb-0">View all your payment transactions</p>
            </div>
            <div className="text-end">
              <div className="h5 mb-0 text-success">${totalAmount.toFixed(2)} CAD</div>
              <small className="text-muted">Total Paid</small>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title">Total Payments</h6>
                      <h4 className="mb-0">{filteredPayments.length}</h4>
                    </div>
                    <i className="bi bi-receipt display-4"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title">Successful</h6>
                      <h4 className="mb-0">{successfulPayments}</h4>
                    </div>
                    <i className="bi bi-check-circle display-4"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title">Pending</h6>
                      <h4 className="mb-0">{filteredPayments.filter(p => p.status === 'pending').length}</h4>
                    </div>
                    <i className="bi bi-clock display-4"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-danger text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title">Failed</h6>
                      <h4 className="mb-0">{filteredPayments.filter(p => p.status === 'failed').length}</h4>
                    </div>
                    <i className="bi bi-x-circle display-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="search" className="form-label">Search Payments</label>
                  <input
                    type="text"
                    className="form-control"
                    id="search"
                    placeholder="Search by invoice reference, amount, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="statusFilter" className="form-label">Filter by Status</label>
                  <select
                    className="form-select"
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="succeeded">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="canceled">Canceled</option>
                    <option value="processing">Processing</option>
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-credit-card display-1 text-muted"></i>
                <h5 className="card-title mt-3">No Payments Found</h5>
                <p className="card-text text-muted">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No payments match your current filters.' 
                    : 'You haven\'t made any payments yet.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            <div>
                              <strong>{payment.invoice_reference || 'N/A'}</strong>
                              <br />
                              <small className="text-muted">ID: {payment.invoice?.slice(0, 8) || 'N/A'}...</small>
                            </div>
                          </td>
                          <td>
                            <div className="fw-bold text-success">
                              ${payment.amount} CAD
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">{getPaymentMethodIcon(payment.payment_method)}</span>
                              <div>
                                <div className="text-capitalize">{payment.payment_method.replace('_', ' ')}</div>
                                <small className="text-muted">{payment.payment_provider}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            {getStatusBadge(payment.status)}
                          </td>
                          <td>
                            <div>
                              <ClientOnly fallback={payment.created_at}>
                                {new Date(payment.created_at).toLocaleDateString()}
                              </ClientOnly>
                              <br />
                              <small className="text-muted">
                                <ClientOnly fallback={payment.created_at}>
                                  {new Date(payment.created_at).toLocaleTimeString()}
                                </ClientOnly>
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }}>
                              {payment.description || 'No description'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
