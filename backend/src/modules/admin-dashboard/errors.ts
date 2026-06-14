export class AdminDashboardError extends Error {
  statusCode: number
  code: string

  constructor(message: string, code = 'INTERNAL', statusCode = 500) {
    super(message)
    this.name = 'AdminDashboardError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function mapAdminDashboardError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof AdminDashboardError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Não foi possível carregar o dashboard administrativo.' },
  }
}

export function formatAdminDashboardValidationError(): { statusCode: number; body: { error: string } } {
  return { statusCode: 400, body: { error: 'Parâmetros inválidos.' } }
}
