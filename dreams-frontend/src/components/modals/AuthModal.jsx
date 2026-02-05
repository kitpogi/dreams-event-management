import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const AuthModal = ({ isOpen, onClose, onSuccess, initialMode = 'login' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [hoveredMode, setHoveredMode] = useState(null);
  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: '',
  });
  const [registerFormData, setRegisterFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register, setUser, setToken } = useAuth();

  // Reset form data function
  const resetForms = () => {
    setLoginFormData({
      email: '',
      password: '',
    });
    setRegisterFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
    });
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset forms when modal opens
      resetForms();
    } else {
      document.body.style.overflow = 'unset';
      // Reset forms when modal closes
      resetForms();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset forms when switching between login and register
  useEffect(() => {
    if (isOpen) {
      resetForms();
    }
  }, [mode]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (isOpen) {
      const initGoogleSignIn = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '', // You'll need to add this to .env
            callback: handleGoogleSignIn,
          });
        }
      };

      if (window.google) {
        initGoogleSignIn();
      } else {
        // Wait for Google SDK to load
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.accounts) {
            initGoogleSignIn();
            clearInterval(checkGoogle);
          }
        }, 100);
        return () => clearInterval(checkGoogle);
      }
    }
  }, [isOpen]);

  // Facebook SDK initialization removed - using OAuth redirect flow instead

  const handleGoogleSignIn = async (response) => {
    try {
      setLoading(true);
      setError('');

      const result = await api.post('/auth/google', {
        id_token: response.credential,
      });

      // Backend wraps response in a 'data' property
      const responseData = result.data.data || result.data;

      if (responseData.access_token || responseData.token) {
        const token = responseData.access_token || responseData.token;
        const refreshToken = responseData.refresh_token;
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(responseData.user));

        // Update auth context
        if (login && typeof login === 'function') {
          // Refresh auth state
          resetForms();
          window.location.reload();
        } else {
          // Fallback: manually update auth state
          setUser(responseData.user);
          setToken(token);
          resetForms();
          onClose();
          if (onSuccess) onSuccess();
          toast.success('Successfully signed in with Google!');
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.response?.data?.message || 'Failed to sign in with Google');
      toast.error(error.response?.data?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (!window.google || !window.google.accounts) {
      setError('Google Sign-In is loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError('');

    // Use Google OAuth2 flow
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      scope: 'email profile',
      callback: async (response) => {
        if (response.access_token) {
          try {
            // Get user info with access token
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` }
            });
            const userInfo = await userInfoResponse.json();

            // Send to backend - use email/name directly since we're using access token flow
            const result = await api.post('/auth/google', {
              email: userInfo.email,
              name: userInfo.name,
            });

            // Backend wraps response in a 'data' property
            const responseData = result.data.data || result.data;

            if (responseData.access_token || responseData.token) {
              const token = responseData.access_token || responseData.token;
              const refreshToken = responseData.refresh_token;
              localStorage.setItem('token', token);
              if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
              }
              localStorage.setItem('user', JSON.stringify(responseData.user));
              setToken(token);
              setUser(responseData.user);
              resetForms();
              onClose();
              if (onSuccess) onSuccess();
              toast.success('Successfully signed in with Google!');
            }
          } catch (error) {
            console.error('Google sign-in error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to sign in with Google';
            setError(errorMessage);
            toast.error(errorMessage);
          } finally {
            setLoading(false);
          }
        }
      }
    });

    client.requestAccessToken();
  };

  const handleFacebookLogin = () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

    // Check if App ID is configured
    if (!appId || appId === 'undefined' || appId === 'YOUR_FACEBOOK_APP_ID') {
      setError('Facebook App ID is not configured. Please check your .env file.');
      toast.error('Facebook login is not configured.');
      return;
    }

    setLoading(true);
    setError('');

    // Use OAuth redirect flow instead of popup (works on HTTP)
    const redirectUri = window.location.origin + '/auth/facebook/callback';
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const scope = 'email,public_profile';

    // Debug: Log the redirect URI being sent
    console.log('Facebook OAuth - Redirect URI:', redirectUri);
    console.log('Facebook OAuth - Encoded Redirect URI:', encodedRedirectUri);
    console.log('Facebook OAuth - Full OAuth URL:', `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&response_type=code`);

    // Store the return URL for after login
    sessionStorage.setItem('fb_auth_redirect', window.location.pathname);

    // Redirect to Facebook OAuth
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&response_type=code`;
  };

  const handleLoginChange = (e) => {
    setLoginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterFormData({
      ...registerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(loginFormData.email, loginFormData.password);

    if (result.success) {
      resetForms();
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(result.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (registerFormData.password !== registerFormData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    const result = await register({
      name: registerFormData.name,
      email: registerFormData.email,
      password: registerFormData.password,
      password_confirmation: registerFormData.password_confirmation,
      phone: registerFormData.phone
    });

    if (result.success) {
      resetForms();
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-description"
    >
      <div
        className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl dark:shadow-2xl w-full max-w-3xl transform transition-all my-8 border border-gray-200 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="flex flex-row max-w-3xl w-full overflow-hidden rounded-2xl">
          {/* Left Panel: Image */}
          <div className="hidden md:flex flex-1 w-1/2">
            <div
              className="w-full bg-center bg-no-repeat bg-cover aspect-auto"
              data-alt="A beautifully decorated event venue with elegant table settings and floral arrangements."
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHcYGuFYsXX_YQOLQzDJp_BxXY58Z0-yPNSVZpQBY-LjP5AssE3dqEjgnR1IRedoHYSpLj-cl_4OOrGaprfoymH_rsVjpfFRLM_E24JmGYDj27fxhW3p1VVPk26F4FNMID5KMx6V570G6JVNbCEU0oRy83B2Ffvnb5P3MspByuOrRKtH4j7ANvGU38o8qces5tlSNR9qqhMZ33jHPkJgtaP0gUQ8o8Y4w2xPZWrSOXwI1PVenVoC4aa11UPhX-edRBlou4qmXxp04g")' }}
            ></div>
          </div>

          {/* Right Panel: Form */}
          <div className="flex flex-col flex-1 w-full md:w-1/2 p-5 sm:p-6 relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 z-10 group"
              aria-label="Close modal"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Heading */}
            <div className="flex flex-wrap justify-between gap-1 mb-4">
              <div className="flex w-full flex-col gap-1">
                <h2 id="auth-modal-title" className="text-gray-900 dark:text-white text-2xl font-black leading-tight tracking-[-0.033em]">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p id="auth-modal-description" className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                  {mode === 'login'
                    ? 'Login to continue managing your events.'
                    : 'Sign up to start planning your dream event.'}
                </p>
              </div>
            </div>

            {/* Segmented Buttons */}
            <div className="flex mb-4">
              <div className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800/80 p-1 border border-gray-200 dark:border-gray-700/50">
                <button
                  onMouseEnter={() => setHoveredMode('login')}
                  onMouseLeave={() => setHoveredMode(null)}
                  onClick={() => setMode('login')}
                  className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-bold leading-normal transition-all duration-300 transform active:scale-95 ${(hoveredMode === 'login') || (mode === 'login' && !hoveredMode)
                      ? 'bg-white dark:bg-gradient-to-r dark:from-[#5A45F2] dark:to-[#7c3aed] shadow-md text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <span className="truncate">Login</span>
                </button>
                <button
                  onMouseEnter={() => setHoveredMode('register')}
                  onMouseLeave={() => setHoveredMode(null)}
                  onClick={() => setMode('register')}
                  className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-bold leading-normal transition-all duration-300 transform active:scale-95 ${(hoveredMode === 'register') || (mode === 'register' && !hoveredMode)
                      ? 'bg-white dark:bg-gradient-to-r dark:from-[#5A45F2] dark:to-[#7c3aed] shadow-md text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <span className="truncate">Sign Up</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-md text-red-700 dark:text-red-400 text-sm"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                {error}
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3 mb-3">
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-xs font-medium leading-normal pb-1">Email</p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 focus:border-primary dark:focus:border-primary h-10 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-3 text-sm font-normal leading-normal transition-all"
                      placeholder="Enter your email address"
                      name="email"
                      value={loginFormData.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                </label>
                <label className="flex flex-col w-full">
                  <div className="flex justify-between items-center pb-1">
                    <p className="text-gray-900 dark:text-gray-200 text-xs font-medium leading-normal">Password</p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/forgot-password');
                      }}
                      className="text-primary hover:underline text-xs font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="flex w-full flex-1 items-stretch rounded-lg relative">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 focus:border-primary dark:focus:border-primary h-10 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-3 pr-10 text-sm font-normal leading-normal transition-all"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={loginFormData.password}
                      onChange={handleLoginChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {/* CTA Button */}
                <div className="mt-2 mb-3">
                  <button type="submit" className="flex items-center justify-center w-full h-10 px-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-lg text-sm font-bold leading-normal shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 dark:focus:ring-offset-[#0f172a] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                    Login
                  </button>
                </div>
              </form>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-2 mb-2">
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col">
                    <p className="text-gray-900 dark:text-gray-200 text-xs font-medium leading-normal pb-1">Full Name</p>
                    <input
                      className="form-input w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 focus:border-primary dark:focus:border-primary h-9 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-3 text-sm transition-all"
                      placeholder="Your full name"
                      name="name"
                      value={registerFormData.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </label>
                  <label className="flex flex-col">
                    <p className="text-gray-900 dark:text-gray-200 text-xs font-medium leading-normal pb-1">Email</p>
                    <input
                      className="form-input w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 focus:border-primary dark:focus:border-primary h-9 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-3 text-sm transition-all"
                      placeholder="your@email.com"
                      name="email"
                      type="email"
                      value={registerFormData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </label>
                </div>

                {/* Row 2: Phone and Password */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col">
                    <p className="text-gray-900 dark:text-gray-200 text-xs font-medium leading-normal pb-1">Phone</p>
                    <input
                      className="form-input w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 focus:border-primary dark:focus:border-primary h-9 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-3 text-sm transition-all"
                      placeholder="Phone number"
                      name="phone"
                      type="tel"
                      value={registerFormData.phone}
                      onChange={handleRegisterChange}
                    />
                  </label>
                  <label className="flex flex-col">
                    <p className="text-gray-900 dark:text-gray-200 text-xs font-medium leading-normal pb-1">Password</p>
                    <div className="relative">
                      <input
                        className="form-input w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 focus:border-primary dark:focus:border-primary h-9 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-3 pr-9 text-sm transition-all"
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={registerFormData.password}
                        onChange={handleRegisterChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>
                </div>

                {/* Row 3: Confirm Password (full width) */}
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-xs font-medium leading-normal pb-1">Confirm Password</p>
                  <div className="relative">
                    <input
                      className="form-input w-full rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 focus:border-primary dark:focus:border-primary h-9 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-3 pr-9 text-sm transition-all"
                      placeholder="Confirm your password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirmation"
                      value={registerFormData.password_confirmation}
                      onChange={handleRegisterChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {/* CTA Button */}
                <div className="mt-1 mb-2">
                  <button type="submit" className="flex items-center justify-center w-full h-10 px-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-lg text-sm font-bold leading-normal shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 dark:focus:ring-offset-[#0f172a] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {/* Social Logins */}
            <div className="flex items-center gap-2 mb-3">
              <hr className="flex-grow border-gray-200 dark:border-gray-700" />
              <p className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">Or continue with</p>
              <hr className="flex-grow border-gray-200 dark:border-gray-700" />
            </div>

            <div className="flex flex-row gap-3">
              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleClick}
                disabled={loading}
                className="group flex items-center justify-center flex-1 h-10 px-4 gap-2 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-[#0f172a] shadow-sm hover:shadow-md"
                aria-label="Sign in with Google"
              >
                <svg className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-200" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.9999 12.2273C21.9999 11.4545 21.9317 10.7273 21.7953 10H12.2272V14.1818H17.7681C17.5453 15.6045 16.7272 16.8182 15.4544 17.6364V20.2727H19.2317C20.9999 18.6818 21.9999 15.8182 21.9999 12.2273Z" fill="#4285F4"></path>
                  <path d="M12.2272 22C15.0908 22 17.4544 21.0455 19.2317 19.2727L15.4544 17.6364C14.5453 18.2273 13.4544 18.5909 12.2272 18.5909C9.86354 18.5909 7.86354 17.0455 7.18172 14.8636H3.27264V17.5909C5.04536 20.2273 8.36354 22 12.2272 22Z" fill="#34A853"></path>
                  <path d="M7.18182 14.8636C6.95909 14.2273 6.81818 13.5455 6.81818 12.8182C6.81818 12.0909 6.95909 11.4091 7.18182 10.7727V8.04545H3.27273C2.45455 9.63636 2 11.1818 2 12.8182C2 14.4545 2.45455 16 3.27273 17.5909L7.18182 14.8636Z" fill="#FBBC05"></path>
                  <path d="M12.2272 7.04545C13.5908 7.04545 14.7272 7.5 15.4544 8.18182L19.3181 4.31818C17.4544 2.59091 15.0908 1.63636 12.2272 1.63636C8.36354 1.63636 5.04536 3.77273 3.27264 6.40909L7.18172 9.13636C7.86354 6.95455 9.86354 7.04545 12.2272 7.04545Z" fill="#EA4335"></path>
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Google</span>
              </button>

              {/* Facebook Login Button */}
              <button
                onClick={handleFacebookLogin}
                disabled={loading}
                className="group flex items-center justify-center flex-1 h-10 px-4 gap-2 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-[#0f172a] shadow-sm hover:shadow-md"
                aria-label="Sign in with Facebook"
              >
                <svg className="w-5 h-5 flex-shrink-0 text-[#1877F2] transition-transform group-hover:scale-110 duration-200" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Facebook</span>
              </button>
            </div>

            <div className="mt-auto pt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By continuing, you agree to D'Dreams' <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

