import { useState, useEffect } from 'react';
import { createPaymentIntent, attachPaymentMethod } from '../../api/services/paymentService';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Loader2, CreditCard, Smartphone, QrCode, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { value: 'gcash', label: 'GCash', icon: Smartphone },
  { value: 'maya', label: 'Maya', icon: Smartphone },
  { value: 'qr_ph', label: 'QR Ph', icon: QrCode },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
];

export default function PaymentForm({ bookingId, amount, booking, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [clientKey, setClientKey] = useState(null);
  const [step, setStep] = useState('method'); // 'method' or 'processing'
  const [paymentType, setPaymentType] = useState('remaining'); // 'deposit', 'remaining', 'full'

  // Calculate payment amounts
  const bookingStatus = (booking?.booking_status || '').toLowerCase();
  const paymentStatus = booking?.payment_status || 'unpaid';
  const totalAmount = parseFloat(booking?.total_amount || amount || 0);
  const depositAmount = parseFloat(booking?.deposit_amount || (totalAmount * 0.30));
  const totalPaid = booking?.total_paid || 0;
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  // Determine available payment options
  const canPayDeposit = bookingStatus === 'pending' && paymentStatus !== 'paid';
  const canPayRemaining = bookingStatus !== 'pending' && remainingBalance > 0;
  const canPayFull = paymentStatus !== 'paid' && totalAmount > 0;

  // Determine default payment amount based on type
  const getPaymentAmount = () => {
    if (paymentType === 'deposit') return depositAmount;
    if (paymentType === 'remaining') return remainingBalance;
    if (paymentType === 'full') return totalAmount;
    // Default: remaining balance or deposit
    return remainingBalance > 0 ? remainingBalance : depositAmount;
  };

  // Set default payment type
  useEffect(() => {
    if (bookingStatus === 'pending' && paymentStatus === 'unpaid') {
      setPaymentType('deposit'); // Default to deposit for pending unpaid
    } else if (remainingBalance > 0) {
      setPaymentType('remaining'); // Default to remaining for approved
    } else {
      setPaymentType('full'); // Fallback to full
    }
  }, [bookingStatus, paymentStatus, remainingBalance]);

  useEffect(() => {
    // Load PayMongo JS SDK
    const script = document.createElement('script');
    script.src = 'https://js.paymongo.com/v1';
    script.async = true;
    script.onload = () => {
      console.log('PayMongo SDK loaded');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCreatePaymentIntent = async () => {
    const paymentAmount = getPaymentAmount();

    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setLoading(true);
    try {
      const result = await createPaymentIntent(bookingId, paymentAmount, [paymentMethod]);

      if (result.success) {
        setPaymentIntentId(result.data.payment_intent_id);
        setClientKey(result.data.client_key);
        setStep('processing');
        initializePayMongo(result.data.client_key, result.data.payment_intent_id);
      } else {
        toast.error(result.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Payment intent creation error:', error);
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const initializePayMongo = (clientKey, intentId) => {
    if (typeof window.Paymongo === 'undefined') {
      toast.error('PayMongo SDK not loaded. Please refresh the page.');
      return;
    }

    try {
      const paymongo = window.Paymongo(clientKey);

      // For card payments, use PayMongo's payment form
      if (paymentMethod === 'card') {
        const paymentForm = paymongo.paymentForm({
          intentId: intentId,
          onSuccess: async (payment) => {
            try {
              await attachPaymentMethod(intentId, payment.paymentMethodId);
              toast.success('Payment successful!');
              if (onSuccess) {
                onSuccess(payment);
              }
            } catch (error) {
              console.error('Payment attachment error:', error);
              toast.error('Payment processing failed');
            }
          },
          onError: (error) => {
            console.error('Payment error:', error);
            toast.error(error.message || 'Payment failed');
            setStep('method');
          },
        });

        // Mount the payment form
        const formContainer = document.getElementById('paymongo-payment-form');
        if (formContainer) {
          paymentForm.mount('#paymongo-payment-form');
        }
      } else {
        // For e-wallet payments (GCash, Maya), redirect to PayMongo checkout
        paymongo.redirect(intentId, {
          onSuccess: async (payment) => {
            try {
              await attachPaymentMethod(intentId, payment.paymentMethodId);
              toast.success('Payment successful!');
              if (onSuccess) {
                onSuccess(payment);
              }
            } catch (error) {
              console.error('Payment attachment error:', error);
              toast.error('Payment processing failed');
            }
          },
          onError: (error) => {
            console.error('Payment error:', error);
            toast.error(error.message || 'Payment failed');
            setStep('method');
          },
        });
      }
    } catch (error) {
      console.error('PayMongo initialization error:', error);
      toast.error('Failed to initialize payment form');
      setStep('method');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (step === 'processing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processing Payment</CardTitle>
          <CardDescription>
            Please complete your payment using {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethod === 'card' ? (
            <div id="paymongo-payment-form" className="min-h-[400px]"></div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                Redirecting to {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label} payment...
              </p>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setStep('method')} className="w-full">
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Select your preferred payment method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Type Selection (if booking data available) */}
        {booking && (canPayDeposit || canPayRemaining || canPayFull) && (
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <RadioGroup value={paymentType} onValueChange={setPaymentType}>
              <div className="grid grid-cols-1 gap-3">
                {canPayDeposit && (
                  <div>
                    <RadioGroupItem value="deposit" id="deposit" className="peer sr-only" />
                    <Label
                      htmlFor="deposit"
                      className="flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                    >
                      <div>
                        <p className="font-semibold">Pay Deposit (30%)</p>
                        <p className="text-sm text-muted-foreground">Secure your booking</p>
                      </div>
                      <span className="font-bold text-primary">{formatCurrency(depositAmount)}</span>
                    </Label>
                  </div>
                )}
                {canPayRemaining && (
                  <div>
                    <RadioGroupItem value="remaining" id="remaining" className="peer sr-only" />
                    <Label
                      htmlFor="remaining"
                      className="flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                    >
                      <div>
                        <p className="font-semibold">Pay Remaining Balance</p>
                        <p className="text-sm text-muted-foreground">Due before event</p>
                      </div>
                      <span className="font-bold text-primary">{formatCurrency(remainingBalance)}</span>
                    </Label>
                  </div>
                )}
                {canPayFull && (
                  <div>
                    <RadioGroupItem value="full" id="full" className="peer sr-only" />
                    <Label
                      htmlFor="full"
                      className="flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                    >
                      <div>
                        <p className="font-semibold">Pay in Full</p>
                        <p className="text-sm text-muted-foreground">Complete payment</p>
                      </div>
                      <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </Label>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Payment Summary */}
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <Label>Payment Summary</Label>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            {booking && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit Amount:</span>
                  <span className="font-medium">{formatCurrency(depositAmount)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                  </div>
                )}
                {remainingBalance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(remainingBalance)}</span>
                  </div>
                )}
              </>
            )}
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="font-semibold">Amount to Pay:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(getPaymentAmount())}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="grid grid-cols-1 gap-4">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.value}>
                    <RadioGroupItem
                      value={method.value}
                      id={method.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={method.value}
                      className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1">{method.label}</span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button
            onClick={handleCreatePaymentIntent}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue to Payment'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

