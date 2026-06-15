import type { ZodError } from 'zod'
import { ProfissionalEscalaError } from '../profissional-escala/errors.js'

export class PublicPlantaoAceiteError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_TOKEN'
      | 'NOT_FOUND'
      | 'EXPIRED'
      | 'UNAVAILABLE'
      | 'CPF_INVALID'
      | 'FORBIDDEN'
      | 'SLOT_UNAVAILABLE'
      | 'SCHEDULE_CONFLICT'
      | 'RESERVE_ALREADY_APPLIED'
      | 'RESERVE_QUEUE_FULL'
      | 'INVALID_DATA',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'PublicPlantaoAceiteError'
  }
}

export function formatPublicPlantaoAceiteValidationError(error: ZodError): string {
  const first = error.issues[0]
  return first?.message ?? 'Dados inválidos.'
}

export function mapPublicPlantaoAceiteError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string; message?: string }
} {
  if (error instanceof PublicPlantaoAceiteError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, message: error.message, code: error.code },
    }
  }

  if (error instanceof ProfissionalEscalaError) {
    const code =
      error.code === 'FORBIDDEN'
        ? 'FORBIDDEN'
        : error.code === 'SCHEDULE_CONFLICT'
          ? 'SCHEDULE_CONFLICT'
          : error.code === 'NOT_FOUND'
            ? 'NOT_FOUND'
            : 'SLOT_UNAVAILABLE'

    return {
      statusCode: error.statusCode,
      body: { error: error.message, message: error.message, code },
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[public-plantao-aceite]', error)
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.', message: 'Erro interno.' },
  }
}
