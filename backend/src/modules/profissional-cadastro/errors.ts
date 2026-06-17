import type { ZodError } from 'zod'
import { formatZodIssuesForLog, logProfissionalCadastro, logProfissionalCadastroError } from './debug-log.js'

export function formatCadastroValidationError(error: ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'Dados inválidos.'
  return issue.message || 'Dados inválidos.'
}

export class ProfissionalCadastroError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_DATA'
      | 'DUPLICATE_CPF'
      | 'DOCUMENT_REQUIRED'
      | 'DOCUMENT_INVALID'
      | 'SPECIALTY_NOT_FOUND'
      | 'CONFLICT'
      | 'RATE_LIMITED',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ProfissionalCadastroError'
  }
}

export function mapProfissionalCadastroError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalCadastroError) {
    logProfissionalCadastro('warn', 'cadastro error mapeado', {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
    })
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (error instanceof Error && error.message === 'CPF inválido') {
    return {
      statusCode: 400,
      body: { error: 'CPF inválido.', code: 'INVALID_DATA' },
    }
  }

  const fastifyCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null

  if (fastifyCode === 'FST_REQ_FILE_TOO_LARGE') {
    return {
      statusCode: 400,
      body: { error: 'Arquivo excede o limite de 8 MB.', code: 'DOCUMENT_INVALID' },
    }
  }

  if (fastifyCode === 'FST_PARTS_LIMIT' || fastifyCode === 'FST_FIELDS_LIMIT') {
    return {
      statusCode: 400,
      body: { error: 'Envio inválido. Tente novamente com menos arquivos ou dados.', code: 'INVALID_DATA' },
    }
  }

  if (
    error instanceof Error &&
    (error.message === 'Premature close' ||
      ('code' in error && error.code === 'ERR_STREAM_PREMATURE_CLOSE'))
  ) {
    return {
      statusCode: 400,
      body: {
        error: 'Não foi possível ler o envio. Verifique os arquivos e tente novamente.',
        code: 'INVALID_DATA',
      },
    }
  }

  const pgCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null

  const rawMessage =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : ''

  if (pgCode === '23505') {
    return {
      statusCode: 409,
      body: {
        error:
          'Já existe uma candidatura em análise para este CPF. Aguarde o retorno da nossa equipe.',
        code: 'DUPLICATE_CPF',
      },
    }
  }

  if (pgCode === '23503') {
    logProfissionalCadastro('warn', 'cadastro FK inválida', { pgCode, rawMessage })
    return {
      statusCode: 400,
      body: { error: 'Especialidade ou formação inválida.', code: 'INVALID_DATA' },
    }
  }

  if (pgCode === 'PGRST205' || rawMessage.includes('schema cache')) {
    const missingSpecialtiesTable = rawMessage.includes('candidatura_especialidades')

    return {
      statusCode: 503,
      body: {
        error: missingSpecialtiesTable
          ? 'Módulo de especialidades indisponível: aplique a migration candidatura_especialidades no Supabase.'
          : 'Módulo de candidaturas indisponível: aplique as migrations de candidaturas_profissionais no Supabase.',
        code: 'SERVICE_UNAVAILABLE',
      },
    }
  }

  logProfissionalCadastroError('cadastro erro interno não mapeado', error, {
    pgCode,
    rawMessage,
  })

  return {
    statusCode: 500,
    body: { error: 'Erro interno. Tente novamente em instantes.' },
  }
}

export function logCadastroValidationFailure(
  step: string,
  error: ZodError,
  meta?: Record<string, unknown>,
): void {
  logProfissionalCadastro('warn', step, {
    ...meta,
    validationIssues: formatZodIssuesForLog(error),
  })
}
