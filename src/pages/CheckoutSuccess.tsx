import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Truck, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CheckoutHeader } from '../components/layout/CheckoutHeader';

export const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    // Small delay to ensure sessionStorage is properly set
    const checkAccess = () => {
      const checkoutSuccess = sessionStorage.getItem('checkoutSuccess');
      const orderNum = sessionStorage.getItem('orderNumber');
      
      if (!checkoutSuccess) {
        // If no success flag, redirect to home
        navigate('/', { replace: true });
        return;
      }
      
      // Set order number if available
      if (orderNum) {
        setOrderNumber(orderNum);
      }
      
      // Clear the success flag and order data
      sessionStorage.removeItem('checkoutSuccess');
      sessionStorage.removeItem('orderNumber');
      sessionStorage.removeItem('orderId');
    };

    const timer = setTimeout(checkAccess, 50);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <CheckoutHeader currentStep={3} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pedido Finalizado!</h1>
          <p className="text-lg text-gray-600">Obrigado por sua compra. Seu pedido foi processado com sucesso.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Número do Pedido</h2>
            <div className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 py-3 px-6 rounded-lg inline-block">
              {orderNumber || '#ORD-LOADING...'}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pedido Confirmado</h3>
              <p className="text-sm text-gray-600">
                Recebemos seu pedido e já iniciamos o processo de preparação.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <Truck className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Em Preparação</h3>
              <p className="text-sm text-gray-600">
                Seu pedido será processado e enviado em breve.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acompanhe</h3>
              <p className="text-sm text-gray-600">
                Enviamos um email com os detalhes do seu pedido.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">O que acontece agora?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>Você receberá um email de confirmação com todos os detalhes do pedido</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>Processaremos seu pedido e o prepararemos para envio</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>Quando o pedido for enviado, você receberá o código de rastreamento</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p>Em caso de dúvidas, entre em contato conosco através do suporte</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            style={{ borderRadius: '0px' }}
          >
            CONTINUAR COMPRANDO
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium"
            style={{ borderRadius: '0px' }}
          >
            VER MEUS PEDIDOS
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};