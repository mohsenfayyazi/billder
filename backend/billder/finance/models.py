from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import uuid


class Invoice(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        PAID = "paid", "Paid"
        REFUNDED = "refunded", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=40, unique=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="invoices_owned")
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="invoices")
    currency = models.CharField(max_length=3, default="CAD")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="dollar amount")
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="dollar amount")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    due_date = models.DateField()
    public_slug = models.SlugField(max_length=64, unique=True)  # for public link
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["customer"]),
            models.Index(fields=["reference"]),
        ]
                
    def generate_reference(self):
        """Generate unique invoice reference number"""
        year = timezone.now().year
        month = timezone.now().month
        count = Invoice.objects.filter(
            created_at__year=year,
            created_at__month=month
        ).count()
        return f"INV-{year}{month:02d}-{count + 1:04d}"
    
    def generate_public_slug(self):
        """Generate unique public slug for invoice"""
        import uuid
        return f"invoice-{uuid.uuid4().hex[:8]}"
    
    def save(self, *args, **kwargs):
        """Override save to auto-generate reference and slug if not provided"""
        if not self.reference:
            self.reference = self.generate_reference()
        if not self.public_slug:
            self.public_slug = self.generate_public_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.reference} - {self.customer.get_full_name()}"


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        CANCELED = "canceled", "Canceled"
        REFUNDED = "refunded", "Refunded"

    class PaymentProvider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        PAYPAL = "paypal", "PayPal"
        SQUARE = "square", "Square"

    class PaymentMethod(models.TextChoices):
        CARD = "card", "Credit Card"
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        WALLET = "wallet", "Digital Wallet"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount in dollars")
    currency = models.CharField(max_length=3, default="CAD")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    payment_provider = models.CharField(max_length=20, choices=PaymentProvider.choices, default=PaymentProvider.STRIPE)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CARD)
    
    # Generic Payment Details (provider-agnostic)
    external_payment_id = models.CharField(max_length=255, null=True, blank=True, help_text="Provider's payment ID (e.g., Stripe Payment Intent ID)")
    external_charge_id = models.CharField(max_length=255, null=True, blank=True, help_text="Provider's charge ID")
    external_refund_id = models.CharField(max_length=255, null=True, blank=True, help_text="Provider's refund ID")
    client_secret = models.CharField(max_length=255, null=True, blank=True, help_text="Client secret for frontend")
    payment_method_token = models.CharField(max_length=255, null=True, blank=True, help_text="Payment method token")
    
    # Payment details
    description = models.TextField(blank=True)
    
    # Refund details
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Refunded amount in dollars")
    refund_status = models.CharField(max_length=20, choices=Status.choices, null=True, blank=True, help_text="Refund status")
    refunded_at = models.DateTimeField(null=True, blank=True, help_text="When refund was processed")
     
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["invoice", "status"]),
            models.Index(fields=["payment_provider", "external_payment_id"]),
            models.Index(fields=["external_charge_id"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment {self.id} - {self.invoice.reference} - ${self.amount}"

    @property
    def is_successful(self):
        """Check if payment was successful"""
        return self.status == self.Status.SUCCEEDED

    @property
    def is_failed(self):
        """Check if payment failed"""
        return self.status in [self.Status.FAILED, self.Status.CANCELED]

    @property
    def is_refunded(self):
        """Check if payment was refunded"""
        return self.status == self.Status.REFUNDED

    @property
    def amount_cents(self):
        """Convert amount to cents for payment providers (Stripe, etc.)"""
        return int(self.amount * 100)

    def get_provider_service(self):
        """Get the appropriate payment service based on provider"""
        from .services import get_payment_service
        return get_payment_service(self.payment_provider)

    def get_provider_metadata(self, key: str, default=None):
        """Get provider-specific metadata"""
        return self.metadata.get(key, default)

    def set_provider_metadata(self, key: str, value):
        """Set provider-specific metadata"""
        if not self.metadata:
            self.metadata = {}
        self.metadata[key] = value
        self.save(update_fields=['metadata'])


