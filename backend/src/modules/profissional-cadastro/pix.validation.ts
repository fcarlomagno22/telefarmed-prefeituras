import { ProfissionalCadastroError } from './errors.js'

export type PixKeyType = 'cnpj' | 'email' | 'telefone' | 'aleatoria'

function normalizePixKey(type: PixKeyType, value: string): string {
  const trimmed = value.trim()
  switch (type) {
    case 'cnpj':
    case 'telefone':
      return trimmed.replace(/\D/g, '')
    case 'email':
      return trimmed.toLowerCase()
    case 'aleatoria':
      return trimmed.replace(/[^a-fA-F0-9]/g, '').toLowerCase()
    default:
      return trimmed
  }
}

export function validatePixKey(type: PixKeyType, value: string): string {
  const normalized = normalizePixKey(type, value)

  if (type === 'cnpj' && normalized.length !== 14) {
    throw new ProfissionalCadastroError('Chave PIX CNPJ inválida.', 'INVALID_DATA', 400)
  }

  if (type === 'telefone' && normalized.length < 10) {
    throw new ProfissionalCadastroError('Chave PIX de telefone inválida.', 'INVALID_DATA', 400)
  }

  if (type === 'email') {
    if (!normalized.includes('@') || !normalized.includes('.')) {
      throw new ProfissionalCadastroError('Chave PIX de e-mail inválida.', 'INVALID_DATA', 400)
    }
  }

  if (type === 'aleatoria' && normalized.length !== 32) {
    throw new ProfissionalCadastroError('Chave PIX aleatória inválida.', 'INVALID_DATA', 400)
  }

  return value.trim()
}
