import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceData {
  id: string;
  reference: string;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  status: string;
  due_date: string;
  created_at: string;
  is_overdue: boolean;
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
}

export class InvoicePDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  /**
   * Generate PDF from invoice data
   */
  async generateInvoicePDF(invoice: InvoiceData, payments?: PaymentData[]): Promise<void> {
    // Set up the document
    this.doc = new jsPDF();
    
    // Add header
    this.addHeader();
    
    // Add invoice details
    this.addInvoiceDetails(invoice);
    
    // Add customer information
    this.addCustomerInfo(invoice);
    
    // Add financial summary
    this.addFinancialSummary(invoice);
    
    // Add payment history if available
    if (payments && payments.length > 0) {
      this.addPaymentHistory(payments);
    }
    
    // Add footer
    this.addFooter();
    
    // Save the PDF
    this.doc.save(`invoice_${invoice.reference}.pdf`);
  }

  /**
   * Generate PDF from HTML element
   */
  async generatePDFFromElement(elementId: string, filename: string = 'invoice.pdf'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Get canvas dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create new PDF
      this.doc = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to PDF
      this.doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        this.doc.addPage();
        this.doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      this.doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF from element:', error);
      throw error;
    }
  }

  private addHeader(): void {
    // Company name
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('BILLDER', 105, 20, { align: 'center' });
    
    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Invoice Management System', 105, 28, { align: 'center' });
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    
    // Add line
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 35, 190, 35);
  }

  private addInvoiceDetails(invoice: InvoiceData): void {
    let yPosition = 50;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Invoice Details', 20, yPosition);
    yPosition += 10;
    
    // Invoice information
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const details = [
      ['Invoice Reference:', invoice.reference],
      ['Invoice Date:', new Date(invoice.created_at).toLocaleDateString()],
      ['Due Date:', new Date(invoice.due_date).toLocaleDateString()],
      ['Status:', invoice.status.replace('_', ' ').toUpperCase()],
    ];
    
    if (invoice.is_overdue) {
      details.push(['Overdue:', 'YES']);
    }
    
    details.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, 20, yPosition);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, 80, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
  }

  private addCustomerInfo(invoice: InvoiceData): void {
    let yPosition = 120;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Customer Information', 20, yPosition);
    yPosition += 10;
    
    // Customer details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    if (invoice.customer) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Customer Name:', 20, yPosition);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${invoice.customer.first_name} ${invoice.customer.last_name}`, 80, yPosition);
      yPosition += 6;
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Email:', 20, yPosition);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(invoice.customer.email, 80, yPosition);
    } else {
      this.doc.text('Customer information not available', 20, yPosition);
    }
    
    yPosition += 15;
  }

  private addFinancialSummary(invoice: InvoiceData): void {
    let yPosition = 180;
    
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Financial Summary', 20, yPosition);
    yPosition += 10;
    
    // Financial details
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    const totalAmount = parseFloat(invoice.total_amount.toString()).toFixed(2);
    const amountPaid = parseFloat(invoice.amount_paid.toString()).toFixed(2);
    const remainingBalance = parseFloat(invoice.remaining_balance.toString()).toFixed(2);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Total Amount:', 20, yPosition);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`$${totalAmount} CAD`, 80, yPosition);
    yPosition += 8;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Amount Paid:', 20, yPosition);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`$${amountPaid} CAD`, 80, yPosition);
    yPosition += 8;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Remaining Balance:', 20, yPosition);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`$${remainingBalance} CAD`, 80, yPosition);
  }

  private addPaymentHistory(payments: PaymentData[]): void {
    // Always start payment history on a new page
    this.doc.addPage();
    let yPosition = 20;
    
    if (payments.length === 0) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(12);
      this.doc.text('No payment history available.', 20, yPosition);
      return;
    }
    
    // Section title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Payment History', 20, yPosition);
    yPosition += 20;
    
    // Table headers
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Date', 20, yPosition);
    this.doc.text('Amount', 80, yPosition);
    this.doc.text('Status', 130, yPosition);
    this.doc.text('Method', 180, yPosition);
    this.doc.text('Refund Status', 230, yPosition);
    yPosition += 8;
    
    // Add line under headers
    this.doc.setLineWidth(0.5);
    this.doc.line(20, yPosition - 2, 280, yPosition - 2);
    yPosition += 5;
    
    // Payment rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    payments.forEach((payment) => {
      // Check if we need a new page for additional payments
      if (yPosition > 270) {
        this.doc.addPage();
        yPosition = 20;
      }
      
      // Date
      this.doc.text(new Date(payment.created_at).toLocaleDateString(), 20, yPosition);
      
      // Amount
      this.doc.text(`$${parseFloat(payment.amount).toFixed(2)} CAD`, 80, yPosition);
      
      // Status
      this.doc.text(payment.status.toUpperCase(), 130, yPosition);
      
      // Payment Method
      this.doc.text(payment.payment_method?.toUpperCase() || 'N/A', 180, yPosition);
      
      // Refund Status
      if (payment.refund_status) {
        this.doc.text('REFUNDED', 230, yPosition);
        if (payment.refund_amount) {
          this.doc.text(`-$${parseFloat(payment.refund_amount).toFixed(2)}`, 230, yPosition + 4);
        }
      } else {
        this.doc.text('No refunds', 230, yPosition);
      }
      
      yPosition += 8;
    });
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setLineWidth(0.3);
      this.doc.line(20, 280, 190, 280);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('Thank you for your business!', 20, 285);
      this.doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 290);
      this.doc.text(`Page ${i} of ${pageCount}`, 170, 290, { align: 'right' });
    }
  }
}

// Utility function to generate PDF from invoice data
export const generateInvoicePDF = async (invoice: InvoiceData, payments?: PaymentData[]): Promise<void> => {
  const generator = new InvoicePDFGenerator();
  await generator.generateInvoicePDF(invoice, payments);
};

// Utility function to generate PDF from HTML element
export const generatePDFFromElement = async (elementId: string, filename?: string): Promise<void> => {
  const generator = new InvoicePDFGenerator();
  await generator.generatePDFFromElement(elementId, filename);
};
