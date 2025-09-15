'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and has business_owner role
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');

    if (userData && token && tokenExpiry) {
      try {
        const user = JSON.parse(userData);
        const now = Date.now();
        const expiry = parseInt(tokenExpiry);

        // Check if token is still valid
        if (now < expiry) {
          // Redirect based on user role
          if (user.role === 'business_owner') {
            router.push('/admin');
            return;
          } else if (user.role === 'customer') {
            router.push('/customer');
            return;
          }
        } else {
          // Token expired, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiry');
        }
      } catch {
        // Invalid user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
      }
    }
  }, [router]);

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <h1 className="display-4 mb-4">Welcome to Billder</h1>
        <p className="lead mb-4">Your billing and invoice management solution</p>
        <a href="/login" className="btn btn-primary btn-lg">
          Go to Login
        </a>
      </div>
    </div>
  );
}
