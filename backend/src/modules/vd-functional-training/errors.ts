export type VdFunctionalTrainingErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_DATA'
  | 'FORBIDDEN'
  | 'CONFLICT'

export class VdFunctionalTrainingError extends Error {
  constructor(
    message: string,
    readonly code: VdFunctionalTrainingErrorCode,
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'VdFunctionalTrainingError'
  }
}

export function mapVdFunctionalTrainingError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string; message?: string }
} {
  if (error instanceof VdFunctionalTrainingError) {
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
