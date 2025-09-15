from .stripe_service import StripePaymentService

def get_payment_service(provider: str = 'stripe'):
    """Simple factory function to get payment service"""
    if provider.lower() == 'stripe':
        return StripePaymentService()
    else:
        raise ValueError(f"Unsupported payment provider: {provider}")
