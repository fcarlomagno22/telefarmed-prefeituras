import { isRh3ApiError } from '../../lib/rh3/errors.js'

export class UbtRh3Error extends Error {
  readonly code: string
  readonly statusCode: number

  constructor(message: string, code = 'RH3_ERROR', statusCode = 502) {
    super(message)
    this.name = 'UbtRh3Error'
    this.code = code
    this.statusCode = statusCode
  }
}

export function mapUbtRh3Error(error: unknown): { statusCode: number; body: { error: string; code?: string } } {
  if (error instanceof UbtRh3Error) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (isRh3ApiError(error)) {
    return {
      statusCode: error.statusCode && error.statusCode >= 400 ? error.statusCode : 502,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      body: { error: error.message },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Falha na integração com teleconsulta terceirizada.' },
  }
}
