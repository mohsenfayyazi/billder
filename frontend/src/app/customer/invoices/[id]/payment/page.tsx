'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchInvoice } from '@/lib/api';
import PaymentForm from '@/components/PaymentForm';
import ClientOnly from '@/components/ClientOnly';

interface Invoice {
  id: string;
  reference: string;
  total_amount: string;
  amount_paid: string;
  status: string;
  due_date: string;
  currency?: string;
  remaining_balance?: string;
  is_overdue?: boolean;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  owner?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function CustomerPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (params.id) {
      loadInvoice();
    }
  }, [params.id, loadInvoice]);

  const loadInvoice = useCallback(async () => {
    try {
      const data = await fetchInvoice(params.id as string);
      setInvoice(data);
      setPaymentAmount(data.remaining_balance || (parseFloat(data.total_amount) - parseFloat(data.amount_paid)).toFixed(2));
    } catch (err) {
      setError('Failed to load invoice');
      console.error('Error loading invoice:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const getRemainingAmount = () => {
    if (!invoice) return '0.00';
    // Use API-provided remaining_balance if available, otherwise calculate
    if (invoice.remaining_balance !== undefined) {
      return parseFloat(invoice.remaining_balance).toFixed(2);
    }
    const totalAmount = parseFloat(invoice.total_amount);
    const paidAmount = parseFloat(invoice.amount_paid);
    return (totalAmount - paidAmount).toFixed(2);
  };

  const canMakePayment = () => {
    const remaining = parseFloat(getRemainingAmount());
    return remaining > 0 && invoice?.status !== 'paid';
  };

  const handlePaymentSuccess = () => {
    // Redirect to invoice details page
    router.push(`/customer/invoices/${invoice?.id}`);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading payment page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              {error || 'Invoice not found'}
            </div>
            <Link href="/customer/invoices" className="btn btn-outline-secondary">
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!canMakePayment()) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <i className="bi bi-check-circle-fill text-success display-1"></i>
              <h2 className="mt-3 text-success">Invoice Already Paid</h2>
              <p className="text-muted">This invoice has been fully paid.</p>
              <a href={`/customer/invoices/${invoice.id}`} className="btn btn-primary">
                View Invoice Details
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">Make Payment</h1>
              <p className="text-muted mb-0">Invoice {invoice.reference}</p>
            </div>
            <a href={`/customer/invoices/${invoice.id}`} className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1"></i>
              Back to Invoice
            </a>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Payment Details</h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <div className="row">
                  <div className="col-6">
                    <p className="text-muted mb-1">Customer</p>
                    <p className="fw-bold mb-0">
                      {invoice.customer ? `${invoice.customer.first_name} ${invoice.customer.last_name}` : 'N/A'}
                    </p>
                  </div>
                  <div className="col-6">
                    <p className="text-muted mb-1">Due Date</p>
                    <p className="fw-bold mb-0">
                      <ClientOnly fallback={invoice.due_date}>
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </ClientOnly>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-light rounded">
                <div className="row text-center">
                  <div className="col-4">
                    <p className="text-muted small mb-1">Total Amount</p>
                    <p className="h5 mb-0">${invoice.total_amount}</p>
                  </div>
                  <div className="col-4">
                    <p className="text-muted small mb-1">Amount Paid</p>
                    <p className="h5 text-success mb-0">${invoice.amount_paid}</p>
                  </div>
                  <div className="col-4">
                    <p className="text-muted small mb-1">Amount Due</p>
                    <p className="h5 text-warning mb-0">${getRemainingAmount()}</p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="paymentAmount" className="form-label">Payment Amount</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    id="paymentAmount"
                    step="0.01"
                    min="0.01"
                    max={getRemainingAmount()}
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(e.target.value);
                    }}
                    placeholder="Enter amount to pay"
                  />
                </div>
                <div className="form-text">
                  Maximum amount: ${getRemainingAmount()}
                  {paymentAmount && parseFloat(paymentAmount) > parseFloat(getRemainingAmount()) && (
                    <div className="text-danger mt-1">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Amount cannot exceed remaining balance
                    </div>
                  )}
                </div>
              </div>

              <PaymentForm
                invoiceId={invoice.id}
                amount={paymentAmount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                disabled={!paymentAmount || parseFloat(paymentAmount) > parseFloat(getRemainingAmount()) || parseFloat(paymentAmount) <= 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}