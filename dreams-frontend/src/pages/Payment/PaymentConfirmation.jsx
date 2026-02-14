import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaymentStatus } from '../../api/services/paymentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Home, CreditCard, Sparkles, Package } from 'lucide-react';
import { LoadingSpinner, AnimatedBackground, ParticlesBackground } from '../../components/features';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { toast } from 'react-toastify';

export default function PaymentConfirmation() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const redirectTimerRef = useRef(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentStatus();
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [paymentId]);

  const fetchPaymentStatus = async () => {
    try {
      const result = await getPaymentStatus(paymentId);
      if (result.success) {
        setPayment(result.data);

        if (isAuthenticated && result.data.booking) {
          const bookingId = result.data.booking.booking_id;
          const status = result.data.status;

          if (status === 'paid') {
            toast.success('🎉 Payment successful!');
          }

          startCountdownRedirect(`/dashboard/bookings/${bookingId}`);
        } else if (isAuthenticated) {
          startCountdownRedirect('/dashboard');
        }
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCountdownRedirect = (targetPath) => {
    let seconds = 5;
    setCountdown(seconds);

    const interval = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) clearInterval(interval);
    }, 1000);

    redirectTimerRef.current = setTimeout(() => {
      clearInterval(interval);
      navigate(targetPath, { replace: true, state: { showSuccessBanner: true } });
    }, 5000);
  };

  const handleGoNow = () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    const target = isAuthenticated ? (payment?.booking ? `/dashboard/bookings/${payment.booking.booking_id}` : '/dashboard') : '/login';
    navigate(target, { replace: true });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
        return {
          icon: <div className="w-24 h-24 bg-green-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-500/40 animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>,
          title: 'Payment Confirmed',
          description: 'Your payment was processed successfully. Your event is one step closer to reality!',
          accent: 'text-green-500',
          gradient: 'from-green-500/10 to-emerald-500/5',
          border: 'border-green-500/20'
        };
      case 'failed':
        return {
          icon: <div className="w-24 h-24 bg-red-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-500/40 animate-in zoom-in-50 duration-500">
            <XCircle className="h-12 w-12 text-white" />
          </div>,
          title: 'Payment Failed',
          description: 'Something went wrong while processing your payment. Please try again or contact support.',
          accent: 'text-red-500',
          gradient: 'from-red-500/10 to-rose-500/5',
          border: 'border-red-500/20'
        };
      default:
        return {
          icon: <div className="w-24 h-24 bg-amber-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-amber-500/40 animate-in zoom-in-50 duration-500">
            <AlertCircle className="h-12 w-12 text-white" />
          </div>,
          title: 'Payment Cancelled',
          description: 'The payment process was cancelled. You can try again whenever you are ready.',
          accent: 'text-amber-500',
          gradient: 'from-amber-500/10 to-yellow-500/5',
          border: 'border-amber-500/20'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <AnimatedBackground type="mesh" colors={['#3B82F6', '#8B5CF6', '#D946EF']} speed={0.1} blur={true} />
        </div>
        <div className="relative z-10 text-center space-y-6">
          <LoadingSpinner size="xl" className="mx-auto" />
          <div>
            <h2 className="text-2xl font-black text-white mb-2">Verifying Secure Payment</h2>
            <p className="text-slate-400 font-medium">Please wait while we sync with the payment gateway...</p>
          </div>
        </div>
      </div>
    );
  }

  const config = getStatusConfig(payment?.status);

  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 z-0">
        <AnimatedBackground type="mesh" colors={['#3B82F6', '#1E40AF', '#8B5CF6']} speed={0.08} blur={true} />
        <ParticlesBackground particleCount={40} particleColor="rgba(147, 197, 253, 0.15)" speed={0.015} />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <div className={cn(
          "glass-card p-10 md:p-14 rounded-[3rem] border shadow-3xl overflow-hidden relative group",
          config.border
        )}>
          {/* Subtle light effect */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-8">
            {config.icon}

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none italic">
                {config.title}
              </h1>
              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md mx-auto">
                {config.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">Amount</p>
                <p className="text-2xl font-black text-white">{formatCurrency(payment?.amount)}</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">Reference</p>
                <p className="text-base font-bold text-white font-mono">{payment?.transaction_id?.substring(0, 10) || 'N/A'}</p>
              </div>
            </div>

            <div className="w-full space-y-4 pt-4 text-center">
              {isAuthenticated ? (
                <>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Redirecting to portal in {countdown}s
                  </p>
                  <Button onClick={handleGoNow} className="w-full h-16 rounded-2xl bg-white text-black hover:bg-slate-200 text-xl font-black shadow-2xl transition-all group">
                    Enter Dashboard
                    <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={() => navigate('/login')} className="h-16 rounded-2xl bg-primary text-white text-lg font-black shadow-xl">
                    Log In to Portal
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="h-16 rounded-2xl border-white/10 text-white hover:bg-white/5 text-lg font-black">
                    Return Home
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <Package className="w-5 h-5 text-white" />
          <span className="text-sm font-black text-white uppercase tracking-[0.3em]">Dreams Events</span>
        </div>
      </div>
    </div>
  );
}
