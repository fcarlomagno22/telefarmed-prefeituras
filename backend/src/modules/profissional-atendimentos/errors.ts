import type { ZodError } from 'zod'

export function formatProfissionalAtendimentosValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return issue.message || 'Dados inválidos.'
}

export class ProfissionalAtendimentosError extends Error {
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
    this.name = 'ProfissionalAtendimentosError'
  }
}

export function mapProfissionalAtendimentosError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalAtendimentosError) {
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
