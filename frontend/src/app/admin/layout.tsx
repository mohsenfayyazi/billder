'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{first_name: string; last_name: string} | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call backend logout API
      const token = localStorage.getItem('token');
      if (token) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
        await fetch(`${API_BASE_URL}/users/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
      router.push('/login');
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: 'bi-house', current: pathname === '/admin' },
    { name: 'Invoices', href: '/admin/invoices', icon: 'bi-file-text', current: pathname.startsWith('/admin/invoices') },
    ];

  return (
    <div className="min-vh-100 bg-light">
      {/* Top Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <Link className="navbar-brand" href="/admin">
            <i className="bi bi-receipt me-2"></i>
            Billder Admin
          </Link>

          <div className="navbar-nav ms-auto">
            <div className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle me-2"></i>
                {user ? `${user.first_name} ${user.last_name}` : 'Admin User'}
              </a>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" href="/admin/profile">
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/admin/settings">
                    <i className="bi bi-gear me-2"></i>
                    Settings
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={handleLogout}
                    style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className={`col-md-3 col-lg-2 px-0 bg-white shadow-sm ${sidebarOpen ? 'd-block' : 'd-none d-md-block'}`}>
            <div className="position-sticky pt-3">
              <ul className="nav flex-column">
                {navigation.map((item) => (
                  <li key={item.name} className="nav-item">
                    <Link
                      className={`nav-link ${item.current ? 'active' : ''}`}
                      href={item.href}
                    >
                      <i className={`${item.icon} me-2`}></i>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <hr className="my-3" />

              <ul className="nav flex-column">
                <li className="nav-item">
                  <Link className="nav-link text-muted" href="/">
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Site
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9 col-lg-10">
            <main className="py-4">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
