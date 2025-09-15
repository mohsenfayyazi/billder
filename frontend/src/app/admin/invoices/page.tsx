'use client';
import { useEffect, useState } from 'react';
import { fetchInvoices } from '@/lib/api';

interface Invoice {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  status: string;
  due_date: string;
  created_at: string;
  is_overdue: boolean;
}

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await fetchInvoices();
        setInvoices(data.results || data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

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
            <h1>Invoices</h1>
            <span className="badge bg-primary fs-6">
              {invoices.length} Total
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <h5 className="card-title">No Invoices Found</h5>
                <p className="card-text text-muted">You haven't created any invoices yet.</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Reference Number</th>
                        <th>Customer</th>
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
                              <div>{invoice.customer_name}</div>
                              <small className="text-muted">{invoice.customer_email}</small>
                            </div>
                          </td>
                          <td>${parseFloat(invoice.total_amount).toFixed(2)} CAD</td>
                          <td>${parseFloat(invoice.amount_paid).toFixed(2)} CAD</td>
                          <td>
                            <span className={invoice.remaining_balance > 0 ? 'text-danger' : 'text-success'}>
                              ${parseFloat(invoice.remaining_balance).toFixed(2)} CAD
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
                            {invoice.is_overdue && (
                              <span className="badge bg-danger ms-1">OVERDUE</span>
                            )}
                          </td>
                          <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <a href={`/admin/invoices/${invoice.id}`} className="btn btn-sm btn-primary">
                                View Details
                              </a>
                              
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
