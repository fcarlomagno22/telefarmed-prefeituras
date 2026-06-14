import { ProfissionalCadastroError } from '../profissional-cadastro/errors.js'

export class ProfissionalPerfilError extends Error {
  statusCode: number
  code: string

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'ProfissionalPerfilError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function mapProfissionalPerfilError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalPerfilError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  if (error instanceof ProfissionalCadastroError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  console.error(error)
  return { statusCode: 500, body: { error: 'Erro interno ao processar o perfil.' } }
}

export function formatProfissionalPerfilValidationError(error: {
  issues: Array<{ message: string }>
}) {
  return error.issues[0]?.message ?? 'Parâmetros inválidos.'
}
