from rest_framework import serializers
from decimal import Decimal
from django.contrib.auth import get_user_model
from .models import Invoice, Payment

User = get_user_model()

class InvoiceListSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    owner_email = serializers.SerializerMethodField()
    remaining_balance = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'reference', 'customer_name', 'customer_email',
            'owner_name', 'owner_email', 'total_amount', 'amount_paid', 
            'remaining_balance', 'status', 'due_date', 'created_at', 'is_overdue'
        ]
    
    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"
    
    def get_customer_email(self, obj):
        return obj.customer.email
    
    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}"
    
    def get_owner_email(self, obj):
        return obj.owner.email
    
    def get_remaining_balance(self, obj):
        return obj.total_amount - obj.amount_paid
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        return obj.due_date < timezone.now().date() and obj.status != 'paid'


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model - used for API responses"""
    invoice_reference = serializers.CharField(source='invoice.reference', read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    is_successful = serializers.ReadOnlyField()
    is_failed = serializers.ReadOnlyField()
    is_refunded = serializers.ReadOnlyField()
    amount_cents = serializers.ReadOnlyField()

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_reference', 'customer_name', 'customer_email',
            'amount', 'amount_cents', 'currency', 'status', 'payment_provider', 'payment_method',
            'external_payment_id', 'external_charge_id', 'external_refund_id', 'client_secret',
            'payment_method_token', 'description', 'is_successful', 'is_failed', 'is_refunded',
            'created_at', 'updated_at', 'processed_at'
        ]
        read_only_fields = [
            'id', 'external_payment_id', 'external_charge_id', 'external_refund_id',
            'is_successful', 'is_failed', 'is_refunded', 'created_at', 'updated_at', 'processed_at'
        ]

    def get_customer_name(self, obj):
        return f"{obj.invoice.customer.first_name} {obj.invoice.customer.last_name}"

    def get_customer_email(self, obj):
        return obj.invoice.customer.email


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating payment intents"""
    invoice_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    currency = serializers.CharField(max_length=3, default='CAD')
    payment_method = serializers.ChoiceField(
        choices=Payment.PaymentMethod.choices,
        default=Payment.PaymentMethod.CARD
    )
    description = serializers.CharField(required=False, allow_blank=True)

    def validate_invoice_id(self, value):
        """Validate that invoice exists and belongs to the user"""
        try:
            invoice = Invoice.objects.get(id=value)
            # Check if user has permission to pay this invoice
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                if invoice.customer != request.user and invoice.owner != request.user:
                    raise serializers.ValidationError("You don't have permission to pay this invoice")
            return value
        except Invoice.DoesNotExist:
            raise serializers.ValidationError("Invoice not found")

    def validate_amount(self, value):
        """Validate payment amount"""
        invoice_id = self.initial_data.get('invoice_id')
        if invoice_id:
            try:
                invoice = Invoice.objects.get(id=invoice_id)
                remaining_balance = invoice.total_amount - invoice.amount_paid
                if value > remaining_balance:
                    raise serializers.ValidationError(
                        f"Payment amount cannot exceed remaining balance of ${remaining_balance:.2f}"
                    )
                if value <= 0:
                    raise serializers.ValidationError("Payment amount must be greater than 0")
            except Invoice.DoesNotExist:
                pass
        return value


