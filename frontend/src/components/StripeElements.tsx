'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { STRIPE_CONFIG, ELEMENTS_OPTIONS, STRIPE_ERRORS } from '@/lib/stripe';
import { getStripeErrorMessage } from '@/lib/stripeUtils';

// Props for the Stripe Elements wrapper
interface StripeElementsProps {
  clientSecret: string;
  onPaymentSuccess?: (paymentIntent: any) => void;
  onPaymentError?: (error: string) => void;
  onPaymentProcessing?: () => void;
  children?: React.ReactNode;
  className?: string;
}

// Payment form component
const PaymentForm: React.FC<{
  onPaymentSuccess?: (paymentIntent: any) => void;
  onPaymentError?: (error: string) => void;
  onPaymentProcessing?: () => void;
}> = ({ onPaymentSuccess, onPaymentError, onPaymentProcessing }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError(STRIPE_ERRORS.STRIPE_NOT_LOADED);
      return;
    }

    setIsLoading(true);
    setError(null);
    onPaymentProcessing?.();

    try {
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(getStripeErrorMessage(submitError));
        onPaymentError?.(getStripeErrorMessage(submitError));
        return;
      }

      // Get the payment element
      const paymentElement = elements.getElement(PaymentElement);
      
      if (!paymentElement) {
        setError('Payment element not found');
        onPaymentError?.('Payment element not found');
        return;
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(getStripeErrorMessage(confirmError));
        onPaymentError?.(getStripeErrorMessage(confirmError));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess?.(paymentIntent);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : STRIPE_ERRORS.PROCESSING_ERROR;
      setError(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

// Main Stripe Elements wrapper component
const StripeElements: React.FC<StripeElementsProps> = ({
  clientSecret,
  onPaymentSuccess,
  onPaymentError,
  onPaymentProcessing,
  children,
  className = '',
}) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripe = await loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY);
        if (!stripe) {
          throw new Error(STRIPE_ERRORS.STRIPE_NOT_LOADED);
        }
        setStripePromise(Promise.resolve(stripe));
      } catch (err) {
        setError(err instanceof Error ? err.message : STRIPE_ERRORS.STRIPE_NOT_LOADED);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
        <p className="text-yellow-600">Stripe is not available. Please refresh the page.</p>
      </div>
    );
  }

  const options = {
    ...ELEMENTS_OPTIONS,
    clientSecret,
  };

  return (
    <div className={className}>
      <Elements stripe={stripePromise} options={options}>
        {children || (
          <PaymentForm
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
            onPaymentProcessing={onPaymentProcessing}
          />
        )}
      </Elements>
    </div>
  );
};

export default StripeElements;
