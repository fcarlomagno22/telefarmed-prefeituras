import { env } from '../../config/env.js'
import { resolvePublicAppUrl } from '../codigoVerificacaoDocumento.js'
import { buildGestaoUrl } from '../tenant/publicUrls.js'

export function buildClinicalDocumentVerificationUrl(
  codigoVerificacao: string,
  entidadeSlug?: string,
): string {
  const path = `/verificar/${encodeURIComponent(codigoVerificacao)}`
  if (entidadeSlug?.trim()) {
    return buildGestaoUrl(entidadeSlug.trim(), path)
  }

  const base = resolvePublicAppUrl().replace(/\/$/, '')
  return `${base}${path}`
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
    if (entidadeSlug?.trim()) {
      return `${entidadeSlug.trim()}.${env.PUBLIC_ROOT_DOMAIN}/verificar/${codigoVerificacao}`
    }
    return `/verificar/${codigoVerificacao}`
  }
}
