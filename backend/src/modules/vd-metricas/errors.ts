export type VdMetricasErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_DATA'
  | 'FORBIDDEN'
  | 'CONFLICT'

export class VdMetricasError extends Error {
  constructor(
    message: string,
    readonly code: VdMetricasErrorCode,
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'VdMetricasError'
  }
}

export function mapVdMetricasError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string; message?: string }
} {
  if (error instanceof VdMetricasError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code, message: error.message },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
