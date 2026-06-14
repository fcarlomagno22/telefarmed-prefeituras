import { randomBytes } from 'node:crypto'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Código curto para verificação pública de documentos clínicos (12 chars). */
export function generateCodigoVerificacaoDocumento(length = 12): string {
  const safeLength = Math.min(24, Math.max(10, length))
  const bytes = randomBytes(safeLength)
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join('')
}

export function buildDocumentoVerificacaoUrl(codigoVerificacao: string): string {
  const base = resolvePublicAppUrl()
  return `${base}/verificar/${encodeURIComponent(codigoVerificacao)}`
}

export function resolvePublicAppUrl(): string {
  const explicit = process.env.PUBLIC_APP_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const cors = process.env.CORS_ORIGIN?.split(',')[0]?.trim()
  if (cors) return cors.replace(/\/$/, '')

  return 'http://localhost:5173'
}
