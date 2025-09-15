'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiEndpoint, API_CONFIG } from '@/lib/config';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useApiError } from '@/hooks/useApiError';
import { isValidEmail, isValidPassword, sanitizeInput } from '@/lib/simpleValidation';
import { apiRateLimiter } from '@/lib/rateLimiter';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { error, handleError, clearError, retry, isRetrying } = useApiError();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeInput(e.target.value);
    setFormData({
      ...formData,
      [e.target.name]: sanitizedValue
    });
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const performLogin = async () => {
    const response = await fetch(getApiEndpoint(API_CONFIG.ENDPOINTS.LOGIN), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
    }

    // Store token and user data in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('tokenExpiry', (Date.now() + 24 * 60 * 60 * 1000).toString()); // 24 hours
    
    // Store user data if available
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Redirect based on user role
    if (data.user && data.user.role === 'business_owner') {
      router.push('/admin');
    } else if (data.user && data.user.role === 'customer') {
      router.push('/customer');
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (!apiRateLimiter.canMakeRequest()) {
      const timeUntilReset = Math.ceil(apiRateLimiter.getTimeUntilReset() / 1000);
      handleError(new Error(`Too many login attempts. Please wait ${timeUntilReset} seconds.`));
      return;
    }
    
    // Simple validation
    if (!isValidEmail(formData.email)) {
      handleError(new Error('Please enter a valid email address'));
      return;
    }
    
    if (!isValidPassword(formData.password)) {
      handleError(new Error('Password must be at least 8 characters long'));
      return;
    }
    
    setLoading(true);
    clearError();

    try {
      await performLogin();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100">
        <div className="col-md-4 col-sm-6 mx-auto">
          <div className="card shadow">
            <div className="card-header text-center bg-primary text-white">
              <h4 className="mb-0">Billder Login</h4>
            </div>
            <div className="card-body p-4">
              {error && (
                <ErrorMessage
                  error={error}
                  onRetry={retry}
                  onDismiss={clearError}
                  title="Login Failed"
                />
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading || isRetrying}
                >
                  {loading || isRetrying ? (
                    <LoadingSpinner size="sm" text="Logging in..." />
                  ) : (
                    'Login'
                  )}
                </button>
                <div className="text-center">
                  <small className="text-muted">
                    Don&apos;t have an account? <a href="#" className="text-decoration-none">Sign up</a>
                  </small>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
