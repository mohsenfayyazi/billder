import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Stripe configuration object
export const STRIPE_CONFIG = {
  PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY,
  CURRENCY: 'USD',
  COUNTRY: 'US',
  // Stripe Elements appearance
  APPEARANCE: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '4px',
    },
  },
  // Payment method types
  PAYMENT_METHOD_TYPES: ['card'] as const,
  // Supported currencies
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const,
};

// Helper function to check if Stripe is properly configured
export const isStripeConfigured = (): boolean => {
  return STRIPE_PUBLISHABLE_KEY !== 'pk_test_your_publishable_key_here' && 
         STRIPE_PUBLISHABLE_KEY.startsWith('pk_');
};

// Error messages for Stripe operations
export const STRIPE_ERRORS = {
  INVALID_PUBLISHABLE_KEY: 'Invalid Stripe publishable key. Please check your environment variables.',
  STRIPE_NOT_LOADED: 'Stripe failed to load. Please refresh the page and try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again or use a different payment method.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  CARD_DECLINED: 'Your card was declined. Please try a different payment method.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please try a different payment method.',
  EXPIRED_CARD: 'Your card has expired. Please use a different payment method.',
  INCORRECT_CVC: 'Your card\'s security code is incorrect. Please try again.',
  PROCESSING_ERROR: 'An error occurred while processing your payment. Please try again.',
} as const;

// Stripe Elements options
export const ELEMENTS_OPTIONS = {
  mode: 'payment' as const,
  currency: STRIPE_CONFIG.CURRENCY,
  appearance: STRIPE_CONFIG.APPEARANCE,
  paymentMethodTypes: STRIPE_CONFIG.PAYMENT_METHOD_TYPES,
};

// Payment intent confirmation options
export const PAYMENT_CONFIRM_OPTIONS = {
  return_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
};

export default getStripe;
