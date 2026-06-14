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

type PostgresLikeError = {
  code?: string
  message?: string
}

function isPostgresLikeError(error: unknown): error is PostgresLikeError {
  return typeof error === 'object' && error !== null && 'code' in error
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

  if (isPostgresLikeError(error)) {
    if (error.code === '23505') {
      return {
        statusCode: 409,
        body: { error: 'CPF ou e-mail já cadastrado.', code: 'DUPLICATE_CPF' },
      }
    }
    if (error.code === 'P0002' || error.message?.includes('não encontrada')) {
      return {
        statusCode: 404,
        body: { error: error.message ?? 'Registro não encontrado.', code: 'NOT_FOUND' },
      }
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
