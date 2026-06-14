import { ZodError } from 'zod'
import { UbtAgendaError } from '../ubt-agenda/errors.js'
import { UbtPacientesError } from '../ubt-pacientes/errors.js'
import { getSupabaseErrorMessage, isMissingSupabaseResource } from '../../lib/supabaseErrors.js'

export class UbtTriagemError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'UbtTriagemError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function formatUbtTriagemValidationError(error: ZodError): string {
  const first = error.issues[0]
  return first?.message ?? 'Dados inválidos.'
}

export function mapUbtTriagemError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof UbtTriagemError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof UbtAgendaError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof UbtPacientesError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (isMissingSupabaseResource(error, 'fila_espera')) {
    return {
      statusCode: 503,
      body: {
        error: 'Módulo de triagem indisponível. Execute as migrations do Supabase.',
        code: 'SCHEMA_UNAVAILABLE',
      },
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
    console.error('[ubt-triagem]', getSupabaseErrorMessage(error))
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}
