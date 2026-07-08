export type VdRunWalkErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_DATA'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'STORAGE_UNAVAILABLE'

export class VdRunWalkError extends Error {
  constructor(
    message: string,
    readonly code: VdRunWalkErrorCode,
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'VdRunWalkError'
  }
}

export function mapVdRunWalkError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string; message?: string }
} {
  if (error instanceof VdRunWalkError) {
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
