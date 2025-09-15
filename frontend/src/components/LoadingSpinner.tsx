'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  fullScreen?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Loading...',
  className = '',
  fullScreen = false,
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info'
  };

  const spinner = (
    <div className={`d-flex flex-column align-items-center ${className}`}>
      <div 
        className={`spinner-border ${sizeClasses[size]} ${colorClasses[color]}`} 
        role="status"
        aria-label="Loading"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <div className={`mt-2 ${colorClasses[color]}`}>
          <small>{text}</small>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
