from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('users/login/', UserViewSet.as_view({'post': 'login'}), name='user-login'),
    path('users/logout/', UserViewSet.as_view({'post': 'logout'}), name='user-logout'),
    path('users/profile/', UserViewSet.as_view({'get': 'profile'}), name='user-profile'),
]