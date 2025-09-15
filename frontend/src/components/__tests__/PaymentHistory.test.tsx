import { render, screen } from '@testing-library/react'
import PaymentHistory from '../PaymentHistory'

const mockPayments = [
  {
    id: '1',
    amount: '100.00',
    currency: 'CAD',
    status: 'succeeded',
    payment_method: 'card',
    created_at: '2024-01-01T10:00:00Z',
    invoice: {
      id: '1',
      reference: 'INV-001',
      customer_name: 'Test Customer'
    }
  },
  {
    id: '2',
    amount: '50.00',
    currency: 'CAD',
    status: 'failed',
    payment_method: 'card',
    created_at: '2024-01-02T10:00:00Z',
    invoice: {
      id: '2',
      reference: 'INV-002',
      customer_name: 'Test Customer'
    }
  }
]

describe('PaymentHistory', () => {
  it('should render payment history with payments', () => {
    render(<PaymentHistory payments={mockPayments} />)
    
    expect(screen.getByText('Payment History')).toBeInTheDocument()
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('INV-002')).toBeInTheDocument()
    expect(screen.getByText('$100.00 CAD')).toBeInTheDocument()
    expect(screen.getByText('$50.00 CAD')).toBeInTheDocument()
  })

  it('should render empty state when no payments', () => {
    render(<PaymentHistory payments={[]} />)
    
    expect(screen.getByText('No payments found')).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    render(<PaymentHistory payments={mockPayments} className="custom-class" />)
    
    const container = screen.getByText('Payment History').closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('should display payment status correctly', () => {
    render(<PaymentHistory payments={mockPayments} />)
    
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('should display payment dates correctly', () => {
    render(<PaymentHistory payments={mockPayments} />)
    
    // Check if dates are formatted and displayed
    expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument()
    expect(screen.getByText(/Jan 2, 2024/)).toBeInTheDocument()
  })

  it('should display customer names correctly', () => {
    render(<PaymentHistory payments={mockPayments} />)
    
    expect(screen.getByText('Test Customer')).toBeInTheDocument()
  })

  it('should handle single payment', () => {
    const singlePayment = [mockPayments[0]]
    render(<PaymentHistory payments={singlePayment} />)
    
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.queryByText('INV-002')).not.toBeInTheDocument()
  })

  it('should render payment amounts with correct formatting', () => {
    render(<PaymentHistory payments={mockPayments} />)
    
    // Check for properly formatted currency
    expect(screen.getByText('$100.00 CAD')).toBeInTheDocument()
    expect(screen.getByText('$50.00 CAD')).toBeInTheDocument()
  })
})
