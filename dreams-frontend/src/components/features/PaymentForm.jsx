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

export default function PaymentForm({ bookingId, amount, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [clientKey, setClientKey] = useState(null);
  const [step, setStep] = useState('method'); // 'method' or 'processing'

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
    if (!amount || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setLoading(true);
    try {
      const result = await createPaymentIntent(bookingId, amount, [paymentMethod]);
      
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
        <div className="space-y-2">
          <Label>Payment Amount</Label>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(amount)}
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

