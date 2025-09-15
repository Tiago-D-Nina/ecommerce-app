import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { StepIndicator } from '../components/ui/StepIndicator';
import { CheckoutSummary } from '../components/feature/checkout/CheckoutSummary';
import { useCartStore } from '../store/cartStore';
import type { CheckoutStep, CheckoutStepId } from '../types';

const CHECKOUT_STEPS: CheckoutStep[] = [
  {
    id: 'cart',
    title: 'Carrinho de Compras',
    isCompleted: true,
    isCurrent: false,
  },
  {
    id: 'checkout',
    title: 'Checkout',
    isCompleted: false,
    isCurrent: true,
  },
  {
    id: 'payment',
    title: 'Finalizar',
    isCompleted: false,
    isCurrent: false,
  },
];

export const Checkout = () => {
  const navigate = useNavigate();
  const { itemCount, calculateOrderSummary } = useCartStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStepId>('checkout');
  const [steps, setSteps] = useState(CHECKOUT_STEPS);

  // Redirect if cart is empty
  useEffect(() => {
    if (itemCount === 0) {
      navigate('/');
    }
  }, [itemCount, navigate]);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleNextStep = () => {
    if (currentStep === 'checkout') {
      setCurrentStep('payment');
      setSteps(prevSteps =>
        prevSteps.map(step => ({
          ...step,
          isCompleted: step.id === 'checkout' ? true : step.isCompleted,
          isCurrent: step.id === 'payment',
        }))
      );
    } else if (currentStep === 'payment') {
      // Here you would handle the actual payment processing
      alert('Pedido finalizado com sucesso! 🎉');
      navigate('/');
    }
  };

  const orderSummary = calculateOrderSummary();

  if (itemCount === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBackToHome}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar às compras</span>
            </button>
            
            <h1 className="text-xl font-semibold text-gray-900">
              Finalizar Compra
            </h1>
            
            <div className="w-24" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StepIndicator steps={steps} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Checkout Form/Steps */}
          <div className="space-y-6">
            {currentStep === 'checkout' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Informações de Entrega
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Esta é uma demonstração. Em uma implementação real, aqui teriam os campos para:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Endereço de entrega</li>
                    <li>Informações de contato</li>
                    <li>Opções de frete</li>
                    <li>Método de pagamento</li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Button onClick={handleNextStep} className="w-full">
                    Continuar para Pagamento
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Finalizar Pedido
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                    <CreditCard className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        Pronto para finalizar!
                      </p>
                      <p className="text-sm text-green-700">
                        Revise seu pedido e clique em finalizar compra.
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Total:</strong> R$ {orderSummary.total.toFixed(2)}
                    </p>
                    <p>
                      <strong>Itens:</strong> {orderSummary.itemCount}
                    </p>
                    <p>
                      <strong>Entrega:</strong> {orderSummary.shipping.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
                  <Button onClick={handleNextStep} className="w-full">
                    🎉 Finalizar Compra
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('checkout')} 
                    className="w-full"
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <CheckoutSummary />
          </div>
        </div>
      </main>
    </div>
  );
};