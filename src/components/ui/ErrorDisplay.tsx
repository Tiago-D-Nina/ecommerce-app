import { EmailConfirmationAlert } from './EmailConfirmationAlert';
import type { ErrorMessage } from '../../services/errorHandler';

interface ErrorDisplayProps {
  error: string | ErrorMessage | null;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  // Se é um objeto ErrorMessage e é do tipo email_not_confirmed
  if (typeof error === 'object' && error.type === 'email_not_confirmed' && error.email) {
    return (
      <EmailConfirmationAlert 
        email={error.email} 
        onDismiss={onDismiss}
      />
    );
  }

  // Para erros normais (string ou objeto ErrorMessage sem tipo especial)
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}