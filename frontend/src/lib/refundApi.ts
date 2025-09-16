// Refund API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' 
  ? 'http://127.0.0.1:8000/api' 
  : 'https://mobile-enrica-billder-b7b36c60.koyeb.app/api');

// Create refund
export async function createRefund(data: {
  payment_id: string;
  amount: string;
  reason?: string;
}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/payments/create_refund/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Get refunds list
export async function getRefunds() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/payments/refunds/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

// Get payments for an invoice (for refund selection)
export async function getInvoicePayments(invoiceId: string) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/payments/?invoice=${invoiceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}
