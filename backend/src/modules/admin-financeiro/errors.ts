import { AuthError } from '../admin-auth/service.js'
import { isMissingSupabaseResource, getSupabaseErrorMessage } from '../../lib/supabaseErrors.js'
import type { ZodError } from 'zod'

export function formatFinanceiroValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'

  const path = issue.path.join('.')
  const messages: Record<string, string> = {
    pin: 'Senha de autorização inválida.',
    cnpj: 'CNPJ inválido.',
    nome: 'Informe o nome do centro de custo.',
    descricao: 'Informe a descrição da conta.',
    fornecedorId: 'Selecione um fornecedor.',
    centroCustoId: 'Selecione um centro de custo.',
    valor: 'Informe um valor válido.',
    vencimento: 'Informe a data de vencimento.',
    motivo: 'Informe o motivo.',
    motivoAjuste: 'Informe o motivo do ajuste.',
    valorAprovadoCentavos: 'Informe o valor aprovado.',
  }

  return messages[path] ?? 'Dados inválidos.'
}

export class FinanceiroError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'DUPLICATE'
      | 'PIN_INVALID'
      | 'PIN_NOT_CONFIGURED'
      | 'FORBIDDEN'
      | 'CONFLICT'
      | 'ALREADY_CLOSED',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'FinanceiroError'
  }
}

export function mapFinanceiroError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof FinanceiroError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof AuthError) {
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

  if (pgCode === 'P0002') {
    return {
      statusCode: 404,
      body: { error: 'Registro não encontrado.', code: 'NOT_FOUND' },
    }
  }

  if (pgCode === '23505') {
    return {
      statusCode: 409,
      body: { error: 'Registro duplicado.', code: 'DUPLICATE' },
    }
  }

  if (pgCode === '23503') {
    return {
      statusCode: 409,
      body: { error: 'Operação bloqueada por vínculos existentes.', code: 'CONFLICT' },
    }
  }

  if (isMissingSupabaseResource(error)) {
    return {
      statusCode: 503,
      body: {
        error:
          'Schema financeiro indisponível. Aplique as migrations admin financeiro no Supabase.',
        code: 'SCHEMA_UNAVAILABLE',
      },
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[admin-financeiro]', getSupabaseErrorMessage(error), error)
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno ao processar financeiro.' },
  }
}
