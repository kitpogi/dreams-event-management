const StepIndicator = ({ currentStep, theme }) => {
  const steps = [
    {
      number: 1,
      title: 'Step 1: Tell us your vision',
      description: 'Share your event dreams and ideas in our easy form.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Step 2: Discover perfect matches',
      description: "We'll recommend the top packages tailored to your needs.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Step 3: Book with ease',
      description: "Choose your package and we'll contact you as soon as possible.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center transition-colors duration-300">
        How to get started
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <div
              key={step.number}
              className={`text-center ${currentStep >= step.number ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300`}
            >
              <div
                className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${theme.primary} shadow-lg scale-110`
                    : isCompleted
                    ? 'bg-green-500 shadow-md'
                    : theme.stepInactive
                }`}
              >
                <div className={isActive || isCompleted ? 'text-white' : theme.stepText}>
                  {step.icon}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
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

