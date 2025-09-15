'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{first_name: string; last_name: string; email: string} | null>(null);
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

  const navigation = [
    { name: 'Dashboard', href: '/customer', icon: 'bi-house', current: pathname === '/customer' },
    { name: 'My Invoices', href: '/customer/invoices', icon: 'bi-file-text', current: pathname.startsWith('/customer/invoices') },
    { name: 'Payment History', href: '/customer/payments', icon: 'bi-credit-card', current: pathname.startsWith('/customer/payments') },
    { name: 'Profile', href: '/customer/profile', icon: 'bi-person', current: pathname.startsWith('/customer/profile') },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    router.push('/');
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Top Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-info">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <Link className="navbar-brand" href="/customer">
            <i className="bi bi-receipt me-2"></i>
            Billder Customer Portal
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
                {user?.first_name || 'Customer'}
              </a>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" href="/customer/profile">
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/customer/settings">
                    <i className="bi bi-gear me-2"></i>
                    Settings
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <a className="dropdown-item" href="#" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </a>
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
