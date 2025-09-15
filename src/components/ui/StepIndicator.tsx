import { Check } from 'lucide-react';
import type { CheckoutStep } from '../../types';

interface StepIndicatorProps {
  steps: CheckoutStep[];
}

export const StepIndicator = ({ steps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center w-full py-6" data-testid="step-indicator">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step Circle */}
          <div className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                ${
                  step.isCompleted
                    ? 'bg-[#72C7DA] border-[#72C7DA] text-white'
                    : step.isCurrent
                    ? 'border-[#72C7DA] text-[#72C7DA] bg-white'
                    : 'border-gray-300 text-gray-300 bg-white'
                }
              `}
            >
              {step.isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            {/* Step Label */}
            <div className="ml-3 hidden sm:block">
              <p
                className={`
                  text-sm font-medium
                  ${
                    step.isCurrent || step.isCompleted
                      ? 'text-[#72C7DA]'
                      : 'text-gray-500'
                  }
                `}
              >
                {step.title}
              </p>
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`
                ml-4 sm:ml-6 h-0.5 w-8 sm:w-16 transition-all duration-300
                ${step.isCompleted ? 'bg-[#72C7DA]' : 'bg-gray-300'}
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
};