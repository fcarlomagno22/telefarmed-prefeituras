export class VdCadastroError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'ALREADY_REGISTERED'
      | 'ADDRESS_NOT_ELIGIBLE'
      | 'INVALID_DATA'
      | 'NOT_FOUND'
      | 'CONFLICT',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'VdCadastroError'
  }
}

export function mapVdCadastroError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string; message?: string }
} {
  if (error instanceof VdCadastroError) {
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
