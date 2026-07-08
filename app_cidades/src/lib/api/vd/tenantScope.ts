import { resolveVdTenantHostHeader, resolveVdTenantSlug } from '../../../config/tenantHost'
import type { VdTenantScope } from '../../../types/vdApi'

export {
  buildTenantHeaders,
  mergeTenantIntoBody,
  mergeTenantIntoQuery,
} from './tenantScopeMerge'

let runtimeTenantScope: VdTenantScope | null = null

/** Sincroniza escopo após GET /vd/tenant (slug canônico da entidade). */
export function setVdApiTenantScope(scope: VdTenantScope | null): void {
  runtimeTenantScope = scope
}

export function getVdTenantScope(): VdTenantScope {
  if (runtimeTenantScope) {
    return { ...runtimeTenantScope }
  }

  const slug = resolveVdTenantSlug()
  const host = resolveVdTenantHostHeader()

  return {
    ...(slug ? { slug } : {}),
    ...(host ? { host } : {}),
  }
}
