import { extractTenantSlugFromHostname } from '../../config/tenantHost'
import { buildGestaoUrl } from '../../config/tenantHost'

const ROOT_DOMAIN =
  (import.meta.env.VITE_PUBLIC_ROOT_DOMAIN as string | undefined)?.trim() || 'telefarmed.com.br'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCodigoVerificacaoDocumento(length = 12): string {
  const safeLength = Math.min(24, Math.max(10, length))
  const bytes = new Uint8Array(safeLength)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join('')
}

export function resolveClinicalDocumentEntidadeSlug(explicitSlug?: string): string | undefined {
  const trimmed = explicitSlug?.trim()
  if (trimmed) return trimmed
  if (typeof window === 'undefined') return undefined
  return extractTenantSlugFromHostname(window.location.hostname) ?? undefined
}

export function buildDocumentoVerificacaoUrl(
  codigoVerificacao: string,
  entidadeSlug?: string,
): string {
  const path = `/verificar/${encodeURIComponent(codigoVerificacao)}`
  const slug = resolveClinicalDocumentEntidadeSlug(entidadeSlug)

  if (slug) {
    return buildGestaoUrl(slug, path)
  }

  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  return `${base.replace(/\/$/, '')}${path}`
}

export function formatClinicalDocumentVerificationLabel(
  verificationUrl: string,
  codigoVerificacao: string,
  entidadeSlug?: string,
): string {
  try {
    const parsed = new URL(verificationUrl)
    return `${parsed.host}${parsed.pathname}`
  } catch {
    const slug = resolveClinicalDocumentEntidadeSlug(entidadeSlug)
    if (slug) {
      return `${slug}.${ROOT_DOMAIN}/verificar/${codigoVerificacao}`
    }
    return `/verificar/${codigoVerificacao}`
  }
}
