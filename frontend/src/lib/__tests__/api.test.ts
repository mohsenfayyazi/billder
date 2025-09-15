// Mock fetch globally
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

import {
  login,
  register,
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  fetchPayments,
  fetchInvoicePayments,
  createPayment,
  fetchTotalAmount,
  fetchCustomerStats,
} from '../api'

describe('API functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      return null
    })
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        token: 'test-token',
        user: { id: 1, email: 'test@example.com', first_name: 'Test' }
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await login('test@example.com', 'password123')

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw error for invalid credentials', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      })

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = {
        token: 'test-token',
        user: { id: 1, email: 'test@example.com', first_name: 'Test' }
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        role: 'customer'
      }

      const result = await register(userData)

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchInvoices', () => {
    it('should fetch invoices successfully', async () => {
      const mockInvoices = {
        results: [
          { id: 1, reference: 'INV-001', total_amount: '100.00', status: 'pending' }
        ]
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvoices,
      })

      const result = await fetchInvoices()

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/invoices/', {
        headers: {
          'Authorization': 'Token test-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockInvoices)
    })

    it('should handle fetch errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(fetchInvoices()).rejects.toThrow('Network error')
    })
  })

  describe('fetchInvoice', () => {
    it('should fetch single invoice successfully', async () => {
      const mockInvoice = { id: 1, reference: 'INV-001', total_amount: '100.00' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvoice,
      })

      const result = await fetchInvoice('1')

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/invoices/1/', {
        headers: {
          'Authorization': 'Token test-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockInvoice)
    })
  })

  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      const invoiceData = {
        customer_name: 'Test Customer',
        total_amount: '100.00',
        currency: 'CAD'
      }
      const mockResponse = { id: 1, ...invoiceData }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await createInvoice(invoiceData)

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/invoices/', {
        method: 'POST',
        headers: {
          'Authorization': 'Token test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchPayments', () => {
    it('should fetch payments successfully', async () => {
      const mockPayments = {
        results: [
          { id: 1, amount: '50.00', status: 'succeeded' }
        ]
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayments,
      })

      const result = await fetchPayments()

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/payments/', {
        headers: {
          'Authorization': 'Token test-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockPayments)
    })
  })

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const paymentData = {
        invoice_id: 1,
        amount: '50.00',
        currency: 'CAD'
      }
      const mockResponse = { id: 1, ...paymentData, status: 'succeeded' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await createPayment(paymentData)

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/payments/', {
        method: 'POST',
        headers: {
          'Authorization': 'Token test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchTotalAmount', () => {
    it('should fetch total amount successfully', async () => {
      const mockData = { total_amount: '1000.00', total_paid: '500.00' }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await fetchTotalAmount()

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/invoices/total-amount/', {
        headers: {
          'Authorization': 'Token test-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockData)
    })
  })

  describe('fetchCustomerStats', () => {
    it('should fetch customer stats successfully', async () => {
      const mockData = { total_customers: 10, customers_with_balance: 3 }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await fetchCustomerStats()

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/invoices/customer-stats/', {
        headers: {
          'Authorization': 'Token test-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockData)
    })
  })
})
