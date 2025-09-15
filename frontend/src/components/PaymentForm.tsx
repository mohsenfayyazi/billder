'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createPayment } from '@/lib/paymentApi';
import StripeCheckout from './StripeCheckout';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here');

interface PaymentFormProps {
  invoiceId: string;
  amount: string;
  onSuccess?: (payment: unknown) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function PaymentForm({ invoiceId, amount, onSuccess, onError, disabled = false }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);

  const handleCreatePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create payment intent
               const result = await createPayment({
                 invoice_id: invoiceId,
                 amount: amount,
                 currency: 'CAD',
                 payment_method: 'card'
               });

      if (result.success) {
        console.log('Payment intent created:', result);
        console.log('Payment object:', result.payment);
        console.log('External payment ID:', result.payment?.external_payment_id);
        console.log('Setting payment intent ID:', result.payment?.external_payment_id);
        setPaymentIntentId(result.payment?.external_payment_id);
        setShowStripeForm(true);
      } else {
        const errorMsg = result.error || 'Payment failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      console.error('Payment error:', err);
      let errorMsg = 'Payment failed';
      
      if (err instanceof Error) {
        if (err.message.includes('Unexpected token')) {
          errorMsg = 'Server error - please check if the backend is running';
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeSuccess = (payment: unknown) => {
    setShowStripeForm(false);
    onSuccess?.(payment);
  };

  const handleStripeError = (error: string) => {
    setError(error);
    onError?.(error);
  };

  if (showStripeForm && paymentIntentId) {
    return (
      <Elements stripe={stripePromise}>
        <StripeCheckout
          amount={amount}
          paymentIntentId={paymentIntentId}
          onSuccess={handleStripeSuccess}
          onError={handleStripeError}
          disabled={disabled}
        />
      </Elements>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Payment</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Amount to pay:</p>
        <p className="text-2xl font-bold">${amount}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={handleCreatePayment}
        disabled={isLoading || disabled}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
                 {isLoading ? 'Creating Payment...' : disabled ? 'Invalid Amount' : `Pay $${amount} CAD`}
      </button>
    </div>
  );
}
