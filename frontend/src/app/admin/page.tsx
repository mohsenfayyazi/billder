'use client';

import { useEffect, useState } from 'react';
import { fetchTotalAmount, fetchCustomerStats } from '@/lib/api';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [customersWithBalance, setCustomersWithBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Calculate remaining balance with proper decimal formatting
  const remainingBalance = parseFloat((totalAmount - totalPaid).toFixed(2));

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

    // Fetch total amount and customers
    async function loadData() {
      try {
        const [amountData, customerStatsData] = await Promise.all([
          fetchTotalAmount(),
          fetchCustomerStats()
        ]);
        setTotalAmount(amountData.total_amount || 0);
        setTotalPaid(amountData.total_paid || 0);
        setTotalCustomers(customerStatsData.total_customers || 0);
        setCustomersWithBalance(customerStatsData.customers_with_balance || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0">Business Owner Dashboard</h1>
              <p className="text-muted mb-0">
                Welcome back, {user?.first_name || 'Business Owner'}! Manage your invoices and billing.
              </p>
            </div>
            <div className="text-end">
              <span className="badge bg-primary fs-6">
                <i className="bi bi-building me-1"></i>
                Business Owner
              </span>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-lg bg-primary bg-opacity-10 h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-2 fw-normal">Total Invoice Amount</h6>
                      <h2 className="mb-0 fw-bold text-dark">
                        {loading ? (
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          `$${totalAmount.toFixed(2)} CAD`
                        )}
                      </h2>
                    </div>
                    <div className="text-primary">
                      <i className="bi bi-currency-dollar fs-1"></i>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <small className="text-muted">
                      <i className="bi bi-arrow-up-right me-1"></i>
                      All invoices
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-lg bg-success bg-opacity-10 h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-2 fw-normal">Total Paid Amount</h6>
                      <h2 className="mb-0 fw-bold text-dark">
                        {loading ? (
                          <div className="spinner-border spinner-border-sm text-success" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          `$${totalPaid.toFixed(2)} CAD`
                        )}
                      </h2>
                    </div>
                    <div className="text-success">
                      <i className="bi bi-check-circle fs-1"></i>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <small className="text-muted">
                      <i className="bi bi-check2 me-1"></i>
                      Received payments
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className={`card border-0 shadow-lg h-100 ${remainingBalance > 0 ? 'bg-danger bg-opacity-10' : 'bg-info bg-opacity-10'}`}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-2 fw-normal">Remaining Balance</h6>
                      <h2 className="mb-0 fw-bold text-dark">
                        {loading ? (
                          <div className={`spinner-border spinner-border-sm ${remainingBalance > 0 ? 'text-danger' : 'text-info'}`} role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          `$${remainingBalance.toFixed(2)} CAD`
                        )}
                      </h2>
                    </div>
                    <div className={remainingBalance > 0 ? 'text-danger' : 'text-info'}>
                      <i className={`bi ${remainingBalance > 0 ? 'bi-exclamation-triangle' : 'bi-check-circle'} fs-1`}></i>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <small className="text-muted">
                      <i className={`bi ${remainingBalance > 0 ? 'bi-clock' : 'bi-check2'} me-1`}></i>
                      {remainingBalance > 0 ? 'Outstanding' : 'Fully paid'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row g-4 mt-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-lg bg-info bg-opacity-10 h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-2 fw-normal">Total Customers</h6>
                      <h2 className="mb-0 fw-bold text-dark">
                        {loading ? (
                          <div className="spinner-border spinner-border-sm text-info" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          totalCustomers
                        )}
                      </h2>
                    </div>
                    <div className="text-info">
                      <i className="bi bi-people fs-1"></i>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <small className="text-muted">
                      <i className="bi bi-person-plus me-1"></i>
                      Active clients
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-lg bg-danger bg-opacity-10 h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted mb-2 fw-normal">Customers with Balance</h6>
                      <h2 className="mb-0 fw-bold text-dark">
                        {loading ? (
                          <div className="spinner-border spinner-border-sm text-danger" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          customersWithBalance
                        )}
                      </h2>
                    </div>
                    <div className="text-danger">
                      <i className="bi bi-exclamation-triangle fs-1"></i>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      Outstanding invoices
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Refund Management Section */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 py-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-arrow-clockwise text-warning fs-4"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-1 fw-bold">Refund Management</h5>
                      <p className="text-muted mb-0 small">Process refunds and manage payment reversals</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="fw-semibold">Quick Actions</h6>
                      <div className="d-flex gap-2 mb-3">
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => alert('Process refund - to be implemented')}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Process Refund
                        </button>
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => alert('Refund history - to be implemented')}
                        >
                          <i className="bi bi-clock-history me-1"></i>
                          Refund History
                        </button>
                      </div>
                      <p className="text-muted small">
                        Process refunds for paid invoices. Refunds will automatically reopen invoices 
                        and allow customers to make additional payments.
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-semibold">Refund Information</h6>
                      <div className="bg-light p-3 rounded">
                        <small className="text-muted">
                          <strong>Processing Time:</strong> 1-3 business days<br/>
                          <strong>Refund Policy:</strong> Full or partial refunds available<br/>
                          <strong>Invoice Impact:</strong> Refunds reopen invoices for additional payments
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row mt-5 g-4">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-speedometer2 text-primary fs-4"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-1 fw-bold">Quick Overview</h5>
                      <p className="text-muted mb-0 small">Your business management center</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <p className="card-text text-muted mb-4">
                    This is your business management panel where you can create, manage, and track your invoices. 
                    Use the navigation menu to access different sections of your business dashboard.
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center p-3 bg-light rounded-3">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                          <i className="bi bi-file-text text-primary fs-5"></i>
                        </div>
                        <div>
                          <h6 className="mb-1 fw-semibold">Invoice Management</h6>
                          <small className="text-muted">Create and manage your invoices</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-center p-3 bg-light rounded-3">
                        <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                          <i className="bi bi-people text-success fs-5"></i>
                        </div>
                        <div>
                          <h6 className="mb-1 fw-semibold">Client Management</h6>
                          <small className="text-muted">Manage your client relationships</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 py-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-info-circle text-info fs-4"></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-1 fw-bold">Account Information</h5>
                      <p className="text-muted mb-0 small">Your profile details</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {user ? (
                    <div className="space-y-3">
                      <div className="d-flex align-items-center p-3 bg-light rounded-3 mb-3">
                        <i className="bi bi-person text-primary me-3"></i>
                        <div>
                          <small className="text-muted d-block">Name</small>
                          <strong>{user.first_name} {user.last_name}</strong>
                        </div>
                      </div>
                      <div className="d-flex align-items-center p-3 bg-light rounded-3 mb-3">
                        <i className="bi bi-envelope text-primary me-3"></i>
                        <div>
                          <small className="text-muted d-block">Email</small>
                          <strong className="small">{user.email}</strong>
                        </div>
                      </div>
                      <div className="d-flex align-items-center p-3 bg-light rounded-3">
                        <i className="bi bi-shield-check text-primary me-3"></i>
                        <div>
                          <small className="text-muted d-block">Role</small>
                          <span className="badge bg-primary">Business Owner</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted mt-2 mb-0">Loading user information...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
