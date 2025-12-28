import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!token || !email) {
      setError('Invalid verification link. Please check your email and try again.');
      setLoading(false);
      return;
    }

    verifyEmail(token, email);
  }, [searchParams]);

  const verifyEmail = async (token, email) => {
    try {
      setLoading(true);
      await api.post('/auth/verify-email', { token, email });
      setSuccess(true);
      toast.success('Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to verify email. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = searchParams.get('email');
    if (!email) {
      toast.error('Email address not found in verification link.');
      return;
    }

    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification email.';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
        <div className="layout-container flex h-full grow flex-col">
          <div className="flex flex-1 justify-center items-center p-4 sm:p-6 md:p-8">
            <div className="layout-content-container flex flex-row max-w-2xl w-full bg-white dark:bg-black/20 shadow-xl rounded-xl overflow-hidden p-8 sm:p-12">
              <div className="w-full text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Verifying your email address...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
        <div className="layout-container flex h-full grow flex-col">
          <div className="flex flex-1 justify-center items-center p-4 sm:p-6 md:p-8">
            <div className="layout-content-container flex flex-row max-w-2xl w-full bg-white dark:bg-black/20 shadow-xl rounded-xl overflow-hidden p-8 sm:p-12">
              <div className="w-full text-center">
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Email Verified Successfully!</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your email address has been verified. You will be redirected to the login page shortly.
                </p>
                <Link 
                  to="/login"
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center items-center p-4 sm:p-6 md:p-8">
          <div className="layout-content-container flex flex-row max-w-2xl w-full bg-white dark:bg-black/20 shadow-xl rounded-xl overflow-hidden p-8 sm:p-12">
            <div className="w-full text-center">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Verification Failed</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'Unable to verify your email address. The verification link may have expired or is invalid.'}
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleResendVerification}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Resend Verification Email
                </button>
                <Link 
                  to="/login"
                  className="block text-primary hover:underline text-sm font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

