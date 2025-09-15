from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager

class Role(models.TextChoices):
    ADMIN = "admin"
    USER = "user"
    BUSINESS_OWNER = "business_owner"
    CUSTOMER = "customer"

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Role.ADMIN)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
            
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    # Override email field to make it unique since we're using it as USERNAME_FIELD
    email = models.EmailField(unique=True)
    
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    username = None
    
    objects = UserManager()
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name", "role"]

    def __str__(self):
        return self.get_full_name() or self.email