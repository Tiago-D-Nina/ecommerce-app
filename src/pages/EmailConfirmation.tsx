import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Button } from '../components/ui/Button';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ErrorHandler, type ErrorMessage } from '../services/errorHandler';

type ConfirmationStatus = 'loading' | 'success' | 'error' | 'expired';

export default function EmailConfirmation() {
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [message, setMessage] = useState<ErrorMessage>({ title: '', message: '' });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Pega os parâmetros da URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'email') {
          setStatus('error');
          setMessage({
            title: 'Link inválido',
            message: 'Este link de confirmação não é válido ou está malformado.'
          });
          return;
        }

        // Confirma o e-mail usando o token
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) {
          console.error('Email confirmation error:', error);
          
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setStatus('expired');
            setMessage({
              title: 'Link expirado',
              message: 'Este link de confirmação expirou. Você pode solicitar um novo link fazendo login.'
            });
          } else {
            setStatus('error');
            setMessage(ErrorHandler.handle(error));
          }
        } else {
          setStatus('success');
          setMessage({
            title: 'E-mail confirmado!',
            message: 'Seu e-mail foi confirmado com sucesso. Você já pode fazer login.'
          });

          // Redireciona para login após 3 segundos
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setMessage(ErrorHandler.handle(error));
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  const handleResendConfirmation = async () => {
    const email = localStorage.getItem('pendingConfirmationEmail');
    
    if (!email) {
      navigate('/login');
      return;
    }

    try {
      setStatus('loading');
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        setStatus('error');
        setMessage(ErrorHandler.handle(error));
      } else {
        setMessage(ErrorHandler.getConfirmationMessage(email));
        setStatus('success');
      }
    } catch (error) {
      setStatus('error');
      setMessage(ErrorHandler.handle(error));
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Mail className="w-16 h-16 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex flex-col items-center text-center">
            {getStatusIcon()}
            
            <h2 className={`mt-6 text-2xl font-bold ${getStatusColor()}`}>
              {message.title}
            </h2>
            
            <p className="mt-4 text-sm text-gray-600 leading-relaxed">
              {message.message}
            </p>

            <div className="mt-8 space-y-4 w-full">
              {status === 'success' && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    Redirecionando para o login em 3 segundos...
                  </p>
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full"
                  >
                    Ir para Login
                  </Button>
                </div>
              )}

              {(status === 'error' || status === 'expired') && (
                <div className="space-y-3">
                  {status === 'expired' && (
                    <Button
                      onClick={handleResendConfirmation}
                      variant="outline"
                      className="w-full"
                    >
                      Enviar novo link
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full"
                  >
                    Voltar ao Login
                  </Button>
                </div>
              )}

              {status === 'loading' && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Confirmando seu e-mail...
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-sm"
              >
                Voltar ao início
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}