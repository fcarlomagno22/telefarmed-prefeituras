import { ComunicadosError } from '../comunicados/errors.js'

export class ProfissionalNotificacoesError extends ComunicadosError {
  constructor(message: string, code: string, statusCode: number) {
    super(message, code, statusCode)
    this.name = 'ProfissionalNotificacoesError'
  }
}

export function mapProfissionalNotificacoesError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalNotificacoesError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  if (error instanceof ComunicadosError) {
    return { statusCode: error.statusCode, body: { error: error.message, code: error.code } }
  }
  console.error(error)
  return { statusCode: 500, body: { error: 'Erro interno ao processar notificações.' } }
}

export function formatProfissionalNotificacoesValidationError(error: {
  issues: Array<{ message: string }>
}) {
  return error.issues[0]?.message ?? 'Parâmetros inválidos.'
}
