import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { AnimatedBackground, ParticlesBackground } from '../../components/features';

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
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-[#0a0a1a] font-display text-gray-200">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          <AnimatedBackground type="mesh" colors={['#5A45F2', '#7ee5ff']} speed={0.15} blur={true} />
        </div>
        <ParticlesBackground particleCount={15} particleColor="rgba(126, 229, 255, 0.15)" speed={0.03} interactive={false} />
      </div>
      <div className="layout-container flex h-full grow flex-col relative z-10">
        <div className="flex flex-1 justify-center items-center p-4 sm:p-6 md:p-8">
          <div className="layout-content-container flex flex-row max-w-2xl w-full border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">

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
                  <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Forgot Password?</p>
                  <p className="text-gray-300 text-base font-normal leading-normal">
                    {success
                      ? 'Check your email for password reset instructions.'
                      : 'Enter your email address and we\'ll send you a link to reset your password.'}
                  </p>
                </div>
              </div>

              {success ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-xl text-blue-400 text-sm shadow-md">
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
                      <p className="text-gray-300 text-sm font-semibold leading-normal pb-2.5">Email</p>
                      <div className="flex w-full flex-1 items-stretch rounded-xl">
                        <input
                          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-600 bg-gray-800/90 focus:border-primary h-12 placeholder:text-gray-500 px-4 text-base font-normal leading-normal shadow-inner"
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
                        className="flex items-center justify-center w-full h-12 px-6 bg-primary text-white rounded-xl text-base font-bold leading-normal shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

