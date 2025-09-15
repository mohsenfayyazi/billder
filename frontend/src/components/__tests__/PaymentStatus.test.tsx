import { render, screen } from '@testing-library/react'
import PaymentStatus from '../PaymentStatus'

describe('PaymentStatus', () => {
  it('should render succeeded status correctly', () => {
    render(<PaymentStatus status="succeeded" />)
    
    expect(screen.getByText('Payment Successful')).toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('should render processing status correctly', () => {
    render(<PaymentStatus status="processing" />)
    
    expect(screen.getByText('Processing Payment...')).toBeInTheDocument()
    expect(screen.getByText('⏳')).toBeInTheDocument()
  })

  it('should render failed status correctly', () => {
    render(<PaymentStatus status="failed" />)
    
    expect(screen.getByText('Payment Failed')).toBeInTheDocument()
    expect(screen.getByText('✗')).toBeInTheDocument()
  })

  it('should render pending status correctly', () => {
    render(<PaymentStatus status="pending" />)
    
    expect(screen.getByText('Payment Pending')).toBeInTheDocument()
    expect(screen.getByText('⏱️')).toBeInTheDocument()
  })

  it('should render canceled status correctly', () => {
    render(<PaymentStatus status="canceled" />)
    
    expect(screen.getByText('Payment Canceled')).toBeInTheDocument()
    expect(screen.getByText('✗')).toBeInTheDocument()
  })

  it('should render unknown status correctly', () => {
    render(<PaymentStatus status="unknown" />)
    
    expect(screen.getByText('Unknown Status')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    render(<PaymentStatus status="succeeded" className="custom-class" />)
    
    const container = screen.getByText('Payment Successful').closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('should render with amount when provided', () => {
    render(<PaymentStatus status="succeeded" amount="100.00" />)
    
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('should render without amount when not provided', () => {
    render(<PaymentStatus status="succeeded" />)
    
    expect(screen.queryByText(/\$\d+\.\d+/)).not.toBeInTheDocument()
  })
})
