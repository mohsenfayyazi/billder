'use client';

interface PaymentStatusProps {
  status: string;
  amount?: string;
  className?: string;
}

export default function PaymentStatus({ status, amount, className = '' }: PaymentStatusProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'succeeded':
        return {
          text: 'Payment Successful',
          color: 'text-green-600 bg-green-50',
          icon: '✓'
        };
      case 'processing':
        return {
          text: 'Processing Payment...',
          color: 'text-blue-600 bg-blue-50',
          icon: '⏳'
        };
      case 'pending':
        return {
          text: 'Payment Pending',
          color: 'text-yellow-600 bg-yellow-50',
          icon: '⏱️'
        };
      case 'failed':
        return {
          text: 'Payment Failed',
          color: 'text-red-600 bg-red-50',
          icon: '✗'
        };
      case 'canceled':
        return {
          text: 'Payment Canceled',
          color: 'text-red-600 bg-red-50',
          icon: '✗'
        };
      default:
        return {
          text: 'Unknown Status',
          color: 'text-gray-600 bg-gray-50',
          icon: '?'
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className={`p-3 rounded-lg border ${statusInfo.color} ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{statusInfo.icon}</span>
        <span className="font-medium">{statusInfo.text}</span>
        {amount && (
          <span className="ml-auto font-bold">${amount}</span>
        )}
      </div>
    </div>
  );
}
