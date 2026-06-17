import type { ZodError } from 'zod'

type LogLevel = 'info' | 'warn' | 'error'

function maskCpf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const digits = value.replace(/\D/g, '')
  if (digits.length < 4) return '***'
  return `***${digits.slice(-4)}`
}

function maskEmail(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.includes('@')) return undefined
  const [local, domain] = value.split('@')
  if (!domain) return '***'
  const visible = local.slice(0, 1)
  return `${visible}***@${domain}`
}

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(meta)) {
    if (key === 'cpf') {
      sanitized.cpf = maskCpf(value)
      continue
    }
    if (key === 'email') {
      sanitized.email = maskEmail(value)
      continue
    }
    if (key === 'dados' && typeof value === 'object' && value !== null) {
      const dados = value as Record<string, unknown>
      sanitized.dados = {
        ...dados,
        cpf: maskCpf(dados.cpf),
        email: maskEmail(dados.email),
        password: dados.password !== undefined ? '[redacted]' : undefined,
        confirmPassword: dados.confirmPassword !== undefined ? '[redacted]' : undefined,
      }
      continue
    }
    sanitized[key] = value
  }

  return sanitized
}

export function formatZodIssuesForLog(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }))
}

export function logProfissionalCadastro(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const suffix = meta ? ` ${JSON.stringify(sanitizeMeta(meta))}` : ''
  const line = `[profissional-cadastro] ${message}${suffix}`

  if (level === 'error') {
    console.error(line)
    return
  }
  if (level === 'warn') {
    console.warn(line)
    return
  }
  console.info(line)
}

export function logProfissionalCadastroError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  if (error instanceof Error) {
    logProfissionalCadastro('error', context, {
      ...meta,
      errorName: error.name,
      errorMessage: error.message,
      ...(typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
        ? { errorCode: (error as { code: string }).code }
        : {}),
    })
    return
  }

  if (typeof error === 'object' && error !== null) {
    logProfissionalCadastro('error', context, {
      ...meta,
      errorDetails: error,
    })
    return
  }

  logProfissionalCadastro('error', context, {
    ...meta,
    error: String(error),
  })
}
