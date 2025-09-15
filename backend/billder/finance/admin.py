from django.contrib import admin
from .models import Invoice, Payment


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('reference', 'owner', 'customer', 'total_amount', 'amount_paid', 'status', 'due_date', 'created_at', 'public_slug')
    list_filter = ('status', 'currency', 'created_at', 'due_date')
    search_fields = ('reference', 'owner__email', 'customer__email', 'customer__first_name', 'customer__last_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'owner', 'customer')
        }),
        ('Financial Information', {
            'fields': ('currency', 'total_amount', 'amount_paid', 'status')
        }),
        ('Dates', {
            'fields': ('due_date', 'created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('owner', 'customer')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice', 'amount', 'currency', 'status', 'payment_provider', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_provider', 'payment_method', 'currency', 'created_at')
    search_fields = ('id', 'invoice__reference', 'external_payment_id', 'external_charge_id')
    readonly_fields = ('id', 'external_payment_id', 'external_charge_id', 'external_refund_id', 'created_at', 'updated_at', 'processed_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('id', 'invoice', 'amount', 'currency', 'status', 'payment_provider', 'payment_method')
        }),
        ('Provider Integration', {
            'fields': ('external_payment_id', 'external_charge_id', 'external_refund_id', 'client_secret', 'payment_method_token')
        }),
        ('Details', {
            'fields': ('description',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'processed_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('invoice', 'invoice__owner', 'invoice__customer')


