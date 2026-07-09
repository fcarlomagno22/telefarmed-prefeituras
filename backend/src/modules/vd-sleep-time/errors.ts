export type VdSleepTimeErrorCode = 'NOT_FOUND' | 'INVALID_DATA' | 'FORBIDDEN' | 'CONFLICT'

export class VdSleepTimeError extends Error {
  constructor(
    message: string,
    readonly code: VdSleepTimeErrorCode,
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'VdSleepTimeError'
  }
}

export function mapVdSleepTimeError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string; message?: string }
} {
  if (error instanceof VdSleepTimeError) {
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
