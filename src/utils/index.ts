export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};

export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatCEP = (cep: string): string => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const validateCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
};

export const formatPhone = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.substring(0, 11);
  
  // Aplica a formatação baseada na quantidade de dígitos
  if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 6) {
    return `(${limitedNumbers.substring(0, 2)}) ${limitedNumbers.substring(2)}`;
  } else if (limitedNumbers.length <= 10) {
    return `(${limitedNumbers.substring(0, 2)}) ${limitedNumbers.substring(2, 6)}-${limitedNumbers.substring(6)}`;
  } else {
    return `(${limitedNumbers.substring(0, 2)}) ${limitedNumbers.substring(2, 7)}-${limitedNumbers.substring(7, 11)}`;
  }
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};

export const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  // Se a data já está no formato YYYY-MM-DD, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Caso contrário, converte para o formato correto
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  // Usa UTC para evitar problemas de fuso horário
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const formatDateForDisplay = (dateString: string | undefined): string => {
  if (!dateString) return 'Não informado';
  
  // Se a data está no formato YYYY-MM-DD, cria a data localmente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // mês é 0-indexado
    return date.toLocaleDateString('pt-BR');
  }
  
  // Para outros formatos, usa o método padrão mas com cuidado
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Data inválida';
  
  return date.toLocaleDateString('pt-BR');
};

export const createDateFromInput = (dateInput: string): string => {
  if (!dateInput) return '';
  
  // Input type="date" sempre retorna no formato YYYY-MM-DD
  // Vamos garantir que salvamos exatamente como recebemos
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  
  return '';
};