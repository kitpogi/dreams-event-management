import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AnimatedBackground } from '../../components/features';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;
  const formRef = useRef(null);

  // Clear form when component mounts
  useEffect(() => {
    // Always clear form on mount
    setFormData({
      email: '',
      password: '',
    });
    setError('');
    setShowPassword(false);
    
    // Reset the form element if it exists
    if (formRef.current) {
      formRef.current.reset();
    }
  }, []); // Only run on mount

  // Clear form when user becomes unauthenticated (after logout)
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      setFormData({
        email: '',
        password: '',
      });
      setError('');
      setShowPassword(false);
      
      // Reset the form element
      if (formRef.current) {
        formRef.current.reset();
      }
    }
  }, [isAuthenticated, loading]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Clear form before redirecting
      setFormData({
        email: '',
        password: '',
      });
      setError('');
      setShowPassword(false);
      
      // Coordinators and admins go to admin dashboard
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Redirect to the page they came from, or dashboard if no 'from' state
        const redirectTo = from || '/dashboard';
        navigate(redirectTo, { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Clear form immediately after successful login
      setFormData({
        email: '',
        password: '',
      });
      setShowPassword(false);
      setError('');
      
      // Reset the form element
      if (formRef.current) {
        formRef.current.reset();
      }
      
      // Small delay to ensure form clears before redirect
      setTimeout(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        // Coordinators and admins go to admin dashboard
        if (userData.role === 'admin' || userData.role === 'coordinator') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Redirect to the page they came from, or dashboard if no 'from' state
          const redirectTo = from || '/dashboard';
          navigate(redirectTo, { replace: true });
        }
      }, 100);
    } else {
      setError(result.message);
      // Clear password field on error for security
      setFormData(prev => ({
        ...prev,
        password: '',
      }));
      setShowPassword(false);
      
      // Reset password field in form
      if (formRef.current) {
        const passwordInput = formRef.current.querySelector('input[name="password"]');
        if (passwordInput) {
          passwordInput.value = '';
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      {/* Animated Background */}
      <AnimatedBackground 
        type="gradient"
        colors={['#5A45F2', '#7c3aed', '#7ee5ff']}
        speed={0.3}
        direction="diagonal"
        blur={true}
        className="opacity-20 dark:opacity-10"
      />
      <div className="layout-container flex h-full grow flex-col relative z-10">
        <div className="flex flex-1 justify-center items-center p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="layout-content-container flex flex-row max-w-5xl w-full rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl dark:shadow-2xl transition-all duration-300 hover:shadow-2xl dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Left Panel: Image */}
            <div className="hidden lg:flex flex-1 w-1/2 relative overflow-hidden">
              <div 
                className="w-full h-full bg-center bg-no-repeat bg-cover relative" 
                data-alt="A beautifully decorated event venue with elegant table settings and floral arrangements." 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHcYGuFYsXX_YQOLQzDJp_BxXY58Z0-yPNSVZpQBY-LjP5AssE3dqEjgnR1IRedoHYSpLj-cl_4OOrGaprfoymH_rsVjpfFRLM_E24JmGYDj27fxhW3p1VVPk26F4FNMID5KMx6V570G6JVNbCEU0oRy83B2Ffvnb5P3MspByuOrRKtH4j7ANvGU38o8qces5tlSNR9qqhMZ33jHPkJgtaP0gUQ8o8Y4w2xPZWrSOXwI1PVenVoC4aa11UPhX-edRBlou4qmXxp04g")' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-gray-900/20 dark:to-gray-900/40"></div>
              </div>
            </div>

            {/* Right Panel: Form */}
            <div className="flex flex-col flex-1 w-full lg:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 max-h-[90vh] overflow-y-auto">
              
              {/* Heading */}
              <div className="flex flex-wrap justify-between gap-3 mb-8">
                <div className="flex w-full flex-col gap-2">
                  <h1 className="text-gray-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-tight">Welcome Back</h1>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-normal leading-relaxed">Login to continue managing your events.</p>
                </div>
              </div>

              {/* Segmented Buttons */}
              <div className="flex mb-8">
                <div className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800/60 p-1.5 border border-gray-200 dark:border-gray-700/50">
                  <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-4 bg-white dark:bg-gray-700 shadow-sm dark:shadow-md text-gray-900 dark:text-white text-sm font-semibold leading-normal transition-all duration-200">
                    <span className="truncate">Login</span>
                    <input 
                      checked 
                      readOnly 
                      className="invisible w-0" 
                      name="auth-toggle" 
                      type="radio" 
                      value="Login" 
                    />
                  </label>
                  <Link 
                    to="/register"
                    className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:dark:text-white text-sm font-medium leading-normal transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span className="truncate">Sign Up</span>
                  </Link>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-400 text-sm shadow-sm dark:shadow-md">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              {from && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-700 dark:text-blue-400 text-sm shadow-sm dark:shadow-md">
                  <p className="font-medium">Please log in to continue</p>
                </div>
              )}

              {/* Form Fields */}
              <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5 mb-6" key={isAuthenticated ? 'authenticated' : 'not-authenticated'}>
                <label className="flex flex-col w-full">
                  <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold leading-normal pb-2.5">Email</p>
                  <div className="flex w-full flex-1 items-stretch rounded-xl">
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-base font-normal leading-normal transition-all duration-200 shadow-sm dark:shadow-inner" 
                      placeholder="Enter your email address" 
                      name="email"
                      type="email"
                      autoComplete="off"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
                <label className="flex flex-col w-full">
                  <div className="flex justify-between items-center pb-2.5">
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold leading-normal">Password</p>
                    <Link to="/forgot-password" className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 hover:underline text-sm font-medium transition-colors">Forgot Password?</Link>
                  </div>
                  <div className="flex w-full flex-1 items-stretch rounded-xl relative">
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-gray-900 dark:text-gray-100 focus:outline-0 focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 pr-12 text-base font-normal leading-normal transition-all duration-200 shadow-sm dark:shadow-inner" 
                      placeholder="Enter your password" 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>

                {/* CTA Button */}
                <div className="mt-2 mb-6">
                  <button type="submit" className="flex items-center justify-center w-full h-12 px-6 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white rounded-xl text-base font-bold leading-normal shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 dark:focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                    Login
                  </button>
                </div>
              </form>

              {/* Social Logins */}
              <div className="flex items-center gap-4 mb-6">
                <hr className="flex-grow border-gray-200 dark:border-gray-700/50"/>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">Or continue with</p>
                <hr className="flex-grow border-gray-200 dark:border-gray-700/50"/>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center justify-center flex-1 h-12 px-4 bg-white dark:bg-gray-800/90 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.9999 12.2273C21.9999 11.4545 21.9317 10.7273 21.7953 10H12.2272V14.1818H17.7681C17.5453 15.6045 16.7272 16.8182 15.4544 17.6364V20.2727H19.2317C20.9999 18.6818 21.9999 15.8182 21.9999 12.2273Z" fill="#4285F4"></path>
                    <path d="M12.2272 22C15.0908 22 17.4544 21.0455 19.2317 19.2727L15.4544 17.6364C14.5453 18.2273 13.4544 18.5909 12.2272 18.5909C9.86354 18.5909 7.86354 17.0455 7.18172 14.8636H3.27264V17.5909C5.04536 20.2273 8.36354 22 12.2272 22Z" fill="#34A853"></path>
                    <path d="M7.18182 14.8636C6.95909 14.2273 6.81818 13.5455 6.81818 12.8182C6.81818 12.0909 6.95909 11.4091 7.18182 10.7727V8.04545H3.27273C2.45455 9.63636 2 11.1818 2 12.8182C2 14.4545 2.45455 16 3.27273 17.5909L7.18182 14.8636Z" fill="#FBBC05"></path>
                    <path d="M12.2272 7.04545C13.5908 7.04545 14.7272 7.5 15.4544 8.18182L19.3181 4.31818C17.4544 2.59091 15.0908 1.63636 12.2272 1.63636C8.36354 1.63636 5.04536 3.77273 3.27264 6.40909L7.18172 9.13636C7.86354 6.95455 9.86354 7.04545 12.2272 7.04545Z" fill="#EA4335"></path>
                  </svg>
                </button>
                <button className="flex items-center justify-center flex-1 h-12 px-4 bg-white dark:bg-gray-800/90 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]">
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                  </svg>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700/50 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  By continuing, you agree to D'Dreams' <a className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 hover:underline font-medium transition-colors" href="#">Terms of Service</a> and <a className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 hover:underline font-medium transition-colors" href="#">Privacy Policy</a>.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
