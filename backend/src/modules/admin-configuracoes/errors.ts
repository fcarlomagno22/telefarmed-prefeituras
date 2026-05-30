export class ConfiguracoesError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'DUPLICATE_NAME'
      | 'CONFLICT'
      | 'FORBIDDEN',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ConfiguracoesError'
  }
}

export function mapConfiguracoesError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ConfiguracoesError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  const pgCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null

  if (pgCode === '23505') {
    return {
      statusCode: 409,
      body: { error: 'Já existe um registro com este nome.', code: 'DUPLICATE_NAME' },
    }
  }

  if (pgCode === '23503' || pgCode === '22023') {
    return {
      statusCode: 400,
      body: { error: 'Dados inválidos ou referência inconsistente.', code: 'INVALID_DATA' },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
