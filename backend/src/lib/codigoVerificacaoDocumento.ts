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
  const lanFallback = process.env.PUBLIC_APP_LAN_URL?.trim()

  if (explicit) {
    const normalized = explicit.replace(/\/$/, '')
    if (isLocalhostUrl(normalized) && lanFallback) {
      return lanFallback.replace(/\/$/, '')
    }
    return normalized
  }

  const cors = process.env.CORS_ORIGIN?.split(',')[0]?.trim()
  if (cors) {
    const normalized = cors.replace(/\/$/, '')
    if (isLocalhostUrl(normalized) && lanFallback) {
      return lanFallback.replace(/\/$/, '')
    }
    return normalized
  }

  return lanFallback?.replace(/\/$/, '') ?? 'http://localhost:5173'
}

function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url)
  }
}

export function isPublicAppUrlLocalOnly(): boolean {
  return isLocalhostUrl(resolvePublicAppUrl())
}