class PaymentConfirmSerializer(serializers.Serializer):
    """Serializer for confirming payments with Stripe"""
    payment_intent_id = serializers.CharField(max_length=255)
    payment_method_id = serializers.CharField(max_length=255, required=False)

    def validate_payment_intent_id(self, value):
        """Validate that payment intent exists"""
        print(f"Validating payment intent ID: {value}")
        print(f"Total payments in DB: {Payment.objects.count()}")
        
        # List all payment intent IDs for debugging
        all_payment_ids = list(Payment.objects.values_list('external_payment_id', flat=True))
        print(f"All payment intent IDs in DB: {all_payment_ids}")
        
        try:
            payment = Payment.objects.get(external_payment_id=value)
            print(f"Found payment: {payment.id}, status: {payment.status}")
            if payment.status != Payment.Status.PENDING:
                raise serializers.ValidationError("Payment is not in pending status")
            return value
        except Payment.DoesNotExist:
            print(f"Payment with external_payment_id '{value}' not found")
            raise serializers.ValidationError("Payment intent not found")


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invoices"""
    customer_email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'customer_email', 'total_amount', 'currency', 'due_date'
        ]
    
    def validate_customer_email(self, value):
        """Validate that customer exists"""
        try:
            customer = User.objects.get(email=value)
            return customer
        except User.DoesNotExist:
            raise serializers.ValidationError("Customer with this email does not exist")
    
    def create(self, validated_data):
        """Create invoice with auto-generated reference and public_slug"""
        customer = validated_data.pop('customer_email')
        owner = self.context['request'].user
        
        invoice = Invoice.objects.create(
            customer=customer,
            owner=owner,
            **validated_data
        )
        return invoice

class InvoiceDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed invoice view with full customer and owner info"""
    customer = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()
    remaining_balance = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'reference', 'total_amount', 'amount_paid', 'remaining_balance',
            'status', 'due_date', 'created_at', 'currency', 'public_slug',
            'customer', 'owner', 'is_overdue'
        ]
    
    def get_customer(self, obj):
        return {
            'first_name': obj.customer.first_name,
            'last_name': obj.customer.last_name,
            'email': obj.customer.email
        }
    
    def get_owner(self, obj):
        return {
            'first_name': obj.owner.first_name,
            'last_name': obj.owner.last_name,
            'email': obj.owner.email
        }
    
    def get_remaining_balance(self, obj):
        return obj.total_amount - obj.amount_paid
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        return obj.due_date < timezone.now().date() and obj.status != 'paid'


class PaymentStatusSerializer(serializers.ModelSerializer):
    """Serializer for payment status responses"""
    invoice_reference = serializers.CharField(source='invoice.reference', read_only=True)
    is_successful = serializers.ReadOnlyField()
    is_failed = serializers.ReadOnlyField()
    is_refunded = serializers.ReadOnlyField()

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice_reference', 'amount', 'currency', 'status',
            'payment_provider', 'payment_method', 'is_successful', 'is_failed', 'is_refunded',
            'created_at', 'processed_at'
        ]


class RefundCreateSerializer(serializers.Serializer):
    """Serializer for creating refunds"""
    payment_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_payment_id(self, value):
        """Validate that payment exists and belongs to the user"""
        try:
            payment = Payment.objects.get(id=value)
            # Check if user has permission to refund this payment
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                if payment.invoice.owner != request.user:
                    raise serializers.ValidationError("You don't have permission to refund this payment")
            return value
        except Payment.DoesNotExist:
            raise serializers.ValidationError("Payment not found")

    def validate_amount(self, value):
        """Validate refund amount"""
        payment_id = self.initial_data.get('payment_id')
        if payment_id:
            try:
                payment = Payment.objects.get(id=payment_id)
                if value > payment.amount:
                    raise serializers.ValidationError("Refund amount cannot exceed payment amount")
                if payment.status != Payment.Status.SUCCEEDED:
                    raise serializers.ValidationError("Can only refund successful payments")
            except Payment.DoesNotExist:
                pass
        return value


class RefundSerializer(serializers.ModelSerializer):
    """Serializer for refund responses"""
    payment_reference = serializers.CharField(source='invoice.reference', read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_reference', 'customer_name', 'customer_email',
            'amount', 'refund_amount', 'refund_status', 'refunded_at',
            'external_refund_id', 'created_at', 'processed_at'
        ]

    def get_customer_name(self, obj):
        return f"{obj.invoice.customer.first_name} {obj.invoice.customer.last_name}"

    def get_customer_email(self, obj):
        return obj.invoice.customer.email


