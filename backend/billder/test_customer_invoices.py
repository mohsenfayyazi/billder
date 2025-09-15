#!/usr/bin/env python
"""
Test script to verify customer invoice API
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append('/Users/mohsen/Desktop/Billder/backend/billder')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'billder.settings')
os.environ.setdefault('SECRET_KEY', 'django-insecure-change-this-in-production')
os.environ.setdefault('DEBUG', 'True')

# Initialize Django
django.setup()

from finance.models import Invoice, Payment
from users.models import User
from decimal import Decimal
from django.utils import timezone

def create_test_data():
    """Create test data for customer invoices"""
    print("🧪 Creating test data...")
    
    # Create test users
    business_owner, created = User.objects.get_or_create(
        email='business@test.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'Business',
            'role': 'business_owner',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        business_owner.set_password('testpass123')
        business_owner.save()
        print("✅ Created business owner")
    else:
        print("✅ Business owner already exists")
    
    customer, created = User.objects.get_or_create(
        email='customer@test.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'Customer',
            'role': 'customer'
        }
    )
    if created:
        customer.set_password('testpass123')
        customer.save()
        print("✅ Created customer")
    else:
        print("✅ Customer already exists")
    
    # Create test invoices
    invoices_data = [
        {
            'reference': 'INV-001',
            'total_amount': Decimal('100.00'),
            'amount_paid': Decimal('0.00'),
            'status': 'pending',
            'description': 'Test invoice 1'
        },
        {
            'reference': 'INV-002',
            'total_amount': Decimal('250.00'),
            'amount_paid': Decimal('100.00'),
            'status': 'pending',
            'description': 'Test invoice 2 - partial payment'
        },
        {
            'reference': 'INV-003',
            'total_amount': Decimal('500.00'),
            'amount_paid': Decimal('500.00'),
            'status': 'paid',
            'description': 'Test invoice 3 - fully paid'
        }
    ]
    
    for invoice_data in invoices_data:
        invoice, created = Invoice.objects.get_or_create(
            reference=invoice_data['reference'],
            defaults={
                'owner': business_owner,
                'customer': customer,
                'total_amount': invoice_data['total_amount'],
                'amount_paid': invoice_data['amount_paid'],
                'status': invoice_data['status'],
                'currency': 'USD',
                'due_date': timezone.now().date(),
                'description': invoice_data['description']
            }
        )
        if created:
            print(f"✅ Created invoice {invoice.reference}")
        else:
            print(f"✅ Invoice {invoice.reference} already exists")
    
    print(f"\n📊 Test data summary:")
    print(f"   - Business Owner: {business_owner.email}")
    print(f"   - Customer: {customer.email}")
    print(f"   - Total Invoices: {Invoice.objects.count()}")
    print(f"   - Customer Invoices: {Invoice.objects.filter(customer=customer).count()}")
    
    return business_owner, customer

def test_api_endpoints():
    """Test the API endpoints"""
    print("\n🔍 Testing API endpoints...")
    
    # Test customer login
    from django.test import Client
    from django.urls import reverse
    
    client = Client()
    
    # Login as customer
    login_data = {
        'email': 'customer@test.com',
        'password': 'testpass123'
    }
    
    response = client.post('/api/users/login/', login_data, content_type='application/json')
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print(f"✅ Customer login successful, token: {token[:20]}...")
        
        # Test invoices API
        headers = {'Authorization': f'Token {token}'}
        response = client.get('/api/finance/invoices/', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Invoices API successful")
            print(f"   - Status: {response.status_code}")
            print(f"   - Data keys: {list(data.keys())}")
            if 'results' in data:
                print(f"   - Number of invoices: {len(data['results'])}")
                for invoice in data['results'][:2]:  # Show first 2 invoices
                    print(f"     * {invoice.get('reference', 'N/A')} - ${invoice.get('total_amount', 'N/A')}")
            else:
                print(f"   - Raw data: {data}")
        else:
            print(f"❌ Invoices API failed: {response.status_code}")
            print(f"   - Response: {response.content.decode()}")
    else:
        print(f"❌ Customer login failed: {response.status_code}")
        print(f"   - Response: {response.content.decode()}")

def main():
    """Run the test"""
    print("🚀 Starting customer invoice test...")
    
    try:
        # Create test data
        business_owner, customer = create_test_data()
        
        # Test API endpoints
        test_api_endpoints()
        
        print("\n🎉 Test completed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
