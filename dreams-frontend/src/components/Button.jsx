const Button = ({ children, className = '', variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-3 rounded-md font-medium transition-colors duration-200';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-secondary text-white hover:bg-indigo-500',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

