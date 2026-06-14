import { ZodError } from 'zod'
import { getSupabaseErrorMessage, isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { ProfissionalAtendimentosError } from '../profissional-atendimentos/errors.js'

export class PublicAtendimentoError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'PublicAtendimentoError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function formatPublicAtendimentoValidationError(error: ZodError): string {
  const first = error.issues[0]
  return first?.message ?? 'Dados inválidos.'
}

export function mapPublicAtendimentoError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof PublicAtendimentoError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof ProfissionalAtendimentosError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (isMissingSupabaseResource(error, 'consultas')) {
    return {
      statusCode: 503,
      body: {
        error: 'Módulo de atendimento indisponível. Execute as migrations do Supabase.',
        code: 'SCHEMA_UNAVAILABLE',
      },
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[public-atendimento]', getSupabaseErrorMessage(error))
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}
