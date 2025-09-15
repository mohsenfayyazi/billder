// Simple Payment API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Create payment intent
export async function createPayment(data: {
  invoice_id: string;
  amount: string;
  currency: string;
  payment_method: string;
}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/payments/create_payment/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Confirm payment
export async function confirmPayment(paymentIntentId: string, paymentMethodId?: string) {
  const token = localStorage.getItem('token');
  const requestData = { 
    payment_intent_id: paymentIntentId,
    payment_method_id: paymentMethodId 
  };
  
  console.log('Sending confirm payment request:', requestData);
  
  const response = await fetch(`${API_BASE_URL}/payments/confirm_payment/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });
  
  const result = await response.json();
  console.log('Confirm payment response:', result);
  return result;
}

// Get payment status
export async function getPaymentStatus(paymentId: string) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/status/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}
