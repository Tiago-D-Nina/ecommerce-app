import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Calendar, Save, AlertCircle, CheckCircle2, Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '../../../store/authStore';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

// Schema de validação mais rigoroso baseado no DB schema
const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode ter mais de 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]*$/, 'Nome deve conter apenas letras e espaços'),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(val),
      'Telefone deve estar no formato (XX) XXXXX-XXXX'
    ),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const cpf = val.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        // Validação básica de CPF
        if (/^(\d)\1{10}$/.test(cpf)) return false; // CPFs com todos dígitos iguais
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf[9])) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(cpf[10]);
      },
      'CPF inválido'
    ),
  date_of_birth: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
        return date >= minDate && date <= maxDate;
      },
      'Data de nascimento deve ser válida (idade entre 13 e 120 anos)'
    )
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface AlertProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle
  };

  const Icon = icons[type];

  return (
    <div className={`p-4 rounded-md border ${styles[type]} flex items-start gap-3`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 ml-2"
          aria-label="Fechar alerta"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const ProfileForm: React.FC = () => {
  const { user, updateProfile, isLoading, error, clearError, refreshUserData } = useAuth();
  
  // Debug: Log user changes
  console.log('ProfileForm render - user:', user?.full_name, user?.phone, user?.date_of_birth);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    clearErrors,
    setError,
    setValue,
    getValues
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      cpf: user?.cpf || '',
      date_of_birth: user?.date_of_birth || ''
    }
  });

  useEffect(() => {
    console.log('ProfileForm: user changed', user);
    if (user) {
      // Check if user data is incomplete and refresh if needed
      if (user.email && (!user.phone && !user.date_of_birth)) {
        console.log('ProfileForm: User data seems incomplete, refreshing...');
        refreshUserData();
        return;
      }

      const formData = {
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
        date_of_birth: user.date_of_birth || ''
      };
      console.log('ProfileForm: resetting form with', formData);
      
      // Update each field individually to ensure reactivity
      setValue('full_name', formData.full_name);
      setValue('email', formData.email);  
      setValue('phone', formData.phone);
      setValue('cpf', formData.cpf);
      setValue('date_of_birth', formData.date_of_birth);
      
      // Also reset to update defaults
      reset(formData);
    }
  }, [user, reset, setValue, refreshUserData]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    clearError();
    setSuccessMessage('');
    clearErrors();
    
    try {
      // Validação adicional no cliente
      if (!data.full_name.trim()) {
        setError('full_name', {
          type: 'manual',
          message: 'Nome completo é obrigatório'
        });
        return;
      }

      const success = await updateProfile({
        full_name: data.full_name.trim(),
        phone: data.phone?.trim() || undefined,
        cpf: data.cpf?.trim() || undefined,
        date_of_birth: data.date_of_birth || undefined
      });

      if (success) {
        setSuccessMessage('Perfil atualizado com sucesso! ✨');
        setIsEditing(false);
        
        // Force form reset with updated data after a small delay
        setTimeout(() => {
          if (user) {
            reset({
              full_name: user.full_name || '',
              email: user.email || '',
              phone: user.phone || '',
              cpf: user.cpf || '',
              date_of_birth: user.date_of_birth || ''
            });
          }
        }, 100);
        
        // Auto-hide success message
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError('root.serverError', {
          type: 'manual',
          message: 'Erro interno do servidor. Tente novamente.'
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // Handle specific errors
      if (error?.message?.includes('phone')) {
        setError('phone', {
          type: 'manual',
          message: 'Formato de telefone inválido'
        });
      } else if (error?.message?.includes('name')) {
        setError('full_name', {
          type: 'manual',
          message: 'Nome contém caracteres inválidos'
        });
      } else {
        setError('root.serverError', {
          type: 'manual',
          message: 'Erro inesperado. Tente novamente em alguns minutos.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    clearError();
    clearErrors();
    setSuccessMessage('');
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format based on length
    if (phoneNumber.length <= 2) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`;
    } else {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
    }
  };

  // Format CPF as user types
  const formatCPF = (value: string) => {
    if (!value) return value;
    
    // Remove all non-digits
    const cpf = value.replace(/\D/g, '');
    
    // Format based on length
    if (cpf.length <= 3) {
      return cpf;
    } else if (cpf.length <= 6) {
      return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
    } else if (cpf.length <= 9) {
      return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
    } else {
      return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-500">Carregando perfil...</p>
          </div>
        ) : (
          <p className="text-gray-500">Você precisa estar logado para ver seu perfil.</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Meu Perfil</h2>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      <form 
        key={user?.updated_at} // Force re-render when user data changes
        onSubmit={handleSubmit(onSubmit)} 
        className="w-full space-y-6"
      >
        {(error || errors.root?.serverError) && (
          <Alert 
            type="error" 
            message={typeof error === 'string' ? error : error?.message || errors.root?.serverError?.message || 'Erro desconhecido'}
            onClose={() => {
              clearError();
              clearErrors('root.serverError');
            }}
          />
        )}

        {successMessage && (
          <Alert 
            type="success" 
            message={successMessage}
            onClose={() => setSuccessMessage('')}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...register('full_name')}
                id="full_name"
                type="text"
                className={`pl-10 ${errors.full_name ? 'border-red-300' : ''}`}
                disabled={isLoading || !isEditing}
                placeholder="Seu nome completo"
              />
            </div>
            {errors.full_name && (
              <p className="text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...register('email')}
                id="email"
                type="email"
                className={`pl-10 ${errors.email ? 'border-red-300' : ''} bg-gray-50`}
                disabled={true}
                placeholder="seu@email.com"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
            <p className="text-xs text-gray-500">O email não pode ser alterado</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...register('phone', {
                  onChange: (e) => {
                    e.target.value = formatPhoneNumber(e.target.value);
                  }
                })}
                id="phone"
                type="tel"
                className={`pl-10 ${errors.phone ? 'border-red-300 focus:border-red-300' : ''}`}
                disabled={isLoading || !isEditing}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
              CPF
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...register('cpf', {
                  onChange: (e) => {
                    e.target.value = formatCPF(e.target.value);
                  }
                })}
                id="cpf"
                type="text"
                className={`pl-10 ${errors.cpf ? 'border-red-300 focus:border-red-300' : ''}`}
                disabled={isLoading || !isEditing}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            {errors.cpf && (
              <p className="text-sm text-red-600">{errors.cpf.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
              Data de Nascimento
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                {...register('date_of_birth')}
                id="date_of_birth"
                type="date"
                className={`pl-10 ${errors.date_of_birth ? 'border-red-300' : ''}`}
                disabled={isLoading || !isEditing}
              />
            </div>
            {errors.date_of_birth && (
              <p className="text-sm text-red-600">{errors.date_of_birth.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">
              Última atualização: {user.updated_at ? new Date(user.updated_at).toLocaleString('pt-BR') : 'Nunca'}
            </p>
          </div>
          
          <div className="flex space-x-3">
            {!isEditing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(true);
                  clearErrors();
                  clearError();
                  setSuccessMessage('');
                }}
                disabled={isLoading && !user}
              >
                Editar Perfil
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading || isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting || !isDirty || !isValid}
                  className="flex items-center space-x-2 min-w-[120px]"
                >
                  {(isLoading || isSubmitting) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;