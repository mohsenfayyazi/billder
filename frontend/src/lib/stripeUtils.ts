import { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { STRIPE_ERRORS } from './stripe';

// Payment intent status types
export type PaymentIntentStatus = 
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

// Payment method types
export type PaymentMethodType = 'card' | 'us_bank_account' | 'sepa_debit';

// Stripe error types
export interface StripeError {
  type: string;
  code?: string;
  message: string;
  decline_code?: string;
}

// Payment form data
export interface PaymentFormData {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

// Payment confirmation result
export interface PaymentConfirmationResult {
  success: boolean;
  paymentIntent?: Stripe.PaymentIntent;
  error?: string;
  requiresAction?: boolean;
}

// Helper function to get user-friendly error message
export const getStripeErrorMessage = (error: StripeError): string => {
  if (error.type === 'card_error') {
    switch (error.code) {
      case 'card_declined':
        return STRIPE_ERRORS.CARD_DECLINED;
      case 'insufficient_funds':
        return STRIPE_ERRORS.INSUFFICIENT_FUNDS;
      case 'expired_card':
        return STRIPE_ERRORS.EXPIRED_CARD;
      case 'incorrect_cvc':
        return STRIPE_ERRORS.INCORRECT_CVC;
      default:
        return error.message || STRIPE_ERRORS.PAYMENT_FAILED;
    }
  }
  
  if (error.type === 'validation_error') {
    return error.message || 'Please check your payment information.';
  }
  
  if (error.type === 'api_error') {
    return STRIPE_ERRORS.PROCESSING_ERROR;
  }
  
  if (error.type === 'authentication_error') {
    return STRIPE_ERRORS.STRIPE_NOT_LOADED;
  }
  
  return error.message || STRIPE_ERRORS.PAYMENT_FAILED;
};

// Helper function to format amount for display
export const formatAmount = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

// Helper function to format amount for Stripe (convert to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Helper function to validate card number (basic validation)
export const validateCardNumber = (cardNumber: string): boolean => {
  // Remove spaces and non-digits
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Check if it's a valid length (13-19 digits)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Luhn algorithm validation
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Helper function to get card brand from number
export const getCardBrand = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('4')) return 'visa';
  if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
  if (cleaned.startsWith('3')) return 'amex';
  if (cleaned.startsWith('6')) return 'discover';
  
  return 'unknown';
};

// Helper function to mask card number
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return cardNumber;
  
  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  return masked + lastFour;
};

// Helper function to check if payment requires action
export const requiresAction = (status: PaymentIntentStatus): boolean => {
  return status === 'requires_action' || status === 'requires_confirmation';
};

// Helper function to check if payment is processing
export const isProcessing = (status: PaymentIntentStatus): boolean => {
  return status === 'processing' || status === 'requires_capture';
};

// Helper function to check if payment succeeded
export const isSucceeded = (status: PaymentIntentStatus): boolean => {
  return status === 'succeeded';
};

// Helper function to check if payment failed
export const isFailed = (status: PaymentIntentStatus): boolean => {
  return status === 'canceled' || status === 'requires_payment_method';
};

// Helper function to get payment status display text
export const getPaymentStatusText = (status: PaymentIntentStatus): string => {
  switch (status) {
    case 'requires_payment_method':
      return 'Payment method required';
    case 'requires_confirmation':
      return 'Payment confirmation required';
    case 'requires_action':
      return 'Additional action required';
    case 'processing':
      return 'Processing payment...';
    case 'requires_capture':
      return 'Payment captured';
    case 'canceled':
      return 'Payment canceled';
    case 'succeeded':
      return 'Payment successful';
    default:
      return 'Unknown status';
  }
};

// Helper function to get payment status color
export const getPaymentStatusColor = (status: PaymentIntentStatus): string => {
  switch (status) {
    case 'succeeded':
      return 'text-green-600';
    case 'processing':
    case 'requires_capture':
      return 'text-blue-600';
    case 'requires_action':
    case 'requires_confirmation':
      return 'text-yellow-600';
    case 'canceled':
    case 'requires_payment_method':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export default {
  getStripeErrorMessage,
  formatAmount,
  formatAmountForStripe,
  validateCardNumber,
  getCardBrand,
  maskCardNumber,
  requiresAction,
  isProcessing,
  isSucceeded,
  isFailed,
  getPaymentStatusText,
  getPaymentStatusColor,
};
