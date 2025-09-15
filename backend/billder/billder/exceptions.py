from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler to provide user-friendly error messages.
    """
    # Get the standard error response
    response = exception_handler(exc, context)
    
    if response is not None:
        # Customize the error response
        custom_response_data = {
            'error': 'Request failed',
            'message': 'An error occurred while processing your request.',
            'code': 'REQUEST_FAILED'
        }
        
        # Handle different types of errors
        if response.status_code == 400:
            custom_response_data.update({
                'error': 'Bad request',
                'message': 'The request data is invalid. Please check your input and try again.',
                'code': 'BAD_REQUEST',
                'details': response.data
            })
        elif response.status_code == 401:
            custom_response_data.update({
                'error': 'Authentication required',
                'message': 'Please log in to access this resource.',
                'code': 'UNAUTHORIZED'
            })
        elif response.status_code == 403:
            custom_response_data.update({
                'error': 'Access denied',
                'message': 'You do not have permission to perform this action.',
                'code': 'FORBIDDEN'
            })
        elif response.status_code == 404:
            custom_response_data.update({
                'error': 'Not found',
                'message': 'The requested resource was not found.',
                'code': 'NOT_FOUND'
            })
        elif response.status_code == 500:
            custom_response_data.update({
                'error': 'Internal server error',
                'message': 'An unexpected error occurred. Please try again later.',
                'code': 'INTERNAL_ERROR'
            })
        
        # Log the error for debugging
        logger.error(f"API Error {response.status_code}: {exc}")
        
        response.data = custom_response_data
    
    return response
