export class ComunicadosError extends Error {
  readonly code: string
  readonly statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'ComunicadosError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function mapComunicadosError(error: unknown): { statusCode: number; body: { error: string; code?: string } } {
  if (error instanceof ComunicadosError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  console.error(error)
  return { statusCode: 500, body: { error: 'Erro interno ao processar comunicados.' } }
}
