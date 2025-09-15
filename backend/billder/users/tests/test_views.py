from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from ..models import User, Role

User = get_user_model()


class UserViewSetTest(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': Role.CUSTOMER
        }
        
        self.business_owner = User.objects.create_user(
            email='owner@example.com',
            password='ownerpass123',
            first_name='Business',
            last_name='Owner',
            role=Role.BUSINESS_OWNER
        )

    def test_user_registration_success(self):
        """Test successful user registration"""
        # Add password confirmation to user data
        user_data_with_confirm = self.user_data.copy()
        user_data_with_confirm['password_confirm'] = 'testpass123'
        
        response = self.client.post('/api/users/register/', user_data_with_confirm)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertEqual(response.data['user']['first_name'], 'John')
        self.assertEqual(response.data['user']['last_name'], 'Doe')
        self.assertEqual(response.data['user']['role'], 'customer')
        
        # Check that user was created in database
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_user_registration_duplicate_email(self):
        """Test user registration with duplicate email"""
        # Create first user
        User.objects.create_user(**self.user_data)
        
        # Try to create second user with same email
        response = self.client.post('/api/users/register/', self.user_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_registration_missing_fields(self):
        """Test user registration with missing required fields"""
        incomplete_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
            # Missing first_name, last_name, role
        }
        
        response = self.client.post('/api/users/register/', incomplete_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        self.assertIn('role', response.data)

    def test_user_registration_invalid_email(self):
        """Test user registration with invalid email format"""
        invalid_data = self.user_data.copy()
        invalid_data['email'] = 'invalid-email'
        
        response = self.client.post('/api/users/register/', invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login_success(self):
        """Test successful user login"""
        # Create user first
        user = User.objects.create_user(**self.user_data)
        
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/users/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')

    def test_user_login_invalid_credentials(self):
        """Test user login with invalid credentials"""
        # Create user first
        User.objects.create_user(**self.user_data)
        
        login_data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/api/users/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_user_login_nonexistent_user(self):
        """Test user login with non-existent user"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/users/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_user_logout_success(self):
        """Test successful user logout"""
        # Create user and token
        user = User.objects.create_user(**self.user_data)
        token = Token.objects.create(user=user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        response = self.client.post('/api/users/logout/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Check that token was deleted
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_user_logout_unauthorized(self):
        """Test user logout without authentication"""
        response = self.client.post('/api/users/logout/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_profile_success(self):
        """Test successful user profile retrieval"""
        # Create user and token
        user = User.objects.create_user(**self.user_data)
        token = Token.objects.create(user=user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        response = self.client.get('/api/users/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['first_name'], 'John')
        self.assertEqual(response.data['last_name'], 'Doe')
        self.assertEqual(response.data['role'], 'customer')

    def test_user_profile_unauthorized(self):
        """Test user profile retrieval without authentication"""
        response = self.client.get('/api/users/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_list_unauthorized(self):
        """Test user list endpoint requires authentication"""
        response = self.client.get('/api/users/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_list_authorized(self):
        """Test user list endpoint with authentication"""
        # Create user and token
        user = User.objects.create_user(**self.user_data)
        token = Token.objects.create(user=user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        response = self.client.get('/api/users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_user_retrieve_unauthorized(self):
        """Test user retrieve endpoint requires authentication"""
        user = User.objects.create_user(**self.user_data)
        
        response = self.client.get(f'/api/users/{user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_retrieve_authorized(self):
        """Test user retrieve endpoint with authentication"""
        # Create user and token
        user = User.objects.create_user(**self.user_data)
        token = Token.objects.create(user=user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        response = self.client.get(f'/api/users/{user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], user.id)

    def test_user_update_unauthorized(self):
        """Test user update endpoint requires authentication"""
        user = User.objects.create_user(**self.user_data)
        
        update_data = {'first_name': 'Updated Name'}
        response = self.client.patch(f'/api/users/{user.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_update_authorized(self):
        """Test user update endpoint with authentication"""
        # Create user and token
        user = User.objects.create_user(**self.user_data)
        token = Token.objects.create(user=user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        update_data = {'first_name': 'Updated Name'}
        response = self.client.patch(f'/api/users/{user.id}/', update_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated Name')
        
        # Check that user was updated in database
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Updated Name')

    def test_user_delete_unauthorized(self):
        """Test user delete endpoint requires authentication"""
        user = User.objects.create_user(**self.user_data)
        
        response = self.client.delete(f'/api/users/{user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_delete_authorized(self):
        """Test user delete endpoint with authentication"""
        # Create user and token
        user = User.objects.create_user(**self.user_data)
        token = Token.objects.create(user=user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        response = self.client.delete(f'/api/users/{user.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that user was deleted from database
        self.assertFalse(User.objects.filter(id=user.id).exists())

    def test_token_creation_on_login(self):
        """Test that token is created on login if it doesn't exist"""
        # Create user without token
        user = User.objects.create_user(**self.user_data)
        
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/users/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        
        # Check that token was created
        self.assertTrue(Token.objects.filter(user=user).exists())

    def test_existing_token_reuse_on_login(self):
        """Test that existing token is reused on login"""
        # Create user and token
        user = User.objects.create_user(**self.user_data)
        existing_token = Token.objects.create(user=user)
        
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post('/api/users/login/', login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['token'], existing_token.key)
        
        # Check that no new token was created
        self.assertEqual(Token.objects.filter(user=user).count(), 1)
