export class AdminMonitorError extends Error {
  statusCode: number
  code: string

  constructor(message: string, code = 'INTERNAL', statusCode = 500) {
    super(message)
    this.name = 'AdminMonitorError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function mapAdminMonitorError(error: unknown): { statusCode: number; body: { error: string; code?: string } } {
  if (error instanceof AdminMonitorError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Não foi possível carregar o monitor operacional.' },
  }
}
