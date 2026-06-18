import type { ZodError } from 'zod'
import { PrefeituraAuthError } from '../prefeitura-auth/service.js'

export function formatRedeValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return 'Dados inválidos.'
}

export class PrefeituraRedeError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_DATA' | 'FORBIDDEN' | 'CONFLICT' | 'DUPLICATE_SLUG',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'PrefeituraRedeError'
  }
}

export function mapPrefeituraRedeError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof PrefeituraRedeError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof PrefeituraAuthError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
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

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
