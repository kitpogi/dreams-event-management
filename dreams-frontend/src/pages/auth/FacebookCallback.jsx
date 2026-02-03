import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const FacebookCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Debug: Log all URL parameters
      console.log('Facebook callback - Full URL:', window.location.href);
      console.log('Facebook callback - All search params:', Object.fromEntries(searchParams));
      console.log('Facebook callback - code:', code ? 'received' : 'missing');
      console.log('Facebook callback - error:', errorParam);

      if (errorParam) {
        setError(errorDescription || 'Facebook login was cancelled.');
        setIsLoading(false);
        toast.error(errorDescription || 'Facebook login was cancelled.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!code) {
        setError('No authorization code received from Facebook.');
        setIsLoading(false);
        toast.error('No authorization code received from Facebook.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // Send the code to backend to exchange for access token and get user info
        const redirectUri = window.location.origin + '/auth/facebook/callback';

        console.log('Sending code to backend...');
        const result = await api.post('/auth/facebook/callback', {
          code,
          redirect_uri: redirectUri,
        });

        console.log('Backend response:', result.data);

        if (result.data.token) {
          localStorage.setItem('token', result.data.token);
          localStorage.setItem('user', JSON.stringify(result.data.user));
          setToken(result.data.token);
          setUser(result.data.user);
          toast.success('Successfully signed in with Facebook!');

          // Get the redirect URL from session storage
          const redirectTo = sessionStorage.getItem('fb_auth_redirect') || '/dashboard';
          sessionStorage.removeItem('fb_auth_redirect');

          const userData = result.data.user;
          if (userData.role === 'admin' || userData.role === 'coordinator') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate(redirectTo, { replace: true });
          }
        }
      } catch (err) {
        console.error('Facebook callback error:', err);
        console.error('Error response:', err.response?.data);
        const errorMessage = err.response?.data?.message || 'Failed to sign in with Facebook';
        setError(errorMessage);
        setIsLoading(false);
        toast.error(errorMessage);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Failed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to login page...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#1877F2] animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Signing in with Facebook</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please wait while we complete your login...</p>
            <div className="w-8 h-8 mx-auto border-4 border-gray-200 border-t-[#1877F2] rounded-full animate-spin"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default FacebookCallback;
