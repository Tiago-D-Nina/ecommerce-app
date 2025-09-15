import React from 'react';

interface CheckoutHeaderProps {
  currentStep: number;
}

const steps = [
  { number: 1, name: 'Dados de Entrega', path: '/checkout' },
  { number: 2, name: 'Pagamento', path: '/checkout/payment' },
  { number: 3, name: 'Finalizado', path: '/checkout/success' }
];

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({ currentStep }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 mb-8" style={{ backgroundColor: '#1B272C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          {/* Steps Navigation */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  {/* Step Name */}
                  <div className="relative">
                    <span
                      className={`
                        text-sm font-medium px-4 py-2 transition-opacity
                        ${
                          step.number === currentStep
                            ? 'text-white'
                            : 'text-white opacity-30'
                        }
                      `}
                    >
                      {step.name}
                    </span>
                    {/* Underline for active step */}
                    {step.number === currentStep && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: '#72C7DA' }}
                      />
                    )}
                  </div>
                  
                  {/* Arrow Connector */}
                  {index < steps.length - 1 && (
                    <div className="mx-6">
                      <span className="text-white opacity-30">→</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};