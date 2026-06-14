import type { ZodError } from 'zod'

export function formatProfissionalAvaliacaoValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return issue.message || 'Dados inválidos.'
}

export class ProfissionalAvaliacaoError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_DATA' | 'FORBIDDEN' | 'SERVICE_UNAVAILABLE',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ProfissionalAvaliacaoError'
  }
}

export function mapProfissionalAvaliacaoError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalAvaliacaoError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}
