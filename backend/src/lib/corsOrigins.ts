import { env } from '../config/env.js'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

  if (!env.CORS_ALLOW_TENANT_ORIGINS) return false

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
