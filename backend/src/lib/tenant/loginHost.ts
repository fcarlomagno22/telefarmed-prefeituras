import type { ResolvedTenant } from './types.js'
import { resolveTenantByHost } from './resolveTenantByHost.js'

export type GestaoTenant = ResolvedTenant & { kind: 'gestao'; entidadeId: string }

export function resolveTenantHostHeader(
  headers: {
    host?: string
    'x-forwarded-host'?: string | string[]
    'x-tenant-host'?: string | string[]
  },
  explicitHost?: string,
): string | undefined {
  if (explicitHost?.trim()) return explicitHost.trim()

  const tenantHost = headers['x-tenant-host']
  if (typeof tenantHost === 'string' && tenantHost.trim()) {
    return tenantHost.trim()
  }

  const forwardedHost = headers['x-forwarded-host']
  if (typeof forwardedHost === 'string' && forwardedHost.trim()) {
    return forwardedHost.split(',')[0]?.trim()
  }

  return headers.host?.trim() || undefined
}

export type UbtTenant = ResolvedTenant & { kind: 'ubt'; ubtId: string }

export class TenantHostMismatchError extends Error {
  constructor(
    readonly portal: 'gestao' | 'ubt',
    message: string,
  ) {
    super(message)
    this.name = 'TenantHostMismatchError'
  }
}

export async function resolveGestaoTenantFromHost(
  hostname: string | undefined,
): Promise<GestaoTenant | null> {
  if (!hostname) return null
  const tenant = await resolveTenantByHost(hostname)
  if (!tenant || tenant.kind !== 'gestao' || !tenant.entidadeId) return null
  return tenant as GestaoTenant
}

export async function resolveUbtTenantFromHost(
  hostname: string | undefined,
): Promise<UbtTenant | null> {
  if (!hostname) return null
  const tenant = await resolveTenantByHost(hostname)
  if (!tenant || tenant.kind !== 'ubt' || !tenant.ubtId) return null
  return tenant as UbtTenant
}

export async function assertGestaoSessionMatchesHost(
  entidadeContratanteId: string,
  hostname: string | undefined,
): Promise<void> {
  const gestaoTenant = await resolveGestaoTenantFromHost(hostname)
  if (gestaoTenant && gestaoTenant.entidadeId !== entidadeContratanteId) {
    throw new TenantHostMismatchError('gestao', 'Use o endereço da sua instituição.')
  }
}

export async function assertUbtSessionMatchesHost(
  unidadeUbtId: string,
  hostname: string | undefined,
): Promise<void> {
  const ubtTenant = await resolveUbtTenantFromHost(hostname)
  if (ubtTenant && ubtTenant.ubtId !== unidadeUbtId) {
    throw new TenantHostMismatchError('ubt', 'Use o endereço da sua unidade.')
  }
}
