from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Sum, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Invoice, Payment
from .serializers import (
    InvoiceListSerializer, 
    InvoiceDetailSerializer,
    InvoiceCreateSerializer,
    PaymentSerializer, 
    PaymentCreateSerializer, 
    PaymentConfirmSerializer,
    PaymentStatusSerializer,
    RefundCreateSerializer,
    RefundSerializer
)
import logging

logger = logging.getLogger(__name__)

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices.
    
    Provides CRUD operations for invoices with role-based access:
    - Business owners: Can see invoices they created
    - Customers: Can see invoices assigned to them
    """
    queryset = Invoice.objects.none()  # Empty queryset by default
    serializer_class = InvoiceListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'customer__first_name', 'customer__last_name', 'customer__email']
    ordering_fields = ['created_at', 'due_date', 'total_amount', 'reference']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter invoices based on user role"""
        try:
            user = self.request.user
            
            # Check user role and filter accordingly
            if hasattr(user, 'role'):
                if user.role == 'business_owner':
                    # Business owners see invoices they created
                    queryset = Invoice.objects.filter(owner=user).select_related('customer', 'owner')
                elif user.role == 'customer':
                    # Customers see invoices assigned to them
                    queryset = Invoice.objects.filter(customer=user).select_related('customer', 'owner')
                else:
                    # Default: no invoices for unknown roles
                    queryset = Invoice.objects.none()
            else:
                # Fallback: filter by owner (old behavior)
                queryset = Invoice.objects.filter(owner=user).select_related('customer', 'owner')
            
            # Manual filtering for status and currency
            status = self.request.query_params.get('status', None)
            if status:
                if status not in [choice[0] for choice in Invoice.Status.choices]:
                    raise ValueError(f"Invalid status '{status}'. Valid options: {[choice[0] for choice in Invoice.Status.choices]}")
                queryset = queryset.filter(status=status)
                
            currency = self.request.query_params.get('currency', None)
            if currency:
                if len(currency) != 3:
                    raise ValueError("Currency must be a 3-letter code (e.g., 'CAD', 'USD')")
                queryset = queryset.filter(currency=currency.upper())
                
            return queryset
        except Exception as e:
            logger.error(f"Error filtering invoices: {str(e)}")
            return Invoice.objects.none()

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return InvoiceCreateSerializer
        elif self.action == 'retrieve':
            return InvoiceDetailSerializer
        return InvoiceListSerializer

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            # Only business owners can create invoices
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create invoice - only business owners allowed"""
        try:
            # Check if user is a business owner
            if hasattr(request.user, 'role') and request.user.role != 'business_owner':
                return Response({
                    'error': 'Access denied',
                    'message': 'Only business owners can create invoices. Please contact support if you believe this is an error.',
                    'code': 'INSUFFICIENT_PERMISSIONS'
                }, status=status.HTTP_403_FORBIDDEN)
            
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            return Response({
                'error': 'Failed to create invoice',
                'message': 'An unexpected error occurred. Please try again or contact support.',
                'code': 'INVOICE_CREATION_FAILED'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def total_amount(self, request):
        """Get total amount of all invoices for the business owner"""
        user_invoices = Invoice.objects.filter(owner=request.user)
        total = user_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_paid = user_invoices.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
        
        return Response({
            'total_amount': total,
            'total_paid': total_paid
        })

    @action(detail=False, methods=['get'])
    def customer_stats(self, request):
        """Get customer statistics for the business owner"""
        user_invoices = Invoice.objects.filter(owner=request.user)
        total_customers = user_invoices.values('customer').distinct().count()
        customers_with_balance = user_invoices.filter(
            total_amount__gt=F('amount_paid')
        ).values('customer').distinct().count()
        
        return Response({
            'total_customers': total_customers,
            'customers_with_balance': customers_with_balance
        })


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Payment management for customers and business owners"""
    queryset = Payment.objects.none()  # Empty queryset by default
    serializer_class = PaymentSerializer
    permission_classes = []
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice__reference', 'amount', 'description']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user
        queryset = Payment.objects.none()
        
        # Check user role and filter accordingly
        if hasattr(user, 'role'):
            if user.role == 'business_owner':
                # Business owners see payments for invoices they created
                queryset = Payment.objects.filter(
                    invoice__owner=user
                ).select_related('invoice', 'invoice__customer')
            elif user.role == 'customer':
                # Customers see payments for invoices assigned to them
                queryset = Payment.objects.filter(
                    invoice__customer=user
                ).select_related('invoice', 'invoice__customer')
        else:
            # Fallback: check if user is either customer or owner
            queryset = Payment.objects.filter(
                invoice__customer=user
            ).select_related('invoice', 'invoice__customer')
        
        # Apply additional filters
        invoice_id = self.request.query_params.get('invoice', None)
        if invoice_id:
            queryset = queryset.filter(invoice__id=invoice_id)
            
        return queryset

    def list(self, request):
        """List all payments for the current user"""
        payments = self.get_queryset()
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Get specific payment details"""
        payment = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(payment)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_payment(self, request):
        """Create payment intent for invoice"""
        serializer = PaymentCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get validated data
            invoice_id = serializer.validated_data['invoice_id']
            amount = serializer.validated_data['amount']
            currency = serializer.validated_data['currency']
            payment_method = serializer.validated_data['payment_method']
            description = serializer.validated_data.get('description', '')
            
            # Get invoice
            invoice = get_object_or_404(Invoice, id=invoice_id)
            
            # Get payment service (simple DI!)
            from .services import get_payment_service
            payment_service = get_payment_service('stripe')
            
            # Create payment intent with Stripe
            metadata = {
                'invoice_id': str(invoice.id),
                'invoice_reference': invoice.reference,
                'customer_id': str(invoice.customer.id),
                'description': description
            }
            
            result = payment_service.create_payment_intent(amount, currency, metadata)
            
            if result.get('success'):
                # Create payment record
                payment = Payment.objects.create(
                    invoice=invoice,
                    amount=amount,
                    currency=currency,
                    payment_method=payment_method,
                    payment_provider=Payment.PaymentProvider.STRIPE,
                    description=description,
                    status=Payment.Status.PENDING,
                    external_payment_id=result.get('payment_intent_id'),
                    client_secret=result.get('client_secret')
                )
                
                payment_serializer = PaymentSerializer(payment)
                
                return Response({
                    'success': True,
                    'payment': payment_serializer.data,
                    'client_secret': result.get('client_secret'),
                    'message': 'Payment intent created successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': result.get('error'),
                    'error_type': result.get('error_type')
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error creating payment: {e}")
            return Response({
                'success': False,
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def confirm_payment(self, request):
        """Confirm payment with Stripe"""
        serializer = PaymentConfirmSerializer(data=request.data)
        print("Serializer: "+str(serializer))
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payment_intent_id = serializer.validated_data['payment_intent_id']
            logger.info(f"Confirming payment with intent ID: {payment_intent_id}")
            
            # Find payment by external payment ID
            # Allow both customers and business owners to confirm payments
            if hasattr(request.user, 'role'):
                if request.user.role == 'customer':
                    # Customers can confirm payments for their invoices
                    payment = get_object_or_404(
                        Payment, 
                        external_payment_id=payment_intent_id,
                        invoice__customer=request.user
                    )
                elif request.user.role == 'business_owner':
                    # Business owners can confirm payments for their invoices
                    payment = get_object_or_404(
                        Payment, 
                        external_payment_id=payment_intent_id,
                        invoice__owner=request.user
                    )
                else:
                    # Unknown role - no access
                    payment = get_object_or_404(Payment, id='nonexistent')
            else:
                # Fallback: check if user is either customer or owner
                payment = get_object_or_404(
                    Payment, 
                    external_payment_id=payment_intent_id
                )
                # Verify user has permission
                if payment.invoice.customer != request.user and payment.invoice.owner != request.user:
                    payment = get_object_or_404(Payment, id='nonexistent')
            logger.info(f"Found payment: {payment.id}, status: {payment.status}")
            
            # Get payment service and confirm payment
            from .services import get_payment_service
            payment_service = get_payment_service('stripe')
            
            # Get payment method ID from request data
            payment_method_id = serializer.validated_data.get('payment_method_id')
            logger.info(f"Confirming payment with method ID: {payment_method_id}")
            
            result = payment_service.confirm_payment(payment_intent_id, payment_method_id)
            logger.info(f"Stripe confirmation result: {result}")
            
            if result.get('success'):
                # Update payment status based on Stripe response
                if result.get('status') == 'succeeded':
                    payment.status = Payment.Status.SUCCEEDED
                    payment.processed_at = timezone.now()
                else:
                    payment.status = Payment.Status.PROCESSING
                
                payment.save()
                logger.info(f"Payment updated: {payment.id}, status: {payment.status}")
                
                payment_serializer = PaymentSerializer(payment)
                
                return Response({
                    'success': True,
                    'payment': payment_serializer.data,
                    'message': 'Payment confirmed successfully'
                })
            else:
                error_msg = result.get('error', 'Unknown error')
                error_type = result.get('error_type', 'unknown')
                logger.error(f"Payment confirmation failed: {error_msg} (type: {error_type})")
                return Response({
                    'success': False,
                    'error': error_msg,
                    'error_type': error_type
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error confirming payment: {e}")
            return Response({
                'success': False,
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get payment status"""
        try:
            payment = get_object_or_404(
                Payment, 
                id=pk,
                invoice__owner=request.user
            )
            
            # TODO: Get latest status from Stripe
            # For now, return current status
            serializer = PaymentStatusSerializer(payment)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error getting payment status: {e}")
            return Response({
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel payment"""
        try:
            payment = get_object_or_404(
                Payment, 
                id=pk,
                invoice__owner=request.user
            )
            
            # TODO: Cancel payment with Stripe
            # For now, update status to canceled
            payment.status = Payment.Status.CANCELED
            payment.save()
            
            return Response({
                'success': True,
                'message': 'Payment canceled successfully. Stripe integration pending.'
            })
                
        except Exception as e:
            logger.error(f"Error canceling payment: {e}")
            return Response({
                'success': False,
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def create_refund(self, request):
        """Create refund for a payment"""
        serializer = RefundCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payment_id = serializer.validated_data['payment_id']
            amount = serializer.validated_data['amount']
            reason = serializer.validated_data.get('reason', '')
            
            # Get payment
            payment = Payment.objects.get(id=payment_id)
            
            # Get payment service
            from .services import get_payment_service
            payment_service = get_payment_service('stripe')
            
            # Create refund with Stripe
            result = payment_service.create_refund(payment.external_payment_id, amount)
            
            if result.get('success'):
                # Update payment with refund details
                payment.refund_amount = amount
                payment.refund_status = Payment.Status.SUCCEEDED
                payment.external_refund_id = result.get('refund_id')
                payment.refunded_at = timezone.now()
                payment.save()
                
                # Update invoice amounts
                invoice = payment.invoice
                invoice.amount_paid -= amount
                
                # Update invoice status
                if invoice.amount_paid <= 0:
                    invoice.status = Invoice.Status.PENDING
                elif invoice.amount_paid < invoice.total_amount:
                    invoice.status = Invoice.Status.PARTIALLY_PAID
                else:
                    invoice.status = Invoice.Status.PAID
                
                invoice.save()
                
                refund_serializer = RefundSerializer(payment)
                
                return Response({
                    'success': True,
                    'refund': refund_serializer.data,
                    'message': 'Refund processed successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': result.get('error'),
                    'error_type': result.get('error_type')
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Payment.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Payment not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating refund: {e}")
            return Response({
                'success': False,
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def refunds(self, request):
        """List all refunds for the current user"""
        try:
            user = request.user
            payments = Payment.objects.none()
            
            # Check user role and filter accordingly
            if hasattr(user, 'role'):
                if user.role == 'business_owner':
                    # Business owners see refunds for invoices they created
                    payments = Payment.objects.filter(
                        invoice__owner=user,
                        refund_status__isnull=False
                    ).select_related('invoice', 'invoice__customer')
                elif user.role == 'customer':
                    # Customers see refunds for invoices assigned to them
                    payments = Payment.objects.filter(
                        invoice__customer=user,
                        refund_status__isnull=False
                    ).select_related('invoice', 'invoice__customer')
            else:
                # Fallback: check if user is either customer or owner
                payments = Payment.objects.filter(
                    invoice__customer=user,
                    refund_status__isnull=False
                ).select_related('invoice', 'invoice__customer')
            
            serializer = RefundSerializer(payments, many=True)
            return Response({
                'success': True,
                'refunds': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error fetching refunds: {e}")
            return Response({
                'success': False,
                'error': 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicInvoiceView(APIView):
    """Public view for invoices accessible without authentication"""
    permission_classes = [AllowAny]
    
    def get(self, request, public_slug):
        """Get invoice by public slug"""
        try:
            invoice = get_object_or_404(
                Invoice.objects.select_related('customer', 'owner'),
                public_slug=public_slug
            )
            
            # Get payments for this invoice
            payments = Payment.objects.filter(invoice=invoice).order_by('-created_at')
            
            # Serialize invoice data
            invoice_serializer = InvoiceDetailSerializer(invoice)
            payment_serializer = PaymentSerializer(payments, many=True)
            
            return Response({
                'success': True,
                'invoice': invoice_serializer.data,
                'payments': payment_serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error fetching public invoice: {e}")
            return Response({
                'success': False,
                'error': 'Invoice not found'
            }, status=status.HTTP_404_NOT_FOUND)


