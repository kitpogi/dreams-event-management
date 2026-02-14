const StepIndicator = ({ currentStep, theme, isSidebar = false }) => {
  const steps = [
    {
      number: 1,
      title: isSidebar ? 'Vision' : 'Step 1: Your Vision',
      description: 'Share your event dreams and ideas.',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      number: 2,
      title: isSidebar ? 'Packages' : 'Step 2: Packages',
      description: "Discover tailored package matches.",
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      number: 3,
      title: isSidebar ? 'Booking' : 'Step 3: Booking',
      description: "Finalize and book with ease.",
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  if (isSidebar) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-6 shadow-xl">
        <h2 className="text-white font-bold text-sm uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
          Planning Progress
        </h2>
        <div className="flex flex-col gap-6">
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div
                key={step.number}
                className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'translate-x-1' : 'opacity-60'}`}
              >
                <div
                  className={`relative rounded-xl w-10 min-w-[40px] h-10 flex items-center justify-center transition-all duration-500 border ${isActive
                    ? `bg-gradient-to-r ${theme.primary} shadow-[0_0_15px_rgba(90,69,242,0.4)] border-white/20`
                    : isCompleted
                      ? 'bg-green-500 border-white/20 shadow-lg'
                      : 'bg-white/5 border-white/10'
                    }`}
                >
                  <div className={isActive || isCompleted ? 'text-white' : 'text-gray-400'}>
                    <span className="text-xs font-bold">{step.number}</span>
                  </div>
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border border-white/20 z-10">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className={`text-sm font-bold truncate transition-colors duration-300 ${isActive ? 'text-[#7ee5ff]' : 'text-white'}`}>
                    {step.title}
                  </span>
                  {isActive && (
                    <span className="text-[10px] text-gray-500 italic animate-pulse">Current Step</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 relative z-10">
      <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight transition-colors duration-300">
        How to get started
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <div
              key={step.number}
              className={`text-center transition-all duration-500 transform ${isActive ? 'scale-105' : 'scale-100'} ${currentStep >= step.number ? 'opacity-100' : 'opacity-40'}`}
            >
              <div
                className={`rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-all duration-500 border ${isActive
                  ? `bg-gradient-to-r ${theme.primary} shadow-[0_0_20px_rgba(90,69,242,0.4)] border-white/20 scale-110`
                  : isCompleted
                    ? 'bg-green-500 border-white/20 shadow-lg'
                    : 'bg-white/5 border-white/10'
                  }`}
              >
                <div className={isActive || isCompleted ? 'text-white' : 'text-gray-400'}>
                  {step.icon}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-tight transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed font-medium transition-colors duration-300">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;

