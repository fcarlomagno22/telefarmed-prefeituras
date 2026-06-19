import { AuthError } from '../admin-auth/service.js'
import type { ZodError } from 'zod'

export function formatPacientesValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  if (typeof issue.message === 'string' && issue.message.trim()) {
    return issue.message
  }
  return 'Dados inválidos.'
}

export class PacientesError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'DUPLICATE_CPF'
      | 'DUPLICATE_CNS'
      | 'FORBIDDEN'
      | 'CONFLICT'
      | 'PRE_CADASTRO_INVALID'
      | 'CONTRACT_INACTIVE',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'PacientesError'
  }
}

export function mapPacientesError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof PacientesError) {
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

  if (error instanceof Error && error.message === 'CNS inválido') {
    return {
      statusCode: 400,
      body: { error: 'CNS/Cartão SUS inválido.', code: 'INVALID_DATA' },
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
      body: { error: 'Paciente não encontrado.', code: 'NOT_FOUND' },
    }
  }

  if (pgCode === '23505') {
    const constraint =
      typeof error === 'object' &&
      error !== null &&
      'constraint' in error &&
      typeof (error as { constraint: unknown }).constraint === 'string'
        ? (error as { constraint: string }).constraint
        : ''

    if (constraint.includes('cns')) {
      return {
        statusCode: 409,
        body: {
          error: 'Já existe um paciente com este CNS nesta entidade contratante.',
          code: 'DUPLICATE_CNS',
        },
      }
    }

    return {
      statusCode: 409,
      body: {
        error: 'Já existe um paciente com este CPF nesta entidade contratante.',
        code: 'DUPLICATE_CPF',
      },
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
    const missingActivityTables =
      rawMessage.includes('paciente_anotacoes') ||
      rawMessage.includes('paciente_registros_contato')

    return {
      statusCode: 503,
      body: {
        error: missingActivityTables
          ? 'Módulo de anotações/contatos indisponível: aplique a migration reapply_paciente_operacional_activity no Supabase.'
          : 'Módulo de pacientes indisponível: aplique a migration reapply_admin_pacientes_schema no Supabase.',
        code: 'SERVICE_UNAVAILABLE',
      },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
