"""
Simple Stripe Webhook Handler
"""
import stripe
import json
import logging
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
from django.utils import timezone
from .models import Payment, Invoice

logger = logging.getLogger(__name__)

@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    This endpoint receives real-time notifications from Stripe
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        # Verify webhook signature (security check)
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return HttpResponseBadRequest("Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return HttpResponseBadRequest("Invalid signature")
    
    # Handle the event
    try:
        if event['type'] == 'payment_intent.succeeded':
            handle_payment_succeeded(event['data']['object'])
        elif event['type'] == 'payment_intent.payment_failed':
            handle_payment_failed(event['data']['object'])
        elif event['type'] == 'payment_intent.canceled':
            handle_payment_canceled(event['data']['object'])
        else:
            logger.info(f"Unhandled event type: {event['type']}")
        
        return HttpResponse(status=200)
        
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return HttpResponseBadRequest("Webhook processing failed")

def handle_payment_succeeded(payment_intent):
    """Handle successful payment"""
    try:
        payment_intent_id = payment_intent['id']
        
        # Find payment in our database
        payment = Payment.objects.get(external_payment_id=payment_intent_id)
        
        # Update payment status
        payment.status = Payment.Status.SUCCEEDED
        payment.processed_at = timezone.now()
        payment.external_charge_id = payment_intent.get('latest_charge')
        payment.save()
        
        # Update invoice amount_paid
        invoice = payment.invoice
        invoice.amount_paid += payment.amount
        
        # Check if invoice is fully paid
        if invoice.amount_paid >= invoice.total_amount:
            invoice.status = 'paid'
        
        invoice.save()
        
        logger.info(f"Payment succeeded: {payment.id} for invoice {invoice.reference}")
        
    except Payment.DoesNotExist:
        logger.error(f"Payment not found for intent: {payment_intent_id}")
    except Exception as e:
        logger.error(f"Error handling payment succeeded: {e}")

def handle_payment_failed(payment_intent):
    """Handle failed payment"""
    try:
        payment_intent_id = payment_intent['id']
        
        # Find payment in our database
        payment = Payment.objects.get(external_payment_id=payment_intent_id)
        
        # Update payment status
        payment.status = Payment.Status.FAILED
        payment.save()
        
        logger.info(f"Payment failed: {payment.id} for invoice {payment.invoice.reference}")
        
    except Payment.DoesNotExist:
        logger.error(f"Payment not found for intent: {payment_intent_id}")
    except Exception as e:
        logger.error(f"Error handling payment failed: {e}")

def handle_payment_canceled(payment_intent):
    """Handle canceled payment"""
    try:
        payment_intent_id = payment_intent['id']
        
        # Find payment in our database
        payment = Payment.objects.get(external_payment_id=payment_intent_id)
        
        # Update payment status
        payment.status = Payment.Status.CANCELED
        payment.save()
        
        logger.info(f"Payment canceled: {payment.id} for invoice {payment.invoice.reference}")
        
    except Payment.DoesNotExist:
        logger.error(f"Payment not found for intent: {payment_intent_id}")
    except Exception as e:
        logger.error(f"Error handling payment canceled: {e}")
