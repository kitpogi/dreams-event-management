import { useState, useEffect } from 'react';
import { createPaymentIntent, attachPaymentMethod } from '../../api/services/paymentService';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Loader2, CreditCard, Smartphone, QrCode, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { LoadingSpinner } from '../ui';
import { toast } from 'react-toastify';
import { cn } from '../../lib/utils';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit Card', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'gcash', label: 'GCash', icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-600/10' },
  { value: 'maya', label: 'Maya', icon: Smartphone, color: 'text-green-500', bg: 'bg-green-500/10' },
  { value: 'qr_ph', label: 'QR Ph', icon: QrCode, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
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
  const canPayRemaining = (bookingStatus === 'approved' || bookingStatus === 'confirmed') && remainingBalance > 0;
  const canPayFull = paymentStatus !== 'paid' && totalAmount > 0;

  // Determine default payment amount based on type
  const getPaymentAmount = () => {
    if (paymentType === 'deposit') return depositAmount;
    if (paymentType === 'remaining') return remainingBalance;
    if (paymentType === 'full') return totalAmount;
    return remainingBalance > 0 ? remainingBalance : depositAmount;
  };

  useEffect(() => {
    if (bookingStatus === 'pending' && paymentStatus === 'unpaid') {
      setPaymentType('deposit');
    } else if (remainingBalance > 0) {
      setPaymentType('remaining');
    } else {
      setPaymentType('full');
    }
  }, [bookingStatus, paymentStatus, remainingBalance]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paymongo.com/v1';
    script.async = true;
    script.onload = () => console.log('PayMongo SDK loaded');
    document.body.appendChild(script);

    return () => {
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
      setStep('method'); // Reset step so user can try again
      return;
    }

    try {
      const paymongo = window.Paymongo(clientKey);

      if (paymentMethod === 'card') {
        // --- CREDIT CARD FLOW ---
        const paymentForm = paymongo.paymentForm({
          intentId: intentId,
          onSuccess: async (payment) => {
            try {
              await attachPaymentMethod(intentId, payment.paymentMethodId);
              toast.success('Payment successful!');
              if (onSuccess) onSuccess(payment);
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

        const formContainer = document.getElementById('paymongo-payment-form');
        if (formContainer) paymentForm.mount('#paymongo-payment-form');

      } else {
        // --- E-WALLET FLOW (GCash, Maya, etc.) ---
        // Create the payment method first based on the selected type
        paymongo.createPaymentMethod({
          type: paymentMethod === 'maya' ? 'paymaya' : paymentMethod, // PayMongo uses 'paymaya' internally
          billing: {
            name: booking?.client?.client_fname ? `${booking.client.client_fname} ${booking.client.client_lname}` : 'Event Client',
            email: booking?.client?.client_email || null,
          }
        }).then(async (result) => {
          const paymentMethodId = result.id;

          try {
            // Attach it to the intent
            const attachResult = await attachPaymentMethod(intentId, paymentMethodId);

            if (attachResult.success) {
              const status = attachResult.data.status;

              if (status === 'awaiting_next_action') {
                // REDIRECT TO GCASH/MAYA
                const redirectUrl = attachResult.data.payment_intent.attributes.next_action.redirect.url;
                window.location.href = redirectUrl;
              } else if (status === 'succeeded') {
                toast.success('Payment successful!');
                if (onSuccess) onSuccess(attachResult.data);
              } else {
                toast.info(`Payment status: ${status}`);
              }
            } else {
              toast.error(attachResult.message || 'Failed to attach payment method');
              setStep('method');
            }
          } catch (error) {
            console.error('Attachment error:', error);
            toast.error(error.message || 'Failed to process redirect');
            setStep('method');
          }
        }).catch((error) => {
          console.error('Create Payment Method error:', error);
          toast.error(error.message || 'Failed to initialize wallet payment');
          setStep('method');
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
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Secure Checkout</CardTitle>
          <CardDescription>
            Processing your {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label} payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethod === 'card' ? (
            <div id="paymongo-payment-form" className="min-h-[350px] bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50"></div>
          ) : (
            <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
              <div className="relative inline-block">
                <LoadingSpinner size="xl" />
              </div>
              <p className="mt-6 text-lg font-medium">Redirecting to Secure Page...</p>
              <p className="text-sm text-muted-foreground mt-2">Please do not close this window</p>
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={() => setStep('method')} className="text-muted-foreground hover:text-foreground">
              ← Cancel and go back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">Secure Payment</span>
        </div>
        <CardTitle className="text-2xl font-bold">Complete Your Payment</CardTitle>
        <CardDescription>Choose how you would like to pay for your event.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Payment Type Grid */}
        {booking && (canPayDeposit || canPayRemaining || canPayFull) && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold opacity-70">1. Select Payment Schedule</Label>
            <RadioGroup value={paymentType} onValueChange={setPaymentType} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {canPayDeposit && (
                <div className="relative">
                  <RadioGroupItem value="deposit" id="deposit" className="peer sr-only" />
                  <Label
                    htmlFor="deposit"
                    className={cn(
                      "flex flex-col gap-1 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-sm"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold">Deposit (30%)</span>
                      <CheckCircle2 className={cn("h-4 w-4 text-primary opacity-0 transition-opacity", paymentType === 'deposit' && "opacity-100")} />
                    </div>
                    <span className="text-lg font-bold text-primary">{formatCurrency(depositAmount)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Required to confirm</span>
                  </Label>
                </div>
              )}
              {canPayRemaining && (
                <div className="relative">
                  <RadioGroupItem value="remaining" id="remaining" className="peer sr-only" />
                  <Label
                    htmlFor="remaining"
                    className={cn(
                      "flex flex-col gap-1 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-sm"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold">Remaining Bal.</span>
                      <CheckCircle2 className={cn("h-4 w-4 text-primary opacity-0 transition-opacity", paymentType === 'remaining' && "opacity-100")} />
                    </div>
                    <span className="text-lg font-bold text-primary">{formatCurrency(remainingBalance)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Due before event</span>
                  </Label>
                </div>
              )}
              {canPayFull && (
                <div className="relative">
                  <RadioGroupItem value="full" id="full" className="peer sr-only" />
                  <Label
                    htmlFor="full"
                    className={cn(
                      "flex flex-col gap-1 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-sm"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold">Pay in Full</span>
                      <CheckCircle2 className={cn("h-4 w-4 text-primary opacity-0 transition-opacity", paymentType === 'full' && "opacity-100")} />
                    </div>
                    <span className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Event Cost</span>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>
        )}

        {/* Payment Summary Header */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground font-medium">Amount to Pay Now</p>
            <h3 className="text-3xl font-black text-primary tracking-tight">{formatCurrency(getPaymentAmount())}</h3>
          </div>
          <div className="h-px w-full md:h-12 md:w-px bg-primary/20" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Cost</span>
            <span className="text-[11px] font-bold text-right">{formatCurrency(totalAmount)}</span>
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Already Paid</span>
            <span className="text-[11px] font-bold text-right text-green-600">-{formatCurrency(totalPaid)}</span>
          </div>
        </div>

        {/* Payment Methods Grid */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold opacity-70">2. Payment Method</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.value;
              return (
                <div key={method.value} className="relative">
                  <RadioGroupItem value={method.value} id={method.value} className="peer sr-only" />
                  <Label
                    htmlFor={method.value}
                    className={cn(
                      "flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-sm",
                      isSelected ? "border-primary" : "border-border"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg bg-background border border-border shadow-sm", method.bg)}>
                      <Icon className={cn("h-5 w-5", method.color)} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold tracking-tight leading-none">{method.label}</span>
                      {isSelected && <span className="text-[10px] text-primary font-bold mt-1">Selected</span>}
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3 pt-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 order-2 md:order-1 h-12 rounded-xl border-2 font-bold"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleCreatePaymentIntent}
            disabled={loading}
            className="flex-[2] order-1 md:order-2 h-12 rounded-xl shadow-lg shadow-primary/20 font-bold text-lg"
          >
            {loading ? (
              <><LoadingSpinner size="sm" /> Preparing...</>
            ) : (
              `Pay ${formatCurrency(getPaymentAmount())}`
            )}
          </Button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 opacity-60">
          <ShieldCheck className="h-3 w-3" /> Secure payments processed by PayMongo
        </p>
      </CardContent>
    </Card>
  );
}

