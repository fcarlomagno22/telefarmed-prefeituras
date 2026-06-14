import { ComunicadosError } from '../comunicados/errors.js'

export class UbtNotificacoesError extends ComunicadosError {
  constructor(message: string, code: string, statusCode: number) {
    super(message, code, statusCode)
    this.name = 'UbtNotificacoesError'
  }
}

export function mapUbtNotificacoesError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof UbtNotificacoesError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  if (error instanceof ComunicadosError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  console.error(error)
  return { statusCode: 500, body: { error: 'Erro interno ao processar notificações.' } }
}

export function formatUbtNotificacoesValidationError(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? 'Parâmetros inválidos.'
}
