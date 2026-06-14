import { ZodError } from 'zod'
import { UbtPacientesError } from '../ubt-pacientes/errors.js'
import { UbtTriagemError } from '../ubt-triagem/errors.js'
import { getSupabaseErrorMessage, isMissingSupabaseResource } from '../../lib/supabaseErrors.js'

export class UbtConsultasError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'UbtConsultasError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function formatUbtConsultasValidationError(error: ZodError): string {
  const first = error.issues[0]
  return first?.message ?? 'Dados inválidos.'
}

export function mapUbtConsultasError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof UbtConsultasError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof UbtPacientesError || error instanceof UbtTriagemError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (isMissingSupabaseResource(error, 'consultas')) {
    return {
      statusCode: 503,
      body: {
        error: 'Módulo de consultas indisponível. Execute as migrations do Supabase.',
        code: 'SCHEMA_UNAVAILABLE',
      },
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ubt-consultas]', getSupabaseErrorMessage(error))
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}
