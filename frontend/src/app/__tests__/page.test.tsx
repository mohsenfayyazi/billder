import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Home from '../page'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
}

describe('Home Page', () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    // Clear localStorage mock
    jest.clearAllMocks()
  })

  it('should render hero section', () => {
    render(<Home />)
    
    expect(screen.getByText('Welcome to Billder')).toBeInTheDocument()
    expect(screen.getByText('Your billing and invoice management solution')).toBeInTheDocument()
  })

  it('should render call-to-action button', () => {
    render(<Home />)
    
    expect(screen.getByText('Go to Login')).toBeInTheDocument()
  })

  it('should have proper navigation link', () => {
    render(<Home />)
    
    const loginLink = screen.getByText('Go to Login').closest('a')
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('should handle user authentication check on mount', async () => {
    // Mock localStorage with valid token
    const mockUser = { id: 1, email: 'test@example.com', first_name: 'Test', role: 'customer' }
    const mockToken = 'valid-token'
    const mockExpiry = Date.now() + 3600000 // 1 hour from now
    
    localStorageMock.getItem
      .mockReturnValueOnce(mockToken) // token
      .mockReturnValueOnce(JSON.stringify(mockUser)) // user
      .mockReturnValueOnce(mockExpiry.toString()) // tokenExpiry

    render(<Home />)
    
    // Should redirect to appropriate dashboard
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/customer')
    })
  })

  it('should handle expired token', async () => {
    // Mock localStorage with expired token
    const mockUser = { id: 1, email: 'test@example.com', first_name: 'Test', role: 'customer' }
    const mockToken = 'expired-token'
    const mockExpiry = Date.now() - 3600000 // 1 hour ago
    
    localStorageMock.getItem
      .mockReturnValueOnce(mockToken) // token
      .mockReturnValueOnce(JSON.stringify(mockUser)) // user
      .mockReturnValueOnce(mockExpiry.toString()) // tokenExpiry

    render(<Home />)
    
    // Should clear localStorage and not redirect
    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tokenExpiry')
    })
  })

  it('should handle invalid user data', async () => {
    // Mock localStorage with invalid user data
    localStorageMock.getItem
      .mockReturnValueOnce('valid-token') // token
      .mockReturnValueOnce('invalid-json') // user
      .mockReturnValueOnce(Date.now().toString()) // tokenExpiry

    render(<Home />)
    
    // Should clear localStorage
    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tokenExpiry')
    })
  })

  it('should render without authentication when no token', () => {
    // Mock localStorage with no token
    localStorageMock.getItem.mockReturnValue(null)

    render(<Home />)
    
    expect(screen.getByText('Welcome to Billder')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
