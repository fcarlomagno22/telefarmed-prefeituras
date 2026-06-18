import { env, isProduction } from '../../config/env.js'
import { resolvePublicAppUrl } from '../codigoVerificacaoDocumento.js'

function trimSlashes(path: string): string {
  if (!path || path === '/') return ''
  return path.startsWith('/') ? path : `/${path}`
}

function resolveDevTenantBaseUrl(slug: string): string | null {
  if (isProduction) return null
  try {
    const appUrl = new URL(resolvePublicAppUrl())
    const port = appUrl.port || '5173'
    return `http://${slug}.localhost:${port}`
  } catch {
    return `http://${slug}.localhost:5173`
  }
}

/** URL pública HTTPS do portal de gestão da entidade. */
export function gestaoPublicUrl(entidadeSlug: string, path = '/login'): string {
  return buildGestaoUrl(entidadeSlug, path)
}

/** URL pública HTTPS do terminal UBT. */
export function ubtPublicUrl(ubtSlug: string, path = '/login'): string {
  return buildUbtUrl(ubtSlug, path)
}

/** https://{entidadeSlug}.telefarmed.com.br{path} (dev: http://{slug}.localhost:5173) */
export function buildGestaoUrl(entidadeSlug: string, path = '/login'): string {
  const normalizedPath = trimSlashes(path) || '/login'
  const devBase = resolveDevTenantBaseUrl(entidadeSlug)
  if (devBase) return `${devBase}${normalizedPath}`
  return `https://${entidadeSlug}.${env.PUBLIC_ROOT_DOMAIN}${normalizedPath}`
}

/** https://{ubtSlug}.telefarmed.com.br{path} (dev: http://{slug}.localhost:5173) */
export function buildUbtUrl(ubtSlug: string, path = '/login'): string {
  const normalizedPath = trimSlashes(path) || '/login'
  const devBase = resolveDevTenantBaseUrl(ubtSlug)
  if (devBase) return `${devBase}${normalizedPath}`
  return `https://${ubtSlug}.${env.PUBLIC_ROOT_DOMAIN}${normalizedPath}`
}
