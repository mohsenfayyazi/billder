'use client';

import { useEffect, useState } from 'react';
import { fetchInvoices } from '@/lib/api';
import PaymentStatus from '@/components/PaymentStatus';
import ClientOnly from '@/components/ClientOnly';

interface Invoice {
  id: string;
  reference: string;
  total_amount: string;
  amount_paid: string;
  status: string;
  due_date: string;
  created_at: string;
  owner_name?: string;
  owner_email?: string;
}

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await fetchInvoices();
      setInvoices(data.results || data || []);
    } catch (err) {
      setError('Failed to load invoices');
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingAmount = (total: string, paid: string) => {
    const totalAmount = parseFloat(total);
    const paidAmount = parseFloat(paid);
    return (totalAmount - paidAmount).toFixed(2);
  };

  const canMakePayment = (invoice: Invoice) => {
    const remaining = parseFloat(getRemainingAmount(invoice.total_amount, invoice.amount_paid));
    return remaining > 0 && invoice.status !== 'paid';
  };

  const isOverdue = (dueDate: string) => {
    if (!mounted) return false; // Prevent hydration mismatch
    return new Date(dueDate) < new Date();
  };

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
              <h1 className="h3 mb-0">My Invoices</h1>
              <p className="text-muted mb-0">View and pay your invoices</p>
            </div>
            <span className="badge bg-primary fs-6">
              {invoices.length} Total
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-file-text display-1 text-muted"></i>
                <h5 className="card-title mt-3">No Invoices Found</h5>
                <p className="card-text text-muted">You don't have any invoices yet.</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>From</th>
                        <th>Total Amount</th>
                        <th>Amount Paid</th>
                        <th>Remaining</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>
                            <strong>{invoice.reference}</strong>
                          </td>
                          <td>
                            <div>
                              <div>
                                {invoice.owner_name || 'Unknown'}
                              </div>
                              <small className="text-muted">
                                {invoice.owner_email || 'No email'}
                              </small>
                            </div>
                          </td>
                          <td>${invoice.total_amount} CAD</td>
                          <td>${invoice.amount_paid} CAD</td>
                          <td>
                            <span className={parseFloat(getRemainingAmount(invoice.total_amount, invoice.amount_paid)) > 0 ? 'text-danger' : 'text-success'}>
                              ${getRemainingAmount(invoice.total_amount, invoice.amount_paid)} CAD
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              invoice.status === 'paid' ? 'bg-success' :
                              invoice.status === 'partially_paid' ? 'bg-warning' :
                              invoice.status === 'pending' ? 'bg-secondary' :
                              'bg-danger'
                            }`}>
                              {invoice.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <ClientOnly>
                              {isOverdue(invoice.due_date) && invoice.status !== 'paid' && (
                                <span className="badge bg-danger ms-1">OVERDUE</span>
                              )}
                            </ClientOnly>
                          </td>
                          <td>
                            <ClientOnly fallback={invoice.due_date}>
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </ClientOnly>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <a 
                                href={`/customer/invoices/${invoice.id}`} 
                                className="btn btn-sm btn-primary"
                              >
                                View Details
                              </a>
                              {canMakePayment(invoice) && (
                                <a 
                                  href={`/customer/invoices/${invoice.id}/payment`}
                                  className="btn btn-sm btn-success"
                                >
                                  <i className="bi bi-credit-card me-1"></i>
                                  Pay Now
                                </a>
                              )}
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
