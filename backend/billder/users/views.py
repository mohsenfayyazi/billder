from django.shortcuts import render
from .serializers import UserSerializer, UserLoginSerializer, UserRegistrationSerializer
from .models import User
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users.
    
    Provides user registration, login, and profile management.
    Uses token-based authentication for API access.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """User registration endpoint"""
        try:
            serializer = UserRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'message': 'Account created successfully',
                    'token': token.key,
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            
            # Format validation errors for better user experience
            formatted_errors = {}
            for field, errors in serializer.errors.items():
                if isinstance(errors, list):
                    formatted_errors[field] = errors[0] if errors else 'Invalid value'
                else:
                    formatted_errors[field] = str(errors)
            
            return Response({
                'error': 'Registration failed',
                'message': 'Please check the information provided and try again.',
                'details': formatted_errors,
                'code': 'VALIDATION_ERROR'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Registration failed',
                'message': 'An unexpected error occurred. Please try again later.',
                'code': 'REGISTRATION_FAILED'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """User login endpoint using Token Authentication"""
        try:
            serializer = UserLoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'message': 'Login successful',
                    'token': token.key,
                    'user': UserSerializer(user).data
                })
            
            # Format login errors
            formatted_errors = {}
            for field, errors in serializer.errors.items():
                if isinstance(errors, list):
                    formatted_errors[field] = errors[0] if errors else 'Invalid value'
                else:
                    formatted_errors[field] = str(errors)
            
            return Response({
                'error': 'Login failed',
                'message': 'Invalid email or password. Please check your credentials and try again.',
                'details': formatted_errors,
                'code': 'AUTHENTICATION_FAILED'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({
                'error': 'Login failed',
                'message': 'An unexpected error occurred. Please try again later.',
                'code': 'LOGIN_FAILED'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """User logout endpoint (delete token)"""
        try:
            request.user.auth_token.delete()
            return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Logout failed'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
