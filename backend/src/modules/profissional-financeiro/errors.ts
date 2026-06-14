import type { ZodError } from 'zod'
import { mapProfissionalCadastroError, ProfissionalCadastroError } from '../profissional-cadastro/errors.js'
import { isProduction } from '../../config/env.js'
import { getSupabaseErrorMessage, isMissingSupabaseResource } from '../../lib/supabaseErrors.js'

export function formatProfissionalFinanceiroValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return issue.message || 'Dados inválidos.'
}

export class ProfissionalFinanceiroError extends Error {
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
    this.name = 'ProfissionalFinanceiroError'
  }
}

export function mapProfissionalFinanceiroError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalFinanceiroError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof ProfissionalCadastroError) {
    const mapped = mapProfissionalCadastroError(error)
    return mapped
  }

  if (isMissingSupabaseResource(error)) {
    return {
      statusCode: 503,
      body: {
        error:
          'Módulo financeiro indisponível: aplique as migrations profissional_financeiro no Supabase.',
        code: 'SERVICE_UNAVAILABLE',
      },
    }
  }

  if (!isProduction) {
    console.error('[profissional-financeiro]', getSupabaseErrorMessage(error))
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}
