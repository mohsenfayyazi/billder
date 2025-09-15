'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchInvoice } from '@/lib/api';
import { createRefund, getInvoicePayments, getRefunds } from '@/lib/refundApi';
import { generateInvoicePDF } from '@/lib/pdfUtils';

interface Invoice {
  id: string;
  reference: string;
  customer_name?: string;
  customer_email?: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  status: string;
  due_date: string;
  created_at: string;
  is_overdue: boolean;
  public_slug?: string;
}

interface Payment {
  id: string;
  amount: string;
  created_at: string;
  status: string;
  payment_method?: string;
  refund_amount?: string;
  refund_status?: string;
  refunded_at?: string;
  external_refund_id?: string;
}

interface Refund {
  id: string;
  payment_reference: string;
  customer_name: string;
  customer_email: string;
  amount: string;
  refund_amount: string;
  refund_status: string;
  refunded_at: string;
  payment_id: string;
  external_payment_id: string;
  external_refund_id: string;
}

export default function InvoiceDetails() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundHistory, setRefundHistory] = useState<Refund[]>([]);
  const [refundHistoryLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [publicLink, setPublicLink] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const [invoiceData, paymentsData] = await Promise.all([
          fetchInvoice(params.id as string),
          getInvoicePayments(params.id as string)
        ]);
        setInvoice(invoiceData);
        setPayments(paymentsData.results || paymentsData || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadInvoice();
    }
  }, [params.id]);

  useEffect(() => {
    async function loadRefundHistory() {
      if (!invoice?.reference) return;
      
      try {
        const refunds = await getRefunds();
        const allRefunds = refunds.refunds || [];
        
        // Filter refunds for the current invoice
        const invoiceRefunds = allRefunds.filter((refund: Refund) => {
          return refund.payment_reference === invoice.reference;
        });
        
        setRefundHistory(invoiceRefunds);
      } catch (err: unknown) {
        console.error('Error loading refund history:', err);
      }
    }

    loadRefundHistory();
  }, [invoice?.reference]);

  const handleRefund = async () => {
    if (!selectedPayment || !refundAmount) return;
    
    setRefundLoading(true);
    try {
      const result = await createRefund({
        payment_id: selectedPayment,
        amount: refundAmount,
        reason: refundReason
      });
      
      if (result.success) {
        alert('Refund processed successfully!');
        setShowRefundModal(false);
        setSelectedPayment('');
        setRefundAmount('');
        setRefundReason('');
        // Reload invoice data
        window.location.reload();
      } else {
        alert(`Refund failed: ${result.error}`);
      }
    } catch (err: unknown) {
      alert(`Refund failed: ${err instanceof Error ? err.message : 'An error occurred'}`);
    } finally {
      setRefundLoading(false);
    }
  };


  const handleShareInvoice = () => {
    if (invoice && invoice.public_slug) {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
      const publicLink = `${frontendUrl}/invoice/${invoice.public_slug}`;
      setPublicLink(publicLink);
      setCopySuccess(false); // Reset copy success state
      setCopying(false); // Reset copying state
      setShowShareModal(true);
    } else {
      alert('Public link not available for this invoice');
    }
  };

  const copyToClipboard = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000); // Hide message after 3 seconds
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = publicLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000); // Hide message after 3 seconds
    } finally {
      setCopying(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!invoice) return;
    
    try {
      // Convert string amounts to numbers for PDF generation
      const invoiceData = {
        ...invoice,
        total_amount: parseFloat(invoice.total_amount.toString()),
        amount_paid: parseFloat(invoice.amount_paid.toString()),
        remaining_balance: parseFloat(invoice.remaining_balance.toString()),
        is_overdue: invoice.is_overdue || false
      };
      
      await generateInvoicePDF(invoiceData, payments);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
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

  if (!invoice) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-warning" role="alert">
              <h4 className="alert-heading">Invoice Not Found</h4>
              <p>The requested invoice could not be found.</p>
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
            <h1>Invoice Details</h1>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-success"
                onClick={handleGeneratePDF}
                title="Download PDF"
              >
                <i className="bi bi-file-pdf me-1"></i>
                Download PDF
              </button>
              <button 
                className="btn btn-outline-primary"
                onClick={handleShareInvoice}
                title="Share invoice with customer"
              >
                <i className="bi bi-share me-1"></i>
                Share Link
              </button>
              <a href="/admin/invoices" className="btn btn-outline-secondary">
                ← Back to Invoices
              </a>
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Invoice Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Reference Number</h6>
                      <p className="text-muted">{invoice.reference}</p>
                      
                      <h6>Customer</h6>
                      <p className="text-muted">
                        {invoice.customer 
                          ? `${invoice.customer.first_name} ${invoice.customer.last_name}`
                          : invoice.customer_name
                        }<br />
                        {invoice.customer 
                          ? invoice.customer.email
                          : invoice.customer_email
                        }
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6>Status</h6>
                      <span className={`badge ${
                        invoice.status === 'paid' ? 'bg-success' :
                        invoice.status === 'partially_paid' ? 'bg-warning' :
                        invoice.status === 'pending' ? 'bg-secondary' :
                        'bg-danger'
                      }`}>
                        {invoice.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {invoice.is_overdue && (
                        <span className="badge bg-danger ms-2">OVERDUE</span>
                      )}
                      
                      <h6 className="mt-3">Due Date</h6>
                      <p className="text-muted">{new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Financial Summary</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Amount:</span>
                    <strong>${invoice.total_amount} CAD</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Amount Paid:</span>
                    <span className="text-success">${invoice.amount_paid} CAD</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span><strong>Remaining Balance:</strong></span>
                    <strong className={invoice.remaining_balance > 0 ? 'text-danger' : 'text-success'}>
                      ${invoice.remaining_balance} CAD
                    </strong>
                  </div>
                </div>
              </div>

              {/* Refund Section */}
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Refund Management</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6>Process Refund</h6>
                        <p className="text-muted">Refund payments for this invoice</p>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-warning btn-sm"
                            onClick={() => setShowRefundModal(true)}
                            disabled={invoice.amount_paid <= 0}
                          >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Process Refund
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6>Refund Information</h6>
                        <div className="bg-light p-3 rounded">
                          <small className="text-muted">
                            <strong>Available for Refund:</strong> ${invoice.amount_paid} CAD<br/>
                            <strong>Refund Policy:</strong> Refunds processed within 1-3 business days<br/>
                            <strong>Note:</strong> Refunds will reopen the invoice for additional payments
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Payment History Section */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Payment History</h5>
                </div>
                <div className="card-body">
                  {payments.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-credit-card display-1 text-muted"></i>
                      <h5 className="mt-3">No Payments Found</h5>
                      <p className="text-muted">No payments have been made for this invoice yet.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Payment ID</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment Method</th>
                            <th>Refund Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>
                                <code className="text-muted">{payment.id}</code>
                              </td>
                              <td>
                                <strong>${parseFloat(payment.amount).toFixed(2)} CAD</strong>
                              </td>
                              <td>
                                <span className={`badge ${
                                  payment.status === 'succeeded' ? 'bg-success' :
                                  payment.status === 'pending' ? 'bg-warning' :
                                  payment.status === 'failed' ? 'bg-danger' :
                                  'bg-secondary'
                                }`}>
                                  {payment.status.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <i className={`bi ${
                                  payment.payment_method === 'card' ? 'bi-credit-card' :
                                  payment.payment_method === 'bank_transfer' ? 'bi-bank' :
                                  'bi-wallet'
                                } me-1`}></i>
                                {payment.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}
                              </td>
                              <td>
                                {payment.refund_status ? (
                                  <div>
                                    <span className={`badge ${
                                      payment.refund_status === 'succeeded' ? 'bg-warning' :
                                      payment.refund_status === 'pending' ? 'bg-secondary' :
                                      payment.refund_status === 'failed' ? 'bg-danger' :
                                      'bg-secondary'
                                    }`}>
                                      REFUNDED
                                    </span>
                                    {payment.refund_amount && (
                                      <div className="mt-1">
                                        <small className="text-muted">
                                          -${parseFloat(payment.refund_amount).toFixed(2)} CAD
                                        </small>
                                      </div>
                                    )}
                                    {payment.refunded_at && (
                                      <div>
                                        <small className="text-muted">
                                          {new Date(payment.refunded_at).toLocaleDateString()}
                                        </small>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted">No refunds</span>
                                )}
                              </td>
                              <td>
                                {new Date(payment.created_at).toLocaleDateString()}
                                <br />
                                <small className="text-muted">
                                  {new Date(payment.created_at).toLocaleTimeString()}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Refund History Section */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Refund History</h5>
                </div>
                <div className="card-body">
                  {refundHistoryLoading ? (
                    <div className="d-flex justify-content-center py-4">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading refunds...</span>
                      </div>
                    </div>
                  ) : refundHistory.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-arrow-clockwise display-1 text-muted"></i>
                      <h5 className="mt-3">No Refunds Found</h5>
                      <p className="text-muted">No refunds have been processed for this invoice yet.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Refund ID</th>
                            <th>Customer</th>
                            <th>Original Amount</th>
                            <th>Refund Amount</th>
                            <th>Status</th>
                            <th>Refunded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {refundHistory.map((refund) => (
                            <tr key={refund.id}>
                              <td>
                                <code className="text-primary">{refund.external_refund_id || 'N/A'}</code>
                                {refund.external_refund_id && (
                                  <div>
                                    <small className="text-muted">Internal: {refund.id}</small>
                                  </div>
                                )}
                              </td>
                              <td>
                                <div>
                                  <div className="fw-medium">{refund.customer_name}</div>
                                  <small className="text-muted">{refund.customer_email}</small>
                                </div>
                              </td>
                              <td>
                                <span className="text-success">${parseFloat(refund.amount).toFixed(2)} CAD</span>
                              </td>
                              <td>
                                <span className="text-danger fw-bold">-${parseFloat(refund.refund_amount).toFixed(2)} CAD</span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  refund.refund_status === 'succeeded' ? 'bg-success' :
                                  refund.refund_status === 'pending' ? 'bg-warning' :
                                  refund.refund_status === 'failed' ? 'bg-danger' :
                                  'bg-secondary'
                                }`}>
                                  {refund.refund_status?.toUpperCase() || 'UNKNOWN'}
                                </span>
                              </td>
                              <td>
                                <div>
                                  {refund.refunded_at ? (
                                    <>
                                      <div>{new Date(refund.refunded_at).toLocaleDateString()}</div>
                                      <small className="text-muted">
                                        {new Date(refund.refunded_at).toLocaleTimeString()}
                                      </small>
                                    </>
                                  ) : (
                                    <span className="text-muted">N/A</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Process Refund</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowRefundModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select Payment</label>
                  <select 
                    className="form-select"
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  >
                    <option value="">Choose a payment...</option>
                    {payments
                      .filter(payment => payment.status === 'succeeded')
                      .map(payment => (
                        <option key={payment.id} value={payment.id}>
                          ${payment.amount} CAD - {new Date(payment.created_at).toLocaleDateString()}
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Refund Amount (CAD)</label>
                  <input
                    type="number"
                    className="form-control"
                    step="0.01"
                    min="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter refund amount"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Reason (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Enter refund reason..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRefundModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={handleRefund}
                  disabled={!selectedPayment || !refundAmount || refundLoading}
                >
                  {refundLoading ? 'Processing...' : 'Process Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Share Modal */}
      {showShareModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Share Invoice with Customer</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowShareModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Share this link with your customer to allow them to view and pay their invoice:
                </p>
                
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={publicLink}
                    readOnly
                    id="shareLink"
                  />
                  <button 
                    className={`btn ${copying ? 'btn-primary' : 'btn-outline-secondary'}`}
                    type="button"
                    onClick={copyToClipboard}
                    disabled={copying}
                  >
                    <i className={`bi ${copying ? 'bi-hourglass-split' : 'bi-clipboard'} me-1`}></i>
                    {copying ? 'Copying...' : 'Copy'}
                  </button>
                </div>

                {copySuccess && (
                  <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Success!</strong> Link copied to clipboard.
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setCopySuccess(false)}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Note:</strong> This link allows customers to view and pay their invoice. 
                  Make sure to share it securely with the intended recipient only.
                </div>

                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-primary"
                    onClick={copyToClipboard}
                  >
                    <i className="bi bi-clipboard me-1"></i>
                    Copy Link
                  </button>
                  <a 
                    href={publicLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i>
                    Open Link
                  </a>
                  <button 
                    className="btn btn-outline-success"
                    onClick={handleGeneratePDF}
                  >
                    <i className="bi bi-file-pdf me-1"></i>
                    Generate PDF
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowShareModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
