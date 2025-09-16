import re
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware


class CsrfExemptMiddleware(CsrfViewMiddleware):
    """
    Custom CSRF middleware that exempts certain URLs from CSRF protection.
    This is useful for API endpoints that use Token Authentication.
    """
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        # Check if the current path should be exempt from CSRF
        path = request.path_info
        
        # Get exempt URLs from settings
        exempt_urls = getattr(settings, 'CSRF_EXEMPT_URLS', [])
        
        # Check if current path matches any exempt pattern
        for pattern in exempt_urls:
            if re.match(pattern, path):
                # Skip CSRF protection for this request
                return None
        
        # For all other paths, use the default CSRF protection
        return super().process_view(request, callback, callback_args, callback_kwargs)
