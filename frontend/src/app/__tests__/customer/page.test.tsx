import { render, screen, waitFor } from '@testing-library/react'
import CustomerDashboard from '../customer/page'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

describe('Customer Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render customer dashboard with user info', () => {
    const mockUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role: 'customer'
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))

    render(<CustomerDashboard />)
    
    expect(screen.getByText('Customer Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, John!')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('should render with default text when no user data', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<CustomerDashboard />)
    
    expect(screen.getByText('Welcome back, Customer!')).toBeInTheDocument()
    expect(screen.getByText('Loading user information...')).toBeInTheDocument()
  })

  it('should render customer role badge', () => {
    const mockUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role: 'customer'
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))

    render(<CustomerDashboard />)
    
    expect(screen.getByText('Customer')).toBeInTheDocument()
    expect(screen.getByText('Customer')).toHaveClass('badge', 'bg-info')
  })

  it('should render invoice section', () => {
    render(<CustomerDashboard />)
    
    expect(screen.getByText('Your Invoices')).toBeInTheDocument()
    expect(screen.getByText('View your invoices and make payments. Click on any invoice to see details and payment options.')).toBeInTheDocument()
  })

  it('should render empty state for invoices', () => {
    render(<CustomerDashboard />)
    
    expect(screen.getByText('No invoices found')).toBeInTheDocument()
  })

  it('should render account information section', () => {
    const mockUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      role: 'customer'
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))

    render(<CustomerDashboard />)
    
    expect(screen.getByText('Account Information')).toBeInTheDocument()
    expect(screen.getByText('Name:')).toBeInTheDocument()
    expect(screen.getByText('Email:')).toBeInTheDocument()
    expect(screen.getByText('Role:')).toBeInTheDocument()
  })

  it('should handle invalid user data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json')

    render(<CustomerDashboard />)
    
    expect(screen.getByText('Welcome back, Customer!')).toBeInTheDocument()
  })

  it('should render with proper Bootstrap classes', () => {
    render(<CustomerDashboard />)
    
    expect(screen.getByText('Customer Dashboard').closest('div')).toHaveClass('container-fluid')
    expect(screen.getByText('Your Invoices').closest('div')).toHaveClass('card')
  })

  it('should display user name correctly', () => {
    const mockUser = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      role: 'customer'
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))

    render(<CustomerDashboard />)
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('should render loading state initially', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<CustomerDashboard />)
    
    expect(screen.getByText('Loading user information...')).toBeInTheDocument()
  })
})
