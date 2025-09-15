from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Dict, Any

class PaymentService(ABC):
    """Simple payment service interface"""
    
    @abstractmethod
    def create_payment_intent(self, amount: Decimal, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create payment intent with provider"""
        pass
    
    @abstractmethod
    def confirm_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm payment with provider"""
        pass
    
    @abstractmethod
    def cancel_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Cancel payment with provider"""
        pass
    
    @abstractmethod
    def get_payment_status(self, payment_intent_id: str) -> Dict[str, Any]:
        """Get payment status from provider"""
        pass
