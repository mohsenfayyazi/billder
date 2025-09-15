import stripe
from decimal import Decimal
from typing import Dict, Any
from django.conf import settings
from .payment_service import PaymentService
import logging

logger = logging.getLogger(__name__)

class StripePaymentService(PaymentService):
    """Simple Stripe payment service implementation"""
    
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
    
    def create_payment_intent(self, amount: Decimal, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create Stripe payment intent"""
        try:
            # Check if Stripe API key is valid
            if not stripe.api_key or stripe.api_key.startswith('sk_test_your_') or stripe.api_key.startswith('sk_live_your_'):
                raise ValueError("Invalid Stripe API key")
                
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency='cad',  # Force CAD currency
                metadata=metadata,
                payment_method_types=['card'],  # Only allow card payments
            )
            
            return {
                'success': True,
                'payment_intent_id': intent.id,
                'client_secret': intent.client_secret,
                'status': intent.status,
                'amount': amount,
                'currency': currency
            }
            
        except (stripe.error.StripeError, ValueError) as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'stripe_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error creating payment intent: {e}")
            return {
                'success': False,
                'error': 'Internal server error',
                'error_type': 'internal_error'
            }
    
    def confirm_payment(self, payment_intent_id: str, payment_method_id: str = None) -> Dict[str, Any]:
        """Confirm Stripe payment intent"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if intent.status == 'succeeded':
                return {
                    'success': True,
                    'status': 'succeeded',
                    'payment_intent_id': payment_intent_id
                }
            
            if intent.status == 'requires_payment_method':
                if payment_method_id:
                    # Confirm the payment intent with the payment method
                    confirmed_intent = stripe.PaymentIntent.confirm(
                        payment_intent_id,
                        payment_method=payment_method_id
                    )
                    return {
                        'success': True,
                        'status': confirmed_intent.status,
                        'payment_intent_id': payment_intent_id
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Payment method required',
                        'error_type': 'payment_method_required'
                    }
            
            return {
                'success': True,
                'status': intent.status,
                'payment_intent_id': payment_intent_id
            }
            
        except stripe.error.CardError as e:
            logger.error(f"Stripe card error: {e}")
            return {
                'success': False,
                'error': f"Card error: {e.user_message or str(e)}",
                'error_type': 'card_error'
            }
        except stripe.error.InvalidRequestError as e:
            logger.error(f"Stripe invalid request error: {e}")
            return {
                'success': False,
                'error': f"Invalid request: {str(e)}",
                'error_type': 'invalid_request_error'
            }
        except stripe.error.AuthenticationError as e:
            logger.error(f"Stripe authentication error: {e}")
            return {
                'success': False,
                'error': "Authentication failed with Stripe",
                'error_type': 'authentication_error'
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment: {e}")
            return {
                'success': False,
                'error': f"Stripe error: {str(e)}",
                'error_type': 'stripe_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error confirming payment: {e}")
            return {
                'success': False,
                'error': 'Internal server error',
                'error_type': 'internal_error'
            }
    
    def cancel_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Cancel Stripe payment intent"""
        try:
            intent = stripe.PaymentIntent.cancel(payment_intent_id)
            
            return {
                'success': True,
                'status': intent.status,
                'payment_intent_id': payment_intent_id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling payment: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'stripe_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error canceling payment: {e}")
            return {
                'success': False,
                'error': 'Internal server error',
                'error_type': 'internal_error'
            }
    
    def get_payment_status(self, payment_intent_id: str) -> Dict[str, Any]:
        """Get Stripe payment status"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                'success': True,
                'status': intent.status,
                'payment_intent_id': payment_intent_id,
                'amount': intent.amount / 100,  # Convert from cents
                'currency': intent.currency
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error getting payment status: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'stripe_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error getting payment status: {e}")
            return {
                'success': False,
                'error': 'Internal server error',
                'error_type': 'internal_error'
            }

    def create_refund(self, payment_intent_id: str, amount: Decimal = None) -> Dict[str, Any]:
        """Create Stripe refund"""
        try:
            # Get the payment intent
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            # Get the latest charge
            charges = stripe.Charge.list(payment_intent=payment_intent_id)
            if not charges.data:
                return {
                    'success': False,
                    'error': 'No charge found for this payment',
                    'error_type': 'no_charge'
                }
            
            charge = charges.data[0]
            
            # Create refund
            refund_data = {'charge': charge.id}
            if amount:
                refund_data['amount'] = int(amount * 100)  # Convert to cents
            
            refund = stripe.Refund.create(**refund_data)
            
            return {
                'success': True,
                'refund_id': refund.id,
                'status': refund.status,
                'amount': refund.amount / 100,  # Convert back to dollars
                'charge_id': charge.id
            }
            
        except stripe.error.InvalidRequestError as e:
            logger.error(f"Stripe invalid request error: {e}")
            return {
                'success': False,
                'error': f"Invalid request: {str(e)}",
                'error_type': 'invalid_request_error'
            }
        except stripe.error.CardError as e:
            logger.error(f"Stripe card error: {e}")
            return {
                'success': False,
                'error': f"Card error: {e.user_message or str(e)}",
                'error_type': 'card_error'
            }
        except stripe.error.AuthenticationError as e:
            logger.error(f"Stripe authentication error: {e}")
            return {
                'success': False,
                'error': "Authentication failed with Stripe",
                'error_type': 'authentication_error'
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {e}")
            return {
                'success': False,
                'error': f"Stripe error: {str(e)}",
                'error_type': 'stripe_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error creating refund: {e}")
            return {
                'success': False,
                'error': 'Internal server error',
                'error_type': 'internal_error'
            }
