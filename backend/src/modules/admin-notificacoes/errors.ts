import { ComunicadosError } from '../comunicados/errors.js'

export class AdminNotificacoesError extends ComunicadosError {
  constructor(message: string, code: string, statusCode: number) {
    super(message, code, statusCode)
    this.name = 'AdminNotificacoesError'
  }
}

export function mapAdminNotificacoesError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof AdminNotificacoesError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  if (error instanceof ComunicadosError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  console.error(error)
  return { statusCode: 500, body: { error: 'Erro interno ao processar notificações.' } }
}

export function formatAdminNotificacoesValidationError(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? 'Parâmetros inválidos.'
}
