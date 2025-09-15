'use client';

import { useState, useEffect } from 'react';
import PaymentStatus from './PaymentStatus';
import ClientOnly from './ClientOnly';

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  payment_method: string;
  payment_provider: string;
  created_at: string;
  processed_at?: string;
  description?: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
  className?: string;
}

export default function PaymentHistory({ payments, className = '' }: PaymentHistoryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (payments.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        No payments found
      </div>
    );
  }

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

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Payment History</h3>
      
      {payments.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <i className="bi bi-credit-card display-4 text-muted"></i>
          <p className="mt-2">No payments found for this invoice</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <code className="text-muted">{payment.id}</code>
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
      )}
    </div>
  );
}
