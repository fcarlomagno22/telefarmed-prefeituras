import { PLANTAO_ACEITE_EMAIL_DEFAULTS } from '../lib/email/plantaoAceiteEmailConstants.js'
import { resolvePublicAppUrl } from '../lib/codigoVerificacaoDocumento.js'

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

export const appPublicUrls = {
  plantaoAceiteUrl(token: string): string {
    const base = resolvePublicAppUrl()
    return `${base}/plantao/aceitar/${encodeURIComponent(token)}`
  },

  plantaoAceiteDigestUrl(token: string): string {
    const base = resolvePublicAppUrl()
    return `${base}/plantao/disponiveis/${encodeURIComponent(token)}`
  },

  profissionalAgendaUrl(): string {
    const explicit = process.env.PROFISSIONAL_PORTAL_URL?.trim()
    if (explicit) return `${trimTrailingSlash(explicit)}/escala`
    return PLANTAO_ACEITE_EMAIL_DEFAULTS.link_escala
  },

  profissionalEscalaUrl(): string {
    const explicit = process.env.PROFISSIONAL_PORTAL_URL?.trim()
    if (explicit) return trimTrailingSlash(explicit)
    return trimTrailingSlash(PLANTAO_ACEITE_EMAIL_DEFAULTS.link_escala).replace(/\/escala$/, '')
  },
}
