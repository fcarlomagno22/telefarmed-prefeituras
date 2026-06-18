import { AuthError } from '../admin-auth/service.js'

import type { ZodError } from 'zod'

export function formatClientesValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'

  const path = issue.path.join('.')
  const messages: Record<string, string> = {
    pin: 'Senha de autorização inválida.',
    cnpj: 'CNPJ inválido.',
    nome: 'Informe o nome da entidade.',
    subtitulo: 'Informe o subtítulo da entidade.',
    razaoSocial: 'Informe a razão social.',
    slug: 'Informe um endereço público válido.',
    municipio: 'Informe o município.',
    uf: 'Informe a UF.',
    tipo: 'Selecione um tipo de contrato válido.',
    dataAssinatura: 'Informe a data de assinatura do contrato.',
    'contatoContrato.name': 'Informe o nome do gestor operacional do contrato.',
    'contatoContrato.email': 'Informe um e-mail válido para o gestor operacional do contrato.',
  }

  if (path.startsWith('precosPorProfissao') && issue.message.includes('greater than')) {
    return 'Informe o valor por consulta maior que zero para cada profissão selecionada.'
  }
  if (path.startsWith('precosPorEspecialidade') && issue.message.includes('greater than')) {
    return 'Informe o valor por consulta maior que zero para cada especialidade selecionada.'
  }
  if (path.startsWith('excedentePrecosPorProfissao') && issue.message.includes('greater than')) {
    return 'Informe o valor de excedente maior que zero para cada profissão selecionada.'
  }
  if (path.startsWith('excedentePrecosPorEspecialidade') && issue.message.includes('greater than')) {
    return 'Informe o valor de excedente maior que zero para cada especialidade selecionada.'
  }

  return messages[path] ?? 'Dados inválidos.'
}

export class ClientesError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_FOUND'
      | 'INVALID_DATA'
      | 'DUPLICATE_CNPJ'
      | 'DUPLICATE_SLUG'
      | 'PIN_INVALID'
      | 'PIN_NOT_CONFIGURED'
      | 'FORBIDDEN'
      | 'CONFLICT',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ClientesError'
  }
}

export function mapClientesError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ClientesError) {
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

  if (error instanceof Error && error.name === 'PrefeituraRedeError') {
    const redeError = error as Error & { statusCode?: number; code?: string }
    return {
      statusCode: redeError.statusCode ?? 400,
      body: { error: redeError.message, code: redeError.code },
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
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string' &&
      (error as { message: string }).message.includes('slug')
        ? 'Este endereço público já está em uso.'
        : 'Já existe um cliente com estes dados.'

    return {
      statusCode: 409,
      body: {
        error: message,
        code: message.includes('endereço') ? 'DUPLICATE_SLUG' : 'DUPLICATE_CNPJ',
      },
    }
  }

  if (pgCode === '23503' || pgCode === '22023') {
    const rawMessage =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : ''

    const message = rawMessage.includes('Não é possível excluir')
      ? rawMessage
      : rawMessage.includes('violates foreign key constraint')
        ? 'Dados comerciais inválidos: verifique profissões, especialidades e tipo de contrato.'
        : rawMessage || 'Não é possível concluir a operação com os dados informados.'

    return {
      statusCode: pgCode === '22023' ? 400 : 409,
      body: { error: message, code: pgCode === '22023' ? 'INVALID_DATA' : 'CONFLICT' },
    }
  }

  const rawMessage =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : ''

  if (
    pgCode === '42883' ||
    rawMessage.includes('atualizar_contrato_entidade_cliente') ||
    rawMessage.includes('Could not find the function')
  ) {
    return {
      statusCode: 503,
      body: {
        error:
          'Atualização de contrato indisponível: aplique a migration atualizar_contrato_entidade_cliente no Supabase.',
        code: 'SERVICE_UNAVAILABLE',
      },
    }
  }

  if (pgCode === '23514' || rawMessage.includes('contrato_entidade_precos')) {
    return {
      statusCode: 400,
      body: {
        error: 'Informe valores de consulta e excedente maiores que zero.',
        code: 'INVALID_DATA',
      },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente.' },
  }
}
