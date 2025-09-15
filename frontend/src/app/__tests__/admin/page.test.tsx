import { render, screen, waitFor } from '@testing-library/react'
import AdminDashboard from '../admin/page'

// Mock API functions
jest.mock('@/lib/api', () => ({
  fetchTotalAmount: jest.fn(),
  fetchCustomerStats: jest.fn(),
}))

import { fetchTotalAmount, fetchCustomerStats } from '@/lib/api'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

describe('Admin Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      role: 'business_owner'
    }))
  })

  it('should render admin dashboard with user info', () => {
    ;(fetchTotalAmount as jest.Mock).mockResolvedValueOnce({
      total_amount: 1000,
      total_paid: 500
    })
    ;(fetchCustomerStats as jest.Mock).mockResolvedValueOnce({
      total_customers: 10,
      customers_with_balance: 3
    })

    render(<AdminDashboard />)
    
    expect(screen.getByText('Business Owner Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, Admin!')).toBeInTheDocument()
  })

  it('should render loading state initially', () => {
    ;(fetchTotalAmount as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    ;(fetchCustomerStats as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<AdminDashboard />)
    
    expect(screen.getAllByText('Loading...')).toHaveLength(4) // 4 loading spinners
  })

  it('should display total invoice amount', async () => {
    ;(fetchTotalAmount as jest.Mock).mockResolvedValueOnce({
      total_amount: 1500.50,
      total_paid: 750.25
    })
    ;(fetchCustomerStats as jest.Mock).mockResolvedValueOnce({
      total_customers: 15,
      customers_with_balance: 5
    })

    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('$1,500.50 CAD')).toBeInTheDocument()
    })
  })

  it('should display total paid amount', async () => {
    ;(fetchTotalAmount as jest.Mock).mockResolvedValueOnce({
      total_amount: 1500.50,
      total_paid: 750.25
    })
    ;(fetchCustomerStats as jest.Mock).mockResolvedValueOnce({
      total_customers: 15,
      customers_with_balance: 5
    })

    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('$750.25 CAD')).toBeInTheDocument()
    })
  })

  it('should calculate remaining balance correctly', async () => {
    ;(fetchTotalAmount as jest.Mock).mockResolvedValueOnce({
      total_amount: 1000,
      total_paid: 300
    })
    ;(fetchCustomerStats as jest.Mock).mockResolvedValueOnce({
      total_customers: 10,
      customers_with_balance: 3
    })

    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('$700.00 CAD')).toBeInTheDocument()
    })
  })

  it('should display customer statistics', async () => {
    ;(fetchTotalAmount as jest.Mock).mockResolvedValueOnce({
      total_amount: 1000,
      total_paid: 500
    })
    ;(fetchCustomerStats as jest.Mock).mockResolvedValueOnce({
      total_customers: 25,
      customers_with_balance: 8
    })

    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument() // Total customers
      expect(screen.getByText('8')).toBeInTheDocument() // Customers with balance
    })
  })

  it('should render refund management section', () => {
    render(<AdminDashboard />)
    
    expect(screen.getByText('Refund Management')).toBeInTheDocument()
    expect(screen.getByText('Process Refund')).toBeInTheDocument()
    expect(screen.getByText('Refund History')).toBeInTheDocument()
  })

  it('should render quick overview section', () => {
    render(<AdminDashboard />)
    
    expect(screen.getByText('Quick Overview')).toBeInTheDocument()
    expect(screen.getByText('Invoice Management')).toBeInTheDocument()
    expect(screen.getByText('Client Management')).toBeInTheDocument()
  })

  it('should render account information section', () => {
    render(<AdminDashboard />)
    
    expect(screen.getByText('Account Information')).toBeInTheDocument()
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('Business Owner')).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    ;(fetchTotalAmount as jest.Mock).mockRejectedValueOnce(new Error('API Error'))
    ;(fetchCustomerStats as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<AdminDashboard />)
    
    // Should still render the dashboard even with API errors
    expect(screen.getByText('Business Owner Dashboard')).toBeInTheDocument()
  })

  it('should display business owner badge', () => {
    render(<AdminDashboard />)
    
    expect(screen.getByText('Business Owner')).toBeInTheDocument()
    expect(screen.getByText('Business Owner')).toHaveClass('badge', 'bg-primary')
  })

  it('should render with proper Bootstrap classes', () => {
    render(<AdminDashboard />)
    
    expect(screen.getByText('Business Owner Dashboard').closest('div')).toHaveClass('container-fluid')
    expect(screen.getByText('Total Invoice Amount').closest('div')).toHaveClass('card')
  })

  it('should handle zero values correctly', async () => {
    ;(fetchTotalAmount as jest.Mock).mockResolvedValueOnce({
      total_amount: 0,
      total_paid: 0
    })
    ;(fetchCustomerStats as jest.Mock).mockResolvedValueOnce({
      total_customers: 0,
      customers_with_balance: 0
    })

    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('$0.00 CAD')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })
})
