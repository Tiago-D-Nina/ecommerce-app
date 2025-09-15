import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Clock, Copy, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CheckoutHeader } from '../components/layout/CheckoutHeader';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import { formatCPF } from '../utils/formatters';
import { orderService } from '../services/orderService';
import type { OrderData } from '../services/orderService';

interface BillingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  number: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  state: string;
  reference?: string;
  createAccount: boolean;
  orderNotes?: string;
}

interface ShippingData {
  method: string;
  cost: number;
  estimatedDays: string;
}

interface CreditCardData {
  cardNumber: string;
  cardName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cpf: string;
  installments: number;
}

export const CheckoutPayment: React.FC = () => {
  const navigate = useNavigate();
  const { items, calculateOrderSummary, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuth();
  
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [shippingData, setShippingData] = useState<ShippingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'boleto'>('pix');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pixData, setPixData] = useState<{ code: string; qrCode: string } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  
  const [creditCardData, setCreditCardData] = useState<CreditCardData>({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cpf: '',
    installments: 1
  });

  // Load data from previous step
  useEffect(() => {
    const savedBillingData = sessionStorage.getItem('checkoutBillingData');
    const savedShippingData = sessionStorage.getItem('checkoutShippingData');
    const savedPaymentMethod = sessionStorage.getItem('checkoutPaymentMethod');

    if (!savedBillingData || !savedShippingData || items.length === 0) {
      navigate('/checkout');
      return;
    }

    setBillingData(JSON.parse(savedBillingData));
    setShippingData(JSON.parse(savedShippingData));
    setPaymentMethod(savedPaymentMethod as 'pix' | 'credit' | 'boleto' || 'pix');

    // Generate PIX data if PIX is selected
    if (savedPaymentMethod === 'pix') {
      generatePixPayment();
    }
  }, [navigate, items.length]);

  const orderSummary = calculateOrderSummary();
  const totalWithShipping = orderSummary.total + (shippingData?.cost || 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const generatePixPayment = () => {
    // In a real app, you'd call your payment API to generate the PIX
    const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}@pix.example.com5204000053039865802BR5925LOJA EXEMPLO ECOMMERCE6009SAO PAULO62070503***63046B4A`;
    
    setPixData({
      code: mockPixCode,
      qrCode: `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200"><rect width="200" height="200" fill="black"/><rect x="10" y="10" width="20" height="20" fill="white"/></svg>`)}`
    });
  };

  const handleCreditCardChange = (field: keyof CreditCardData, value: string | number) => {
    setCreditCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const copyPixCode = async () => {
    if (pixData) {
      try {
        await navigator.clipboard.writeText(pixData.code);
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 2000);
      } catch {
        console.error('Failed to copy PIX code');
      }
    }
  };

  const handleFinishOrder = async () => {
    if (!billingData || !shippingData || !user) {
      alert('Dados do pedido incompletos. Tente novamente.');
      return;
    }

    setProcessingPayment(true);

    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Preparar dados do pedido
      const orderData: OrderData = {
        user_id: user.id,
        user_name: `${billingData.firstName} ${billingData.lastName}`,
        user_email: billingData.email,
        user_phone: billingData.phone,
        subtotal: orderSummary.subtotal,
        total_amount: totalWithShipping,
        tax_amount: 0,
        shipping_amount: shippingData.cost,
        discount_amount: 0,
        payment_method: paymentMethod,
        payment_status: 'pending', // Será determinado pelo orderService baseado no método
        payment_data: {
          method: paymentMethod,
          ...(paymentMethod === 'credit' && {
            installments: creditCardData.installments,
            card_holder: creditCardData.cardName,
            card_last_four: creditCardData.cardNumber.slice(-4)
          }),
          ...(paymentMethod === 'pix' && {
            pix_code: pixData?.code
          })
        },
        billing_address: {
          firstName: billingData.firstName,
          lastName: billingData.lastName,
          email: billingData.email,
          phone: billingData.phone,
          address: billingData.address,
          number: billingData.number,
          neighborhood: billingData.neighborhood,
          city: billingData.city,
          state: billingData.state,
          zipCode: billingData.zipCode,
          country: billingData.country,
          reference: billingData.reference
        },
        shipping_address: {
          firstName: billingData.firstName,
          lastName: billingData.lastName,
          address: billingData.address,
          number: billingData.number,
          neighborhood: billingData.neighborhood,
          city: billingData.city,
          state: billingData.state,
          zipCode: billingData.zipCode,
          country: billingData.country,
          reference: billingData.reference
        },
        shipping_method: shippingData.method,
        notes: billingData.orderNotes,
        items: items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku || '',
          product_image: item.product.image_url,
          unit_price: item.product.price,
          quantity: item.quantity,
          total_price: item.product.price * item.quantity
        }))
      };

      // Registrar pedido no banco
      const result = await orderService.createOrder(orderData);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao registrar pedido');
      }

      // Salvar dados do pedido para página de sucesso
      sessionStorage.setItem('checkoutSuccess', 'true');
      sessionStorage.setItem('orderNumber', result.order_number || '');
      sessionStorage.setItem('orderId', result.order_id || '');
      
      // Limpar carrinho e dados da sessão
      clearCart();
      sessionStorage.removeItem('checkoutBillingData');
      sessionStorage.removeItem('checkoutShippingData');
      sessionStorage.removeItem('checkoutPaymentMethod');

      // Navegar para página de sucesso
      setTimeout(() => {
        navigate('/checkout/success', { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar pedido. Tente novamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!billingData || !shippingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando dados do pedido...</p>
        </div>
      </div>
    );
  }

  // Generate installment options
  const installmentOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <CheckoutHeader currentStep={2} />
      
      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Payment Forms */}
          <div className="lg:col-span-8">
            {paymentMethod === 'credit' && (
              <div className="bg-white border border-gray-300 p-6" style={{ borderRadius: '0px' }}>
                <h2 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 uppercase">
                  ADICIONE UM NOVO CARTÃO
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número do Cartão *
                    </label>
                    <Input
                      value={formatCardNumber(creditCardData.cardNumber)}
                      onChange={(e) => handleCreditCardChange('cardNumber', e.target.value.replace(/\s/g, ''))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo do Titular *
                    </label>
                    <Input
                      value={creditCardData.cardName}
                      onChange={(e) => handleCreditCardChange('cardName', e.target.value.toUpperCase())}
                      placeholder="NOME COMO ESTÁ NO CARTÃO"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mês *
                      </label>
                      <select
                        value={creditCardData.expiryMonth}
                        onChange={(e) => handleCreditCardChange('expiryMonth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Mês</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <option key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ano *
                      </label>
                      <select
                        value={creditCardData.expiryYear}
                        onChange={(e) => handleCreditCardChange('expiryYear', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Ano</option>
                        {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV *
                      </label>
                      <Input
                        value={creditCardData.cvv}
                        onChange={(e) => handleCreditCardChange('cvv', e.target.value)}
                        placeholder="000"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF do Titular *
                    </label>
                    <Input
                      value={formatCPF(creditCardData.cpf)}
                      onChange={(e) => handleCreditCardChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parcelas
                    </label>
                    <select
                      value={creditCardData.installments}
                      onChange={(e) => handleCreditCardChange('installments', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {installmentOptions.map(installments => {
                        const installmentValue = totalWithShipping / installments;
                        return (
                          <option key={installments} value={installments}>
                            {installments}x de {formatPrice(installmentValue)} 
                            {installments === 1 ? ' à vista' : ' sem juros'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'pix' && pixData && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-6">
                  <Smartphone className="h-5 w-5 text-green-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Pagamento PIX</h2>
                </div>
                
                <div className="text-center space-y-6">
                  <div>
                    <img 
                      src={pixData.qrCode} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 mx-auto border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Escaneie o QR Code com seu banco ou copie o código PIX:
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-xs font-mono break-all text-gray-800 mb-3">
                        {pixData.code}
                      </p>
                      
                      <Button
                        onClick={copyPixCode}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {pixCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Código PIX
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Pagamento aprovado instantaneamente
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'boleto' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-6">
                  <div className="h-5 w-5 bg-orange-600 rounded mr-2"></div>
                  <h2 className="text-xl font-semibold text-gray-900">Boleto Bancário</h2>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-center text-orange-700 mb-2">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className="font-medium">Aprovação em 1-2 dias úteis</span>
                    </div>
                    <p className="text-sm text-orange-600">
                      Após finalizar o pedido, você receberá o boleto por email para pagamento.
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    O pedido será processado após a confirmação do pagamento pelo banco.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-300 p-6 sticky top-24" style={{ borderRadius: '0px' }}>
              <h2 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 uppercase">
                RESUMO DA COMPRA
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
              
              {/* Delivery Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Entrega</h3>
                <p className="text-sm text-gray-600">
                  {billingData.address}, {billingData.number}
                  <br />
                  {billingData.neighborhood} - {billingData.city}/{billingData.state}
                  <br />
                  CEP: {billingData.zipCode}
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  {shippingData.method} - {shippingData.estimatedDays}
                </p>
              </div>
              
              {/* Order Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(orderSummary.subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Entrega</span>
                  <span className="text-gray-900">{formatPrice(shippingData.cost)}</span>
                </div>
                
                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(totalWithShipping)}</span>
                </div>
              </div>
              
              <button
                onClick={handleFinishOrder}
                className="w-full mt-6 bg-teal-500 hover:bg-teal-600 text-white py-3 px-6 text-sm font-medium uppercase"
                style={{ borderRadius: '0px' }}
                disabled={processingPayment}
              >
                {processingPayment ? 'Processando...' : 'FINALIZAR PEDIDO'}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Ao finalizar, você concorda com nossos termos e condições
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};