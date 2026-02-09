import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaymentStatus } from '../../api/services/paymentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui';
import { toast } from 'react-toastify';

export default function PaymentConfirmation() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentStatus();
    }
  }, [paymentId]);

  const fetchPaymentStatus = async () => {
    try {
      const result = await getPaymentStatus(paymentId);
      if (result.success) {
        setPayment(result.data);
      } else {
        toast.error('Failed to fetch payment status');
      }
    } catch (error) {
      console.error('Payment status fetch error:', error);
      toast.error('Failed to fetch payment status');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <LoadingSpinner size="xl" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'paid':
        return {
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully.',
          color: 'text-green-600',
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          color: 'text-red-600',
        };
      case 'cancelled':
        return {
          title: 'Payment Cancelled',
          message: 'Your payment was cancelled.',
          color: 'text-yellow-600',
        };
      default:
        return {
          title: 'Processing Payment',
          message: 'Your payment is being processed. Please wait...',
          color: 'text-yellow-600',
        };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusMessage(payment.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon(payment.status)}
          </div>
          <CardTitle className={statusInfo.color}>
            {statusInfo.title}
          </CardTitle>
          <CardDescription>{statusInfo.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-medium">Payment Amount:</span>
              <span className="text-lg font-bold">{formatCurrency(payment.amount)}</span>
            </div>

            {payment.booking && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-medium">#{payment.booking.booking_id}</span>
                </div>
                {payment.booking.eventPackage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package:</span>
                    <span className="font-medium">{payment.booking.eventPackage.package_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Date:</span>
                  <span className="font-medium">
                    {new Date(payment.booking.event_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">{payment.payment_method_display || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium capitalize ${statusInfo.color}`}>
                  {payment.status}
                </span>
              </div>
              {payment.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At:</span>
                  <span className="font-medium">
                    {new Date(payment.paid_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            {payment.booking && (
              <Button
                onClick={() => navigate(`/dashboard/bookings/${payment.booking.booking_id}`)}
                className="flex-1"
              >
                View Booking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

