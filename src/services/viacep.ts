export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface CepAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  stateCode: string;
  region: string;
  ddd: string;
  isValid: boolean;
}

export class ViaCepService {
  private static readonly BASE_URL = 'https://viacep.com.br/ws';
  private static readonly REQUEST_TIMEOUT = 10000; // 10 segundos

  static async fetchCepData(cep: string): Promise<CepAddress | null> {
    try {
      // Limpar CEP (remover caracteres não numéricos)
      const cleanCep = cep.replace(/\D/g, '');
      
      // Validar formato do CEP
      if (!this.isValidCepFormat(cleanCep)) {
        throw new Error('CEP deve conter exatamente 8 dígitos');
      }

      // Fazer requisição para ViaCEP
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(`${this.BASE_URL}/${cleanCep}/json/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const data: ViaCepResponse = await response.json();

      // Verificar se o CEP foi encontrado
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      // Converter resposta da API para o formato interno
      return this.mapViaCepToAddress(data);

    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      
      if (error instanceof Error) {
        // Re-throw com mensagem mais específica
        if (error.name === 'AbortError') {
          throw new Error('Tempo limite da requisição excedido');
        }
        throw error;
      }
      
      throw new Error('Erro desconhecido ao buscar CEP');
    }
  }

  private static isValidCepFormat(cep: string): boolean {
    return /^\d{8}$/.test(cep);
  }

  private static mapViaCepToAddress(data: ViaCepResponse): CepAddress {
    return {
      cep: data.cep,
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.estado || '',
      stateCode: data.uf || '',
      region: data.regiao || '',
      ddd: data.ddd || '',
      isValid: true,
    };
  }

  static formatCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length <= 5) {
      return cleanCep;
    }
    return cleanCep.replace(/(\d{5})(\d{0,3})/, '$1-$2');
  }

  static validateCep(cep: string): boolean {
    const cleanCep = cep.replace(/\D/g, '');
    return this.isValidCepFormat(cleanCep);
  }
}