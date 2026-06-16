import type { ZodError } from 'zod'

export class PublicLiveShareError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_TOKEN' | 'NOT_FOUND' | 'EXPIRED',
    readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'PublicLiveShareError'
  }
}

export function formatPublicLiveShareValidationError(error: ZodError): string {
  const first = error.issues[0]
  return first?.message ?? 'Token inválido.'
}

export function mapPublicLiveShareError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string; message?: string }
} {
  if (error instanceof PublicLiveShareError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, message: error.message, code: error.code },
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[public-live-share]', error)
  }

  return {
    statusCode: 500,
    body: { error: 'Não foi possível carregar o acompanhamento.', code: 'INTERNAL' },
  }
}
