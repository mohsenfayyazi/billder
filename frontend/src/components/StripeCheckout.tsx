'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { confirmPayment } from '@/lib/paymentApi';

interface StripeCheckoutProps {
  amount: string;
  paymentIntentId: string;
  onSuccess?: (payment: unknown) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function StripeCheckout({ 
  amount, 
  paymentIntentId, 
  onSuccess, 
  onError, 
  disabled = false 
}: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || disabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setIsLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || 'Card validation failed');
        onError?.(stripeError.message || 'Card validation failed');
        return;
      }

      // Confirm payment with backend
      console.log('Confirming payment with:', { paymentIntentId, paymentMethodId: paymentMethod.id });
      const result = await confirmPayment(paymentIntentId, paymentMethod.id);
      console.log('Payment confirmation result:', result);

      if (result.success) {
        onSuccess?.(result.payment);
      } else {
        const errorMsg = result.error || 'Payment failed';
        console.error('Payment failed with error:', errorMsg, 'Full result:', result);
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Amount to pay:</p>
        <p className="text-2xl font-bold">${amount}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || isLoading || disabled}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : disabled ? 'Invalid Amount' : `Pay $${amount} CAD`}
        </button>
      </form>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div className="flex items-center">
          <i className="bi bi-info-circle text-yellow-600 me-2"></i>
          <p className="text-sm text-yellow-800 mb-0">
            <strong>Secure Payment:</strong> Your card information is processed securely by Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
