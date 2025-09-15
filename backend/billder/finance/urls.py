from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PaymentViewSet, PublicInvoiceView
from .webhook_views import stripe_webhook

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('finance/webhooks/stripe/', stripe_webhook, name='stripe_webhook'),
    path('public/invoice/<str:public_slug>/', PublicInvoiceView.as_view(), name='public_invoice'),
]