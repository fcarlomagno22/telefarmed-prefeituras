import type { ZodError } from 'zod'
import { mapEscalaError } from '../admin-escala/errors.js'

export function formatProfissionalEscalaValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return issue.message || 'Dados inválidos.'
}

export class ProfissionalEscalaError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'FORBIDDEN'
      | 'CONFLICT'
      | 'NO_VACANCY'
      | 'SLOT_UNAVAILABLE'
      | 'SCHEDULE_CONFLICT'
      | 'SERVICE_UNAVAILABLE',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ProfissionalEscalaError'
  }
}

export function mapProfissionalEscalaError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalEscalaError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  const mapped = mapEscalaError(error)
  if (mapped.body.code === 'NO_VACANCY' || mapped.body.code === 'CONFLICT') {
    return {
      statusCode: mapped.statusCode,
      body: {
        error: mapped.body.error,
        code: mapped.body.code === 'NO_VACANCY' ? 'SLOT_UNAVAILABLE' : mapped.body.code,
      },
    }
  }

  return mapped
}
