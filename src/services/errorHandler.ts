import { AuthError } from '@supabase/supabase-js';

export interface ErrorMessage {
  title: string;
  message: string;
  type?: 'error' | 'email_not_confirmed';
  email?: string;
}

export class ErrorHandler {
  private static errorTranslations: Record<string, ErrorMessage> = {
    'Invalid login credentials': {
      title: 'Erro de Login',
      message: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.'
    },
    'Email not confirmed': {
      title: 'E-mail não confirmado',
      message: 'Você precisa confirmar seu e-mail antes de fazer login. Verifique sua caixa de entrada.',
      type: 'email_not_confirmed'
    },
    'User already registered': {
      title: 'Usuário já cadastrado',
      message: 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.'
    },
    'Password should be at least 6 characters': {
      title: 'Senha muito curta',
      message: 'A senha deve ter pelo menos 6 caracteres.'
    },
    'Invalid email': {
      title: 'E-mail inválido',
      message: 'Por favor, digite um e-mail válido.'
    },
    'Signup requires a valid password': {
      title: 'Senha obrigatória',
      message: 'Por favor, digite uma senha válida para continuar.'
    },
    'Unable to validate email address: invalid format': {
      title: 'Formato de e-mail inválido',
      message: 'O formato do e-mail digitado não é válido. Verifique e tente novamente.'
    },
    'Email rate limit exceeded': {
      title: 'Muitas tentativas',
      message: 'Muitas tentativas de envio de e-mail. Aguarde alguns minutos antes de tentar novamente.'
    },
    'Token has expired or is invalid': {
      title: 'Link expirado',
      message: 'Este link de confirmação expirou ou é inválido. Solicite um novo link.'
    },
    'User not found': {
      title: 'Usuário não encontrado',
      message: 'Não encontramos uma conta com este e-mail. Verifique o e-mail digitado.'
    },
    'Password reset limit exceeded': {
      title: 'Limite de redefinição excedido',
      message: 'Muitas tentativas de redefinir senha. Aguarde antes de tentar novamente.'
    },
    'Network request failed': {
      title: 'Erro de conexão',
      message: 'Verifique sua conexão com a internet e tente novamente.'
    },
    'Database connection lost': {
      title: 'Erro de conexão',
      message: 'Conexão com o servidor perdida. Tente novamente em alguns instantes.'
    }
  };

  static handle(error: unknown, email?: string): ErrorMessage {
    // Se é um erro do Supabase Auth
    if (error instanceof AuthError || (error && typeof error === 'object' && 'message' in error)) {
      const errorMessage = (error as { message: string }).message;
      
      // Procura por traduções exatas
      const translation = this.errorTranslations[errorMessage];
      if (translation) {
        return {
          ...translation,
          email: email || translation.email
        };
      }

      // Procura por traduções parciais
      for (const [key, value] of Object.entries(this.errorTranslations)) {
        if (errorMessage.includes(key) || key.includes(errorMessage)) {
          return {
            ...value,
            email: email || value.email
          };
        }
      }

      // Tratamento para erros específicos do Supabase que podem variar
      if (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('credentials')) {
        return this.errorTranslations['Invalid login credentials'];
      }

      if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('not confirmed')) {
        return {
          ...this.errorTranslations['Email not confirmed'],
          email: email
        };
      }

      if (errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('user exists')) {
        return this.errorTranslations['User already registered'];
      }

      if (errorMessage.toLowerCase().includes('password') && errorMessage.toLowerCase().includes('6 characters')) {
        return this.errorTranslations['Password should be at least 6 characters'];
      }

      // Erro genérico para erros do Supabase não mapeados
      return {
        title: 'Erro no sistema',
        message: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.'
      };
    }

    // Erro genérico para outros tipos de erro
    return {
      title: 'Erro inesperado',
      message: 'Algo deu errado. Tente novamente ou entre em contato com o suporte.'
    };
  }

  static getConfirmationMessage(email: string): ErrorMessage {
    return {
      title: 'Confirmação enviada',
      message: `Um link de confirmação foi enviado para ${email}. Verifique sua caixa de entrada e spam.`
    };
  }

  static getPasswordResetMessage(email: string): ErrorMessage {
    return {
      title: 'E-mail enviado',
      message: `Instruções para redefinir sua senha foram enviadas para ${email}.`
    };
  }

  static getSuccessMessage(action: 'login' | 'register' | 'logout' | 'update'): ErrorMessage {
    const messages = {
      login: {
        title: 'Login realizado',
        message: 'Bem-vindo de volta!'
      },
      register: {
        title: 'Conta criada',
        message: 'Sua conta foi criada com sucesso. Verifique seu e-mail para confirmação.'
      },
      logout: {
        title: 'Logout realizado',
        message: 'Você foi desconectado com sucesso.'
      },
      update: {
        title: 'Perfil atualizado',
        message: 'Suas informações foram atualizadas com sucesso.'
      }
    };

    return messages[action];
  }
}