import { ZodError } from 'zod'
import { PacientesError } from '../admin-pacientes/errors.js'
import { getSupabaseErrorMessage, isMissingSupabaseResource } from '../../lib/supabaseErrors.js'

export class UbtAgendaError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'UbtAgendaError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function formatUbtAgendaValidationError(error: ZodError): string {
  const first = error.issues[0]
  return first?.message ?? 'Dados inválidos.'
}

export function mapUbtAgendaError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof UbtAgendaError) {
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

  if (isMissingSupabaseResource(error, 'agenda_consultas')) {
    return {
      statusCode: 503,
      body: {
        error: 'Módulo de agenda indisponível. Execute as migrations do Supabase.',
        code: 'SCHEMA_UNAVAILABLE',
      },
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ubt-agenda]', getSupabaseErrorMessage(error))
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}
