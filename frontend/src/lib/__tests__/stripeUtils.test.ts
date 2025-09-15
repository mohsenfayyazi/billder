import {
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
} from '../stripeUtils'

describe('stripeUtils', () => {
  describe('getStripeErrorMessage', () => {
    it('should return user-friendly error message for card_declined', () => {
      const error = { code: 'card_declined', message: 'Your card was declined.' }
      expect(getStripeErrorMessage(error)).toBe('Your card was declined. Please try a different payment method.')
    })

    it('should return user-friendly error message for insufficient_funds', () => {
      const error = { code: 'insufficient_funds', message: 'Your card has insufficient funds.' }
      expect(getStripeErrorMessage(error)).toBe('Your card has insufficient funds. Please try a different payment method.')
    })

    it('should return generic message for unknown error', () => {
      const error = { code: 'unknown_error', message: 'Something went wrong.' }
      expect(getStripeErrorMessage(error)).toBe('An error occurred while processing your payment. Please try again.')
    })

    it('should handle error without code', () => {
      const error = { message: 'Generic error message' }
      expect(getStripeErrorMessage(error)).toBe('An error occurred while processing your payment. Please try again.')
    })
  })

  describe('formatAmount', () => {
    it('should format amount in CAD', () => {
      expect(formatAmount(1000, 'CAD')).toBe('$10.00 CAD')
    })

    it('should format amount in USD', () => {
      expect(formatAmount(2500, 'USD')).toBe('$25.00 USD')
    })

    it('should handle zero amount', () => {
      expect(formatAmount(0, 'CAD')).toBe('$0.00 CAD')
    })

    it('should handle large amounts', () => {
      expect(formatAmount(100000, 'CAD')).toBe('$1,000.00 CAD')
    })
  })

  describe('formatAmountForStripe', () => {
    it('should convert dollars to cents', () => {
      expect(formatAmountForStripe(10.50)).toBe(1050)
    })

    it('should handle whole numbers', () => {
      expect(formatAmountForStripe(25)).toBe(2500)
    })

    it('should handle zero', () => {
      expect(formatAmountForStripe(0)).toBe(0)
    })

    it('should round to nearest cent', () => {
      expect(formatAmountForStripe(10.999)).toBe(1100)
    })
  })

  describe('validateCardNumber', () => {
    it('should validate valid card numbers', () => {
      expect(validateCardNumber('4242424242424242')).toBe(true)
      expect(validateCardNumber('4000056655665556')).toBe(true)
    })

    it('should reject invalid card numbers', () => {
      expect(validateCardNumber('1234567890123456')).toBe(false)
      expect(validateCardNumber('424242424242424')).toBe(false)
      expect(validateCardNumber('')).toBe(false)
    })

    it('should handle non-numeric input', () => {
      expect(validateCardNumber('abcd')).toBe(false)
      expect(validateCardNumber('4242-4242-4242-4242')).toBe(false)
    })
  })

  describe('getCardBrand', () => {
    it('should identify Visa cards', () => {
      expect(getCardBrand('4242424242424242')).toBe('visa')
    })

    it('should identify Mastercard', () => {
      expect(getCardBrand('5555555555554444')).toBe('mastercard')
    })

    it('should identify American Express', () => {
      expect(getCardBrand('378282246310005')).toBe('amex')
    })

    it('should return unknown for invalid cards', () => {
      expect(getCardBrand('1234567890123456')).toBe('unknown')
    })
  })

  describe('maskCardNumber', () => {
    it('should mask card number showing last 4 digits', () => {
      expect(maskCardNumber('4242424242424242')).toBe('**** **** **** 4242')
    })

    it('should handle shorter card numbers', () => {
      expect(maskCardNumber('1234567890')).toBe('**** **** 7890')
    })

    it('should handle empty string', () => {
      expect(maskCardNumber('')).toBe('')
    })
  })

  describe('payment status helpers', () => {
    it('should identify requires action status', () => {
      expect(requiresAction('requires_action')).toBe(true)
      expect(requiresAction('succeeded')).toBe(false)
    })

    it('should identify processing status', () => {
      expect(isProcessing('processing')).toBe(true)
      expect(isProcessing('succeeded')).toBe(false)
    })

    it('should identify succeeded status', () => {
      expect(isSucceeded('succeeded')).toBe(true)
      expect(isSucceeded('failed')).toBe(false)
    })

    it('should identify failed status', () => {
      expect(isFailed('failed')).toBe(true)
      expect(isFailed('succeeded')).toBe(false)
    })
  })

  describe('getPaymentStatusText', () => {
    it('should return correct text for each status', () => {
      expect(getPaymentStatusText('succeeded')).toBe('Paid')
      expect(getPaymentStatusText('processing')).toBe('Processing')
      expect(getPaymentStatusText('failed')).toBe('Failed')
      expect(getPaymentStatusText('requires_action')).toBe('Action Required')
      expect(getPaymentStatusText('unknown')).toBe('Unknown')
    })
  })

  describe('getPaymentStatusColor', () => {
    it('should return correct color for each status', () => {
      expect(getPaymentStatusColor('succeeded')).toBe('text-success')
      expect(getPaymentStatusColor('processing')).toBe('text-warning')
      expect(getPaymentStatusColor('failed')).toBe('text-danger')
      expect(getPaymentStatusColor('requires_action')).toBe('text-info')
      expect(getPaymentStatusColor('unknown')).toBe('text-gray-600')
    })
  })
})
