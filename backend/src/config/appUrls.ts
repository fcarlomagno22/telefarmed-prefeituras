import { PLANTAO_ACEITE_EMAIL_DEFAULTS } from '../lib/email/plantaoAceiteEmailConstants.js'

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '::1'
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url)
  }
}

/** Base pública do portal profissional (e-mails de plantão e link da agenda). */
export function resolveProfissionalPortalBaseUrl(): string {
  const explicit = process.env.PROFISSIONAL_PORTAL_URL?.trim()
  if (explicit) return trimTrailingSlash(explicit)
  return trimTrailingSlash(PLANTAO_ACEITE_EMAIL_DEFAULTS.link_escala).replace(/\/escala$/, '')
}

export function isProfissionalPortalUrlLocalOnly(): boolean {
  return isLocalhostUrl(resolveProfissionalPortalBaseUrl())
}

export const appPublicUrls = {
  plantaoAceiteUrl(token: string): string {
    const base = resolveProfissionalPortalBaseUrl()
    return `${base}/plantao/aceitar/${encodeURIComponent(token)}`
  },

  plantaoAceiteDigestUrl(token: string): string {
    const base = resolveProfissionalPortalBaseUrl()
    return `${base}/plantao/disponiveis/${encodeURIComponent(token)}`
  },

  profissionalAgendaUrl(): string {
    return `${resolveProfissionalPortalBaseUrl()}/escala`
  },

  profissionalEscalaUrl(): string {
    return resolveProfissionalPortalBaseUrl()
  },
}
