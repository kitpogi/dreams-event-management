import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      toast.success('If that email address exists in our system, we will send a password reset link.');
    } catch (error) {
      let message = 'Failed to send password reset email. Please try again.';
      
      if (error.response?.status === 422) {
        // Validation errors
        const errors = error.response.data?.errors;
        if (errors) {
          const firstError = Object.values(errors)[0];
          message = Array.isArray(firstError) ? firstError[0] : firstError;
        } else {
          message = error.response.data?.message || message;
        }
      } else {
        message = error.response?.data?.message || message;
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center items-center p-4 sm:p-6 md:p-8">
          <div className="layout-content-container flex flex-row max-w-2xl w-full bg-white dark:bg-black/20 shadow-xl rounded-xl overflow-hidden">
            
            {/* Left Panel: Image */}
            <div className="hidden md:flex flex-1 w-1/2">
              <div 
                className="w-full bg-center bg-no-repeat bg-cover aspect-auto" 
                data-alt="A beautifully decorated event venue with elegant table settings and floral arrangements." 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHcYGuFYsXX_YQOLQzDJp_BxXY58Z0-yPNSVZpQBY-LjP5AssE3dqEjgnR1IRedoHYSpLj-cl_4OOrGaprfoymH_rsVjpfFRLM_E24JmGYDj27fxhW3p1VVPk26F4FNMID5KMx6V570G6JVNbCEU0oRy83B2Ffvnb5P3MspByuOrRKtH4j7ANvGU38o8qces5tlSNR9qqhMZ33jHPkJgtaP0gUQ8o8Y4w2xPZWrSOXwI1PVenVoC4aa11UPhX-edRBlou4qmXxp04g")' }}
              ></div>
            </div>

            {/* Right Panel: Form */}
            <div className="flex flex-col flex-1 w-full md:w-1/2 p-8 sm:p-12">
              
              {/* Heading */}
              <div className="flex flex-wrap justify-between gap-3 mb-6">
                <div className="flex w-full flex-col gap-2">
                  <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Forgot Password?</p>
                  <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                    {success 
                      ? 'Check your email for password reset instructions.'
                      : 'Enter your email address and we\'ll send you a link to reset your password.'}
                  </p>
                </div>
              </div>

              {success ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                    <p className="font-medium">Password reset link sent!</p>
                    <p className="mt-2">Please check your email inbox and follow the instructions to reset your password.</p>
                  </div>
                  <div className="text-center">
                    <Link 
                      to="/login"
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Form Fields */}
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
                    <label className="flex flex-col w-full">
                      <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">Email</p>
                      <div className="flex w-full flex-1 items-stretch rounded-lg">
                        <input 
                          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#E0D8D0] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal" 
                          placeholder="Enter your email address" 
                          type="email"
                          name="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </label>

                    {/* CTA Button */}
                    <div className="mt-4 mb-6">
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="flex items-center justify-center w-full h-12 px-6 bg-primary text-white rounded-lg text-base font-bold leading-normal shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </div>
                  </form>

                  <div className="text-center">
                    <Link 
                      to="/login"
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Back to Login
                    </Link>
                  </div>
                </>
              )}

              <div className="mt-auto pt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Remember your password? <Link className="text-primary hover:underline" to="/login">Login</Link>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

