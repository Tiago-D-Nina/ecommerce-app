import { useState } from 'react';
import { Button } from './Button';
import { Mail, Loader2, Clock } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { ErrorHandler } from '../../services/errorHandler';

interface EmailConfirmationAlertProps {
  email: string;
  onDismiss?: () => void;
}

export function EmailConfirmationAlert({ email, onDismiss }: EmailConfirmationAlertProps) {
  const [isResending, setIsResending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(() => {
    const stored = localStorage.getItem(`email_confirmation_sent_${email}`);
    return stored ? parseInt(stored, 10) : null;
  });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const RATE_LIMIT_MINUTES = 2; // 2 minutos entre reenvios
  const RATE_LIMIT_MS = RATE_LIMIT_MINUTES * 60 * 1000;

  const canResend = () => {
    if (!lastSentAt) return true;
    return Date.now() - lastSentAt >= RATE_LIMIT_MS;
  };

  const getTimeUntilNextResend = () => {
    if (!lastSentAt || canResend()) return 0;
    const timeLeft = RATE_LIMIT_MS - (Date.now() - lastSentAt);
    return Math.ceil(timeLeft / 1000);
  };

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleResend = async () => {
    if (!canResend() || isResending) return;

    try {
      setIsResending(true);
      setMessage(null);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;

      const now = Date.now();
      setLastSentAt(now);
      localStorage.setItem(`email_confirmation_sent_${email}`, now.toString());

      setMessage(`Novo link de confirmação enviado para ${email}`);
      setMessageType('success');

      // Remove a mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setMessage(null);
      }, 5000);

    } catch (error) {
      const errorMessage = ErrorHandler.handle(error);
      setMessage(errorMessage.message);
      setMessageType('error');
    } finally {
      setIsResending(false);
    }
  };

  const timeLeft = getTimeUntilNextResend();

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4" data-testid="email-confirmation-alert">
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 mb-1">
            E-mail não confirmado
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            Você precisa confirmar seu e-mail antes de fazer login. 
            Verifique sua caixa de entrada e pasta de spam.
          </p>

          {message && (
            <div className={`p-2 mb-3 rounded text-sm ${
              messageType === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleResend}
              disabled={!canResend() || isResending}
              size="sm"
              variant="outline"
              className="text-amber-700 border-amber-300 hover:bg-amber-100 disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : canResend() ? (
                'Reenviar confirmação'
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Aguarde {formatTimeLeft(timeLeft)}
                </>
              )}
            </Button>

            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
              >
                Dispensar
              </Button>
            )}
          </div>

          {!canResend() && !isResending && (
            <p className="text-xs text-amber-600 mt-2">
              Para evitar spam, você pode reenviar o e-mail apenas a cada {RATE_LIMIT_MINUTES} minutos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}