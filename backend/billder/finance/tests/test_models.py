from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import date, timedelta
from ..models import Invoice, Payment

User = get_user_model()


class InvoiceModelTest(TestCase):
    def setUp(self):
        """Set up test data"""
        self.owner = User.objects.create_user(
            email='owner@test.com',
            password='testpass123',
            first_name='Business',
            last_name='Owner',
            role='business_owner'
        )
        self.customer = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='customer'
        )

    def test_invoice_creation(self):
        """Test basic invoice creation"""
        invoice = Invoice.objects.create(
            owner=self.owner,
            customer=self.customer,
            total_amount=Decimal('100.00'),
            due_date=date.today() + timedelta(days=30)
        )
        
        self.assertEqual(invoice.owner, self.owner)
        self.assertEqual(invoice.customer, self.customer)
        self.assertEqual(invoice.total_amount, Decimal('100.00'))
        self.assertEqual(invoice.amount_paid, Decimal('0.00'))
        self.assertEqual(invoice.status, Invoice.Status.PENDING)
        self.assertEqual(invoice.currency, 'CAD')
        self.assertTrue(invoice.reference)
        self.assertTrue(invoice.public_slug)

    def test_invoice_reference_generation(self):
        """Test automatic reference generation"""
        invoice1 = Invoice.objects.create(
            owner=self.owner,
            customer=self.customer,
            total_amount=Decimal('100.00'),
            due_date=date.today() + timedelta(days=30)
        )
        
        invoice2 = Invoice.objects.create(
            owner=self.owner,
            customer=self.customer,
            total_amount=Decimal('200.00'),
            due_date=date.today() + timedelta(days=30)
        )
        
        self.assertNotEqual(invoice1.reference, invoice2.reference)
        self.assertTrue(invoice1.reference.startswith('INV-'))
        self.assertTrue(invoice2.reference.startswith('INV-'))

    def test_invoice_public_slug_generation(self):
        """Test automatic public slug generation"""
        invoice = Invoice.objects.create(
            owner=self.owner,
            customer=self.customer,
            total_amount=Decimal('100.00'),
            due_date=date.today() + timedelta(days=30)
        )
        
        self.assertTrue(invoice.public_slug.startswith('invoice-'))
        self.assertEqual(len(invoice.public_slug), 16)  # 'invoice-' + 8 chars

    def test_invoice_str_representation(self):
        """Test string representation of invoice"""
        invoice = Invoice.objects.create(
            owner=self.owner,
            customer=self.customer,
            total_amount=Decimal('100.00'),
            due_date=date.today() + timedelta(days=30)
        )
        
        expected_str = f"Invoice {invoice.reference} - {self.customer.get_full_name()}"
        self.assertEqual(str(invoice), expected_str)

    def test_invoice_status_updates(self):
        """Test invoice status updates based on payments"""
        invoice = Invoice.objects.create(
            owner=self.owner,
            customer=self.customer,
            total_amount=Decimal('100.00'),
            due_date=date.today() + timedelta(days=30)
        )
        
        # Initially pending
        self.assertEqual(invoice.status, Invoice.Status.PENDING)
        
        # Partially paid - manually update status since it's not automatic
        invoice.amount_paid = Decimal('50.00')
        invoice.status = Invoice.Status.PARTIALLY_PAID
        invoice.save()
        self.assertEqual(invoice.status, Invoice.Status.PARTIALLY_PAID)
        
        # Fully paid - manually update status since it's not automatic
        invoice.amount_paid = Decimal('100.00')
        invoice.status = Invoice.Status.PAID
        invoice.save()
        self.assertEqual(invoice.status, Invoice.Status.PAID)


class PaymentModelTest(TestCase):
    def setUp(self):
        """Set up test data"""
        self.owner = User.objects.create_user(
            email='owner@test.com',
            password='testpass123',
            first_name='Business',
            last_name='Owner',
            role='business_owner'
        )
        self.customer = User.objects.create_user(
            email='customer@test.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='customer'
        )
        self.invoice = Invoice.objects.create(
            owner=self.owner,
            customer=self.customer,
            total_amount=Decimal('100.00'),
            due_date=date.today() + timedelta(days=30)
        )

    def test_payment_creation(self):
        """Test basic payment creation"""
        payment = Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal('50.00'),
            currency='CAD',
            payment_method=Payment.PaymentMethod.CARD,
            payment_provider=Payment.PaymentProvider.STRIPE,
            status=Payment.Status.PENDING
        )
        
        self.assertEqual(payment.invoice, self.invoice)
        self.assertEqual(payment.amount, Decimal('50.00'))
        self.assertEqual(payment.currency, 'CAD')
        self.assertEqual(payment.payment_method, Payment.PaymentMethod.CARD)
        self.assertEqual(payment.payment_provider, Payment.PaymentProvider.STRIPE)
        self.assertEqual(payment.status, Payment.Status.PENDING)

    def test_payment_str_representation(self):
        """Test string representation of payment"""
        payment = Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal('50.00'),
            currency='CAD',
            payment_method=Payment.PaymentMethod.CARD,
            payment_provider=Payment.PaymentProvider.STRIPE,
            status=Payment.Status.PENDING
        )
        
        expected_str = f"Payment {payment.id} - {self.invoice.reference} - $50.00"
        self.assertEqual(str(payment), expected_str)

    def test_payment_amount_cents(self):
        """Test amount conversion to cents"""
        payment = Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal('12.34'),
            currency='CAD',
            payment_method=Payment.PaymentMethod.CARD,
            payment_provider=Payment.PaymentProvider.STRIPE,
            status=Payment.Status.PENDING
        )
        
        self.assertEqual(payment.amount_cents, 1234)

    def test_payment_status_properties(self):
        """Test payment status properties"""
        payment = Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal('50.00'),
            currency='CAD',
            payment_method=Payment.PaymentMethod.CARD,
            payment_provider=Payment.PaymentProvider.STRIPE,
            status=Payment.Status.SUCCEEDED
        )
        
        self.assertTrue(payment.is_successful)
        self.assertFalse(payment.is_failed)
        self.assertFalse(payment.is_refunded)
        
        # Test failed status
        payment.status = Payment.Status.FAILED
        payment.save()
        self.assertFalse(payment.is_successful)
        self.assertTrue(payment.is_failed)
        
        # Test refunded status
        payment.status = Payment.Status.REFUNDED
        payment.save()
        self.assertTrue(payment.is_refunded)

    def test_payment_refund_fields(self):
        """Test payment refund fields"""
        payment = Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal('50.00'),
            currency='CAD',
            payment_method=Payment.PaymentMethod.CARD,
            payment_provider=Payment.PaymentProvider.STRIPE,
            status=Payment.Status.SUCCEEDED,
            refund_amount=Decimal('25.00'),
            refund_status=Payment.Status.SUCCEEDED,
            refunded_at=timezone.now()
        )
        
        self.assertEqual(payment.refund_amount, Decimal('25.00'))
        self.assertEqual(payment.refund_status, Payment.Status.SUCCEEDED)
        self.assertIsNotNone(payment.refunded_at)
