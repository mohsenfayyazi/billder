'use client';

import React from 'react';

interface ErrorMessageProps {
  error: string | Error;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'danger' | 'warning' | 'info';
  className?: string;
  showDetails?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  title = 'Error',
  onRetry,
  onDismiss,
  variant = 'danger',
  className = '',
  showDetails = false
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && error.stack;

  const variantClasses = {
    danger: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info'
  };

  const iconClasses = {
    danger: 'bi-exclamation-triangle',
    warning: 'bi-exclamation-circle',
    info: 'bi-info-circle'
  };

  return (
    <div className={`alert ${variantClasses[variant]} ${className}`} role="alert">
      <div className="d-flex align-items-start">
        <i className={`bi ${iconClasses[variant]} me-2 mt-1`}></i>
        <div className="flex-grow-1">
          <h6 className="alert-heading mb-2">{title}</h6>
          <p className="mb-2">{errorMessage}</p>
          
          {showDetails && errorStack && (
            <details className="mt-2">
              <summary className="btn btn-sm btn-outline-secondary">
                Show Details
              </summary>
              <pre className="mt-2 small text-muted">
                {errorStack}
              </pre>
            </details>
          )}
          
          <div className="d-flex gap-2 mt-3">
            {onRetry && (
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={onRetry}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Try Again
              </button>
            )}
            {onDismiss && (
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={onDismiss}
              >
                <i className="bi bi-x me-1"></i>
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
