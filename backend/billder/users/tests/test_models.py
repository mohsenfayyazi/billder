from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from ..models import User, Role

User = get_user_model()


class UserModelTest(TestCase):
    def test_user_creation(self):
        """Test basic user creation"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role=Role.CUSTOMER
        )
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        self.assertEqual(user.role, Role.CUSTOMER)
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_superuser_creation(self):
        """Test superuser creation"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        
        self.assertEqual(user.email, 'admin@example.com')
        self.assertEqual(user.first_name, 'Admin')
        self.assertEqual(user.last_name, 'User')
        self.assertEqual(user.role, Role.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.check_password('adminpass123'))

    def test_user_str_representation(self):
        """Test string representation of user"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role=Role.CUSTOMER
        )
        
        expected_str = f"{user.first_name} {user.last_name}"
        self.assertEqual(str(user), expected_str)

    def test_user_str_representation_no_name(self):
        """Test string representation when no name is provided"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='',
            last_name='',
            role=Role.CUSTOMER
        )
        
        self.assertEqual(str(user), 'test@example.com')

    def test_user_get_full_name(self):
        """Test get_full_name method"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role=Role.CUSTOMER
        )
        
        self.assertEqual(user.get_full_name(), 'John Doe')

    def test_user_get_short_name(self):
        """Test get_short_name method"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role=Role.CUSTOMER
        )
        
        self.assertEqual(user.get_short_name(), 'John')

    def test_user_email_unique(self):
        """Test that email must be unique"""
        User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role=Role.CUSTOMER
        )
        
        with self.assertRaises(Exception):  # IntegrityError
            User.objects.create_user(
                email='test@example.com',
                password='testpass123',
                first_name='Jane',
                last_name='Smith',
                role=Role.CUSTOMER
            )

    def test_user_email_required(self):
        """Test that email is required"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email='',
                password='testpass123',
                first_name='John',
                last_name='Doe',
                role=Role.CUSTOMER
            )

    def test_user_default_role(self):
        """Test default role assignment"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        
        self.assertEqual(user.role, Role.USER)

    def test_user_username_field(self):
        """Test that email is used as username field"""
        self.assertEqual(User.USERNAME_FIELD, 'email')

    def test_user_required_fields(self):
        """Test required fields for user creation"""
        self.assertEqual(User.REQUIRED_FIELDS, ['first_name', 'last_name', 'role'])

    def test_user_manager_create_user(self):
        """Test UserManager create_user method"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role=Role.CUSTOMER
        )
        
        self.assertIsInstance(user, User)
        self.assertEqual(user.email, 'test@example.com')

    def test_user_manager_create_superuser(self):
        """Test UserManager create_superuser method"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        
        self.assertIsInstance(user, User)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.role, Role.ADMIN)

    def test_user_manager_create_superuser_invalid_staff(self):
        """Test UserManager create_superuser with invalid is_staff"""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass123',
                first_name='Admin',
                last_name='User',
                is_staff=False
            )

    def test_user_manager_create_superuser_invalid_superuser(self):
        """Test UserManager create_superuser with invalid is_superuser"""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass123',
                first_name='Admin',
                last_name='User',
                is_superuser=False
            )


class RoleModelTest(TestCase):
    def test_role_choices(self):
        """Test role choices are properly defined"""
        self.assertEqual(Role.ADMIN, 'admin')
        self.assertEqual(Role.USER, 'user')
        self.assertEqual(Role.BUSINESS_OWNER, 'business_owner')
        self.assertEqual(Role.CUSTOMER, 'customer')

    def test_role_choices_length(self):
        """Test that all expected roles are defined"""
        expected_roles = ['admin', 'user', 'business_owner', 'customer']
        actual_roles = [choice[0] for choice in Role.choices]
        
        for role in expected_roles:
            self.assertIn(role, actual_roles)


