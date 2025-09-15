'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { fetchPublicInvoice } from '@/lib/api';
import { generateInvoicePDF } from '@/lib/pdfUtils';

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

interface PaymentData {
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

export default function PublicInvoiceDetails() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const autoGeneratePDF = useCallback(async (invoiceData: Invoice, paymentsData: PaymentData[]) => {
    if (pdfGenerating || pdfGenerated) return;
    
    setPdfGenerating(true);
    try {
      // Convert string amounts to numbers for PDF generation
      const invoiceForPDF = {
        ...invoiceData,
        total_amount: parseFloat(invoiceData.total_amount),
        amount_paid: parseFloat(invoiceData.amount_paid),
        remaining_balance: parseFloat(invoiceData.remaining_balance || '0'),
        is_overdue: invoiceData.is_overdue || false
      };
      
      await generateInvoicePDF(invoiceForPDF, paymentsData);
      setPdfGenerated(true);
      setShowSuccess(true);
      
      // Auto-close the page after PDF download starts
      setTimeout(() => {
        window.close();
        // If window.close() doesn't work (some browsers block it), redirect to a simple page
        if (!window.closed) {
          window.location.href = 'about:blank';
        }
      }, 2000); // Wait 2 seconds to ensure PDF download has started
      
    } catch (error) {
      console.error('Error auto-generating PDF:', error);
      // Show error message and close after delay
      setTimeout(() => {
        window.close();
        if (!window.closed) {
          window.location.href = 'about:blank';
        }
      }, 3000);
    } finally {
      setPdfGenerating(false);
    }
  }, [pdfGenerating, pdfGenerated]);

  const loadInvoice = useCallback(async () => {
    try {
      const data = await fetchPublicInvoice(params.slug as string);
      
      if (data.success) {
        setInvoice(data.invoice);
        setPayments(data.payments || []);
        
        // Automatically generate PDF after data is loaded
        if (!pdfGenerated) {
          await autoGeneratePDF(data.invoice, data.payments || []);
        }
      } else {
        setError(data.error || 'Failed to load invoice');
      }
    } catch (err) {
      setError('Failed to load invoice');
      console.error('Error loading invoice:', err);
    } finally {
      setLoading(false);
    }
  }, [params.slug, pdfGenerated, autoGeneratePDF]);

  useEffect(() => {
    if (params.slug) {
      loadInvoice();
    }
  }, [params.slug, loadInvoice]);

  if (loading || pdfGenerating) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">
                {loading ? 'Loading invoice...' : 'Generating PDF...'}
              </p>
              {pdfGenerating && (
                <div className="alert alert-info mt-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Your invoice PDF is being generated and will download automatically. 
                  This page will close shortly.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <div className="text-success mb-4">
                <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
              </div>
              <h3 className="text-success mb-3">PDF Downloaded Successfully!</h3>
              <p className="text-muted mb-4">
                Your invoice PDF has been downloaded to your device.
                <br />
                This page will close automatically.
              </p>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Closing...</span>
              </div>
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
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Processing...</span>
            </div>
            <p className="mt-3">Processing your invoice...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

