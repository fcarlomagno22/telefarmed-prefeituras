export class SuporteError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'SuporteError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function mapSuporteError(error: unknown, fallbackMessage = 'Erro interno ao processar suporte.'): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof SuporteError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  console.error(error)
  return { statusCode: 500, body: { error: fallbackMessage } }
}

export function formatSuporteValidationError(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? 'Parâmetros inválidos.'
}
