import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CheckoutHeader } from '../components/layout/CheckoutHeader';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import { formatCEP, formatPhone } from '../utils/formatters';

interface BillingData {
  // Personal info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Address
  country: string;
  address: string;
  number: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  state: string;
  reference?: string;
  
  // Account options
  createAccount: boolean;
  orderNotes?: string;
}

interface ShippingData {
  method: string;
  cost: number;
  estimatedDays: string;
}

export const CheckoutBilling: React.FC = () => {
  const navigate = useNavigate();
  const { items, calculateOrderSummary } = useCartStore();
  const { user, isAuthenticated } = useAuth();
  
  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items.length, navigate]);

  const [billingData, setBillingData] = useState<BillingData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '', 
    email: user?.email || '',
    phone: user?.phone || '',
    country: 'Brasil',
    address: '',
    number: '',
    neighborhood: '',
    zipCode: '',
    city: '',
    state: '',
    reference: '',
    createAccount: !isAuthenticated,
    orderNotes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'boleto'>('pix');
  const [shippingData, setShippingData] = useState<ShippingData>({
    method: '',
    cost: 0,
    estimatedDays: ''
  });
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const orderSummary = calculateOrderSummary();

  const handleInputChange = (field: keyof BillingData, value: string | boolean) => {
    setBillingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateShipping = async () => {
    if (!billingData.zipCode || billingData.zipCode.length < 8) {
      alert('Por favor, informe um CEP válido para calcular o frete');
      return;
    }

    setCalculatingShipping(true);
    
    // Simulate shipping calculation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock shipping options - in real app, you'd call a shipping API
    setShippingData({
      method: 'Correios - PAC',
      cost: 15.90,
      estimatedDays: '5-7 dias úteis'
    });
    
    setCalculatingShipping(false);
  };

  const handleContinueToPayment = () => {
    // Validate required fields
    const requiredFields: (keyof BillingData)[] = [
      'firstName', 'lastName', 'email', 'phone',
      'address', 'number', 'neighborhood', 'zipCode', 'city', 'state'
    ];

    const missingFields = requiredFields.filter(field => !billingData[field]);
    
    if (missingFields.length > 0) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!shippingData.method) {
      alert('Por favor, calcule o frete antes de continuar');
      return;
    }

    // Store billing and shipping data for next page
    sessionStorage.setItem('checkoutBillingData', JSON.stringify(billingData));
    sessionStorage.setItem('checkoutShippingData', JSON.stringify(shippingData));
    sessionStorage.setItem('checkoutPaymentMethod', paymentMethod);
    
    // Navigate to payment page
    navigate('/checkout/payment');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const totalWithShipping = orderSummary.total + shippingData.cost;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <CheckoutHeader currentStep={1} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Billing Form */}
          <div className="lg:col-span-8">
            {/* Billing & Delivery Information */}
            <div className="bg-white border border-gray-300 p-6 mb-6" style={{ borderRadius: '0px' }}>
              <h2 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 uppercase">
                FATURAMENTO & ENTREGA
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Nome *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={billingData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder=""
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Sobrenome *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={billingData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder=""
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    País *
                  </label>
                  <select
                    value={billingData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                  >
                    <option value="Brasil">Brasil</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Endereço *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={billingData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder=""
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Número *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={billingData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder=""
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Bairro *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={billingData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder=""
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    CEP *
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 border border-gray-300 text-sm"
                      style={{ borderRadius: '0px', height: '40px' }}
                      value={formatCEP(billingData.zipCode)}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder=""
                      maxLength={9}
                      required
                    />
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 text-sm bg-white hover:bg-gray-50"
                      style={{ borderRadius: '0px', height: '40px' }}
                      onClick={calculateShipping}
                      disabled={calculatingShipping || billingData.zipCode.length < 8}
                    >
                      {calculatingShipping ? 'Calculando...' : 'Calcular Frete'}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Estado *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={billingData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder=""
                    maxLength={2}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Cidade *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={billingData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder=""
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Celular
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={formatPhone(billingData.phone)}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Ponto de referência
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    value={billingData.reference || ''}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-normal text-gray-800 mb-1">
                    Endereço de e-mail *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 text-sm"
                    style={{ borderRadius: '0px', height: '40px' }}
                    type="email"
                    value={billingData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder=""
                    required
                  />
                </div>

                {!isAuthenticated && (
                  <div className="md:col-span-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={billingData.createAccount}
                        onChange={(e) => handleInputChange('createAccount', e.target.checked)}
                        className="mr-2"
                      />
                      Criar uma conta?
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white border border-gray-300 p-6" style={{ borderRadius: '0px' }}>
              <h2 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 uppercase">
                INFORMAÇÃO ADICIONAL
              </h2>
              
              <div>
                <label className="block text-sm font-normal text-gray-800 mb-1">
                  Notas do pedido (opcional)
                </label>
                <textarea
                  value={billingData.orderNotes || ''}
                  onChange={(e) => handleInputChange('orderNotes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 text-sm"
                  style={{ borderRadius: '0px' }}
                  placeholder="Notas sobre seu pedido, por exemplo, informações especiais sobre entrega."
                />
              </div>
              
              {/* Payment Method Selection */}
              <div className="mt-8">
                <h3 className="text-sm font-normal text-gray-800 mb-4">
                  Como você prefere pagar?
                </h3>
              
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pix"
                    checked={paymentMethod === 'pix'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'pix' | 'credit' | 'boleto')}
                    className="mr-3"
                  />
                  <Smartphone className="h-4 w-4 text-teal-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Pix</div>
                    <div className="text-xs text-gray-600">Aprovação imediata</div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit"
                    checked={paymentMethod === 'credit'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'pix' | 'credit' | 'boleto')}
                    className="mr-3"
                  />
                  <CreditCard className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Novo cartão de crédito</div>
                    <div className="text-xs text-gray-600">Até 10x sem juros</div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="boleto"
                    checked={paymentMethod === 'boleto'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'pix' | 'credit' | 'boleto')}
                    className="mr-3"
                  />
                  <FileText className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Boleto</div>
                    <div className="text-xs text-gray-600">Será aprovado em 1 ou 2 dias úteis</div>
                  </div>
                </label>
              </div>
              
              {/* Terms acceptance */}
              <div className="mt-6 text-xs text-gray-600">
                <p>
                  Os seus dados pessoais serão utilizados para processar a sua compra, apoiar a sua experiência em
                  todo este <span className="text-blue-600">site</span> e para outros fins descritos na nossa <span className="text-blue-600 underline">política de privacidade</span>.
                </p>
              </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-300 p-6 sticky top-24" style={{ borderRadius: '0px' }}>
              <h2 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 uppercase">
                SEU PEDIDO
              </h2>
              
              {/* Products */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.image || '/placeholder-product.jpg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Order Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(orderSummary.subtotal)}</span>
                </div>
                
                {shippingData.method ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Entrega ({shippingData.method})
                      <br />
                      <span className="text-xs text-gray-500">{shippingData.estimatedDays}</span>
                    </span>
                    <span className="text-gray-900">{formatPrice(shippingData.cost)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frete</span>
                    <span className="text-gray-500">Calcular CEP</span>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(totalWithShipping)}</span>
                </div>
              </div>
              
              <button
                onClick={handleContinueToPayment}
                className="w-full mt-6 bg-teal-500 hover:bg-teal-600 text-white py-3 px-6 text-sm font-medium uppercase"
                style={{ borderRadius: '0px' }}
              >
                CONTINUAR PARA PAGAMENTO
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};