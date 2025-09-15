'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center p-5">
            <div className="mb-4">
              <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
            </div>
            <h2 className="text-danger mb-3">Something went wrong</h2>
            <p className="text-muted mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button 
                className="btn btn-primary"
                onClick={this.handleRetry}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Try Again
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-start">
                <summary className="btn btn-sm btn-outline-danger">
                  Show Error Details
                </summary>
                <div className="mt-2 p-3 bg-light rounded">
                  <pre className="text-danger small">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
