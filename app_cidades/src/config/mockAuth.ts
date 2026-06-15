import { AuthUser } from '../types/auth'
import { cpfDigits } from '../utils/cpf'

export const MOCK_AUTH_CPF = '22652204858'
export const MOCK_AUTH_PASSWORD = 'Fernando2@'

const MOCK_AUTH_USER: AuthUser = {
  name: 'Fernando Carlomagno',
  cpf: '226.522.048-58',
  email: 'fernando.carlomagno@telefarmed.com.br',
  phone: '(11) 98765-4321',
  address: {
    cep: '01227-000',
    street: 'Rua da Consolação',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    number: '100',
    complement: '',
  },
  selfieUri: null,
}

export function isValidMockCredentials(cpf: string, password: string) {
  return cpfDigits(cpf) === MOCK_AUTH_CPF && password === MOCK_AUTH_PASSWORD
}

export function createMockAuthUser(): AuthUser {
  return { ...MOCK_AUTH_USER }
}
