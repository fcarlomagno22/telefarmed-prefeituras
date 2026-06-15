import { AuthError } from '../admin-auth/service.js'
import type { ZodError } from 'zod'

export function formatEscalaValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return issue.message || 'Dados inválidos.'
}

export class EscalaError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'FORBIDDEN'
      | 'CONFLICT'
      | 'DOCTOR_CONFLICT'
      | 'NO_VACANCY'
      | 'SERVICE_UNAVAILABLE',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'EscalaError'
  }
}

export function mapEscalaError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof EscalaError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof AuthError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof Error && error.message === 'Data/hora inválida.') {
    return {
      statusCode: 400,
      body: { error: error.message, code: 'INVALID_DATA' },
    }
  }

  const pgCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null

  if (pgCode === '23505') {
    return {
      statusCode: 409,
      body: { error: 'Operação conflita com registros existentes.', code: 'CONFLICT' },
    }
  }

  if (pgCode === '23503' || pgCode === '23514' || pgCode === '22023' || pgCode === '22008') {
    return {
      statusCode: 400,
      body: {
        error:
          pgCode === '22008'
            ? 'Horário do plantão inválido. Revise início e fim do turno.'
            : 'Não é possível concluir a operação com os dados informados.',
        code: 'INVALID_DATA',
      },
    }
  }

  const rawMessage =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : ''

  if (pgCode === 'PGRST205' || rawMessage.includes('schema cache')) {
    return {
      statusCode: 503,
      body: {
        error: 'Módulo de escala indisponível: aplique as migrations de escala_plantoes no Supabase.',
        code: 'SERVICE_UNAVAILABLE',
      },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
