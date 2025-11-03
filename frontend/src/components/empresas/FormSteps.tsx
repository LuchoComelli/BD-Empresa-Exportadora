import { CheckCircle2 } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface FormStepsProps {
  steps: Step[];
  currentStep: number;
}

export function FormSteps({ steps, currentStep }: FormStepsProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-semibold ${
                currentStep >= step.number
                  ? 'bg-[#3259B5] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step.number ? (
                <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" />
              ) : (
                step.number
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-1 md:mx-2 ${
                  currentStep > step.number ? 'bg-[#3259B5]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs md:text-sm text-[#6B7280] px-1">
        {steps.map((step) => (
          <span key={step.number} className="text-center flex-1">
            {step.title}
          </span>
        ))}
      </div>
    </div>
  );
}