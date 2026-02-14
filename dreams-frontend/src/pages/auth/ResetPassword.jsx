import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { AnimatedBackground, ParticlesBackground } from '../../components/features';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      toast.error('Invalid reset link. Please request a new password reset.');
      navigate('/forgot-password');
      return;
    }

    setFormData(prev => ({
      ...prev,
      token,
      email,
    }));
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: formData.email,
        token: formData.token,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      setSuccess(true);
      toast.success('Password has been reset successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      let message = 'Failed to reset password. Please try again.';

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

  if (success) {
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
            <div className="layout-content-container flex flex-row max-w-2xl w-full border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden p-8 sm:p-12">
              <div className="w-full text-center">
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Password Reset Successful!</h1>
                <p className="text-gray-300 mb-6">
                  Your password has been reset successfully. You will be redirected to the login page shortly.
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
                  <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Reset Password</p>
                  <p className="text-gray-300 text-base font-normal leading-normal">
                    Enter your new password below.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
                <label className="flex flex-col w-full">
                  <p className="text-gray-300 text-sm font-semibold leading-normal pb-2.5">New Password</p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg relative">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-600 bg-gray-800/90 focus:border-primary h-12 placeholder:text-gray-500 px-4 pr-12 text-base font-normal leading-normal shadow-inner"
                      placeholder="Enter your new password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 8 characters long</p>
                </label>

                <label className="flex flex-col w-full">
                  <p className="text-gray-300 text-sm font-semibold leading-normal pb-2.5">Confirm New Password</p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg relative">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-600 bg-gray-800/90 focus:border-primary h-12 placeholder:text-gray-500 px-4 pr-12 text-base font-normal leading-normal shadow-inner"
                      placeholder="Confirm your new password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                      minLength={8}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                    >
                      {showConfirmPassword ? (
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
                <div className="mt-4 mb-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full h-12 px-6 bg-primary text-white rounded-xl text-base font-bold leading-normal shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
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

export default ResetPassword;

