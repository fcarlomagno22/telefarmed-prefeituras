export class CredenciaisError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'DUPLICATE_CPF'
      | 'DUPLICATE_EMAIL'
      | 'MASTER_PROTECTED'
      | 'PIN_INVALID'
      | 'PIN_NOT_CONFIGURED'
      | 'UBT_REQUIRED'
      | 'UBT_INVALID'
      | 'FORBIDDEN',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'CredenciaisError'
  }
}

export function mapCredenciaisError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof CredenciaisError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
