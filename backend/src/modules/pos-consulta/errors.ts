export class PosConsultaError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'PosConsultaError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function mapPosConsultaError(error: unknown): { statusCode: number; body: { error: string; code?: string } } {
  if (error instanceof PosConsultaError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Não foi possível processar o acompanhamento pós-consulta.' },
  }
}
