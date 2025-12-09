import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Coordinators and admins go to admin dashboard
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      phone: formData.phone
    });
    
    if (result.success) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      // Coordinators and admins go to admin dashboard
      if (userData.role === 'admin' || userData.role === 'coordinator') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center items-center p-4 sm:p-6 md:p-8">
          <div className="layout-content-container flex flex-row max-w-6xl w-full bg-white dark:bg-black/20 shadow-xl rounded-xl overflow-hidden">
            
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
                  <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Create Account</p>
                  <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Sign up to start planning your dream event.</p>
                </div>
              </div>

              {/* Segmented Buttons */}
              <div className="flex mb-6">
                <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                  <Link 
                    to="/login"
                    className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 hover:dark:text-white text-sm font-medium leading-normal transition-all"
                  >
                    <span className="truncate">Login</span>
                  </Link>
                  <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 bg-white dark:bg-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-gray-900 dark:text-white text-sm font-medium leading-normal transition-all">
                    <span className="truncate">Sign Up</span>
                    <input 
                      checked 
                      readOnly 
                      className="invisible w-0" 
                      name="auth-toggle" 
                      type="radio" 
                      value="Sign Up" 
                    />
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
                
                {/* Name */}
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">Full Name</p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg">
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#E0D8D0] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal" 
                      placeholder="Enter your full name" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>

                {/* Email */}
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">Email</p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg">
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#E0D8D0] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal" 
                      placeholder="Enter your email address" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
                
                 {/* Phone */}
                 <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">Phone Number</p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg">
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#E0D8D0] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 text-base font-normal leading-normal" 
                      placeholder="Enter your phone number" 
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </label>

                {/* Password */}
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">Password</p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg relative">
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#E0D8D0] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 pr-12 text-base font-normal leading-normal" 
                      placeholder="Create a password" 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
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
                </label>

                 {/* Confirm Password */}
                 <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">Confirm Password</p>
                  <div className="flex w-full flex-1 items-stretch rounded-lg relative">
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#E0D8D0] dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 pr-12 text-base font-normal leading-normal" 
                      placeholder="Confirm your password" 
                      type={showConfirmPassword ? "text" : "password"} 
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
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
                  <button type="submit" className="flex items-center justify-center w-full h-12 px-6 bg-primary text-white rounded-lg text-base font-bold leading-normal shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition-colors">
                    Create Account
                  </button>
                </div>
              </form>

              {/* Social Logins */}
              <div className="flex items-center gap-4 mb-6">
                <hr className="flex-grow border-gray-200 dark:border-gray-700"/>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Or continue with</p>
                <hr className="flex-grow border-gray-200 dark:border-gray-700"/>
              </div>

              <div className="flex gap-4">
                <button className="flex items-center justify-center flex-1 h-12 px-4 bg-white dark:bg-gray-800 border border-[#E0D8D0] dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.9999 12.2273C21.9999 11.4545 21.9317 10.7273 21.7953 10H12.2272V14.1818H17.7681C17.5453 15.6045 16.7272 16.8182 15.4544 17.6364V20.2727H19.2317C20.9999 18.6818 21.9999 15.8182 21.9999 12.2273Z" fill="#4285F4"></path>
                    <path d="M12.2272 22C15.0908 22 17.4544 21.0455 19.2317 19.2727L15.4544 17.6364C14.5453 18.2273 13.4544 18.5909 12.2272 18.5909C9.86354 18.5909 7.86354 17.0455 7.18172 14.8636H3.27264V17.5909C5.04536 20.2273 8.36354 22 12.2272 22Z" fill="#34A853"></path>
                    <path d="M7.18182 14.8636C6.95909 14.2273 6.81818 13.5455 6.81818 12.8182C6.81818 12.0909 6.95909 11.4091 7.18182 10.7727V8.04545H3.27273C2.45455 9.63636 2 11.1818 2 12.8182C2 14.4545 2.45455 16 3.27273 17.5909L7.18182 14.8636Z" fill="#FBBC05"></path>
                    <path d="M12.2272 7.04545C13.5908 7.04545 14.7272 7.5 15.4544 8.18182L19.3181 4.31818C17.4544 2.59091 15.0908 1.63636 12.2272 1.63636C8.36354 1.63636 5.04536 3.77273 3.27264 6.40909L7.18172 9.13636C7.86354 6.95455 9.86354 7.04545 12.2272 7.04545Z" fill="#EA4335"></path>
                  </svg>
                </button>
                <button className="flex items-center justify-center flex-1 h-12 px-4 bg-white dark:bg-gray-800 border border-[#E0D8D0] dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                  </svg>
                </button>
              </div>

              <div className="mt-auto pt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By continuing, you agree to D'Dreams' <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
