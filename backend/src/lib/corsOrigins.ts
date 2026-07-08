import { env } from '../config/env.js'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** https://vd.telefarmed.com.br ou https://vd-{slug}.telefarmed.com.br */
export function isVdAppProductionOrigin(origin: string): boolean {
  const root = escapeRegExp(env.PUBLIC_ROOT_DOMAIN)
  return new RegExp(`^https://vd(-[^.]+)?\\.${root}$`, 'i').test(origin)
}

/** http://vd.localhost:8081 ou http://vd-{slug}.localhost:8081 */
export function isVdAppDevOrigin(origin: string): boolean {
  if (/^http:\/\/vd(-[^.]+)?\.localhost(?::\d+)?$/i.test(origin)) return true
  // Expo web local costuma rodar em localhost:8081 sem subdomínio vd-*.
  if (env.NODE_ENV === 'development' && isExpoWebLocalOrigin(origin)) return true
  return false
}

/** http://localhost:8081 ou http://127.0.0.1:19006 (Expo web / Metro). */
export function isExpoWebLocalOrigin(origin: string): boolean {
  return /^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)
}

function isTenantDevOrigin(origin: string): boolean {
  return /^http:\/\/[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?\.localhost(?::\d+)?$/i.test(origin)
}

function isTenantProductionOrigin(origin: string): boolean {
  const root = escapeRegExp(env.PUBLIC_ROOT_DOMAIN)
  return new RegExp(`^https://[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?\\.${root}$`, 'i').test(
    origin,
  )
}

export function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true

  const allowed = env.CORS_ORIGIN.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (allowed.includes(origin)) return true

  if (isVdAppProductionOrigin(origin)) return true

  if (!env.CORS_ALLOW_TENANT_ORIGINS) return false

  if (isVdAppDevOrigin(origin)) return true

  return isTenantDevOrigin(origin) || isTenantProductionOrigin(origin)
}

export function resolveCorsOrigin(
  origin: string | undefined,
  callback: (error: Error | null, allow: boolean) => void,
) {
  if (isCorsOriginAllowed(origin)) {
    callback(null, true)
    return
  }
  callback(new Error('Origin not allowed by CORS'), false)
}
