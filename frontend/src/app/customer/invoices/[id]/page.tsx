'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchInvoice, fetchInvoicePayments } from '@/lib/api';
import PaymentForm from '@/components/PaymentForm';
import PaymentHistory from '@/components/PaymentHistory';
import ClientOnly from '@/components/ClientOnly';

interface Invoice {
  id: string;
  reference: string;
  total_amount: string;
  amount_paid: string;
  status: string;
  due_date: string;
  created_at: string;
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

export default function CustomerInvoiceDetails() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    setMounted(true);
    if (params.id) {
      loadInvoice();
    }
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      const [invoiceData, paymentsData] = await Promise.all([
        fetchInvoice(params.id as string),
        fetchInvoicePayments(params.id as string)
      ]);
      console.log('Loaded invoice data:', invoiceData);
      console.log('Remaining balance:', invoiceData.remaining_balance);
      console.log('Amount paid:', invoiceData.amount_paid);
      console.log('Total amount:', invoiceData.total_amount);
      setInvoice(invoiceData);
      setPayments(paymentsData.results || paymentsData || []);
      setPaymentAmount(invoiceData.remaining_balance || (parseFloat(invoiceData.total_amount) - parseFloat(invoiceData.amount_paid)).toFixed(2));
    } catch (err) {
      setError('Failed to load invoice');
      console.error('Error loading invoice:', err);
    } finally {
      setLoading(false);
    }
  };

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
    const canPay = remaining > 0 && invoice?.status !== 'paid';
    console.log('canMakePayment check:', {
      remaining,
      status: invoice?.status,
      canPay,
      remaining_balance: invoice?.remaining_balance,
      amount_paid: invoice?.amount_paid,
      total_amount: invoice?.total_amount
    });
    return canPay;
  };

  const handlePaymentSuccess = async (payment: any) => {
    console.log('Payment successful, reloading invoice...', payment);
    // Add a small delay to allow backend to process the payment
    setTimeout(async () => {
      await loadInvoice();
      console.log('Invoice reloaded after payment');
    }, 1000);
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
              <p className="mt-2">Loading invoice...</p>
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
              <h1 className="h3 mb-0">Invoice {invoice.reference}</h1>
              <p className="text-muted mb-0">Invoice details and payment</p>
            </div>
            <a href="/customer/invoices" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1"></i>
              Back to Invoices
            </a>
          </div>

          <div className="row">
            {/* Invoice Details */}
            <div className="col-lg-8">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="card-title mb-0">Invoice Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Bill To:</h6>
                      {invoice.customer ? (
                        <>
                          <p className="mb-1">
                            {invoice.customer.first_name} {invoice.customer.last_name}
                          </p>
                          <p className="text-muted small mb-0">{invoice.customer.email}</p>
                        </>
                      ) : (
                        <p className="text-muted">Customer information not available</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <h6>From:</h6>
                      {invoice.owner ? (
                        <>
                          <p className="mb-1">
                            {invoice.owner.first_name} {invoice.owner.last_name}
                          </p>
                          <p className="text-muted small mb-0">{invoice.owner.email}</p>
                        </>
                      ) : (
                        <p className="text-muted">Business information not available</p>
                      )}
                    </div>
                  </div>
                  
                  <hr />
                  
                  <div className="row">
                    <div className="col-md-3">
                      <h6>Invoice Date</h6>
                      <p>
                        <ClientOnly fallback={invoice.created_at}>
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </ClientOnly>
                      </p>
                    </div>
                    <div className="col-md-3">
                      <h6>Due Date</h6>
                      <p>
                        <ClientOnly fallback={invoice.due_date}>
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </ClientOnly>
                      </p>
                    </div>
                    <div className="col-md-3">
                      <h6>Status</h6>
                      <span className={`badge ${
                        invoice.status === 'paid' ? 'bg-success' : 
                        invoice.status === 'overdue' ? 'bg-danger' : 'bg-warning'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <h6>Reference</h6>
                      <p className="font-monospace">{invoice.reference}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <PaymentHistory payments={payments} />
            </div>

            {/* Payment Section */}
            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Payment Summary</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Total Amount:</span>
                      <span className="fw-bold">${invoice.total_amount} CAD</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Amount Paid:</span>
                      <span className="text-success">${invoice.amount_paid} CAD</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">Remaining:</span>
                      <span className="fw-bold text-warning">${getRemainingAmount()} CAD</span>
                    </div>
                  </div>

                  {canMakePayment() ? (
                    <>
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
                          Maximum amount: ${getRemainingAmount()} CAD
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
                    </>
                  ) : (
                    <div className="text-center">
                      <i className="bi bi-check-circle-fill text-success display-4"></i>
                      <p className="mt-2 text-success fw-bold">Invoice Paid</p>
                      <p className="text-muted small">This invoice has been fully paid.</p>
                    </div>
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
