import type { ZodError } from 'zod'
import { getSupabaseErrorMessage, isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { isProduction } from '../../config/env.js'

export function formatProfissionalAgendaValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return issue.message || 'Dados inválidos.'
}

export class ProfissionalAgendaError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'FORBIDDEN'
      | 'CONFLICT'
      | 'SERVICE_UNAVAILABLE',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ProfissionalAgendaError'
  }
}

export function mapProfissionalAgendaError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalAgendaError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (isMissingSupabaseResource(error)) {
    return {
      statusCode: 503,
      body: {
        error:
          'Módulo de agenda clínica indisponível: aplique as migrations de agenda_consultas, fila_espera e consultas no Supabase.',
        code: 'SERVICE_UNAVAILABLE',
      },
    }
  }

  if (!isProduction) {
    console.error('[profissional-agenda]', getSupabaseErrorMessage(error))
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}
