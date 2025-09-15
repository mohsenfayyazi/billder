import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '../page'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock API functions
jest.mock('@/lib/api', () => ({
  login: jest.fn(),
}))

import { login } from '@/lib/api'

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
}

describe('Login Page', () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(login as jest.Mock).mockClear()
    mockPush.mockClear()
  })

  it('should render login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should handle form submission with valid credentials', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      token: 'test-token',
      user: { id: 1, email: 'test@example.com', first_name: 'Test', role: 'customer' }
    }
    ;(login as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user))
      expect(mockPush).toHaveBeenCalledWith('/customer')
    })
  })

  it('should handle form submission with business owner', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      token: 'test-token',
      user: { id: 1, email: 'admin@example.com', first_name: 'Admin', role: 'business_owner' }
    }
    ;(login as jest.Mock).mockResolvedValueOnce(mockResponse)

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'admin@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('should handle login error', async () => {
    const user = userEvent.setup()
    ;(login as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'))

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    ;(login as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(login).not.toHaveBeenCalled()
  })

  it('should have proper form attributes', () => {
    render(<LoginPage />)
    
    const form = screen.getByRole('form')
    expect(form).toHaveAttribute('noValidate')
  })

  it('should render sign up link', () => {
    render(<LoginPage />)
    
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByText('Sign up')).toBeInTheDocument()
  })

  it('should handle form reset on error', async () => {
    const user = userEvent.setup()
    ;(login as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })

    // Form should be reset
    expect(emailInput).toHaveValue('')
    expect(passwordInput).toHaveValue('')
  })
})
