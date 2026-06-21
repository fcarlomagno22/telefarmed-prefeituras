import { PacientesError } from '../admin-pacientes/errors.js'

export class PrefeituraFaturamentoError extends Error {
  statusCode: number
  code?: string

  constructor(message: string, statusCode = 400, code?: string) {
    super(message)
    this.name = 'PrefeituraFaturamentoError'
    this.statusCode = statusCode
    this.code = code
  }
}

export function mapPrefeituraFaturamentoError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof PrefeituraFaturamentoError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof PacientesError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  console.error('[prefeitura-faturamento]', error)
  return { statusCode: 500, body: { error: 'Erro interno no faturamento SUS.' } }
}
