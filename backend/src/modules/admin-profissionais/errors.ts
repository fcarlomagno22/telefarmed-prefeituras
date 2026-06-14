import { AuthError } from '../admin-auth/service.js'
import type { ZodError } from 'zod'

export function formatProfissionaisValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return issue.message || 'Dados inválidos.'
}

export class ProfissionaisError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'DUPLICATE_CPF'
      | 'FORBIDDEN'
      | 'CONFLICT'
      | 'INVALID_STATE'
      | 'SPECIALTY_NOT_FOUND',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ProfissionaisError'
  }
}

export function mapProfissionaisError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionaisError) {
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

  if (error instanceof Error && error.message === 'CPF inválido') {
    return {
      statusCode: 400,
      body: { error: 'CPF inválido.', code: 'INVALID_DATA' },
    }
  }

  const pgCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null

  if (pgCode === 'P0002') {
    return {
      statusCode: 404,
      body: { error: 'Registro não encontrado.', code: 'NOT_FOUND' },
    }
  }

  if (pgCode === '23505') {
    return {
      statusCode: 409,
      body: { error: 'Já existe um registro com estes dados.', code: 'DUPLICATE_CPF' },
    }
  }

  if (pgCode === '23503' || pgCode === '22023') {
    return {
      statusCode: pgCode === '22023' ? 400 : 409,
      body: { error: 'Não é possível concluir a operação com os dados informados.', code: 'CONFLICT' },
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
    const missingAtivosView = rawMessage.includes('vw_admin_profissionais_ativos')
    const missingCandidaturasView = rawMessage.includes('vw_admin_candidaturas_listagem')

    return {
      statusCode: 503,
      body: {
        error: missingAtivosView
          ? 'Módulo de profissionais ativos indisponível: aplique a migration reapply_admin_profissionais_ativos no Supabase.'
          : missingCandidaturasView
            ? 'Módulo de candidaturas indisponível: aplique a migration reapply_candidaturas_profissionais no Supabase.'
            : 'Módulo de profissionais indisponível: aplique as migrations de profissionais no Supabase.',
        code: 'SERVICE_UNAVAILABLE',
      },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
