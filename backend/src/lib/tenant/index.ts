export {
  resolveTenantByHost,
  resolveTenantBySlug,
  resolveVdTenantByHost,
  resolveVdTenantByEntitySlug,
  extractSubdomainFromHostname,
  extractTenantSlugFromHostname,
  isPlatformTenantHost,
  PLATFORM_TENANT_HOST_SLUGS,
  extractAppCidadesClientSlug,
  isAppCidadesDedicatedHost,
  normalizeVdTenantEntitySlugInput,
} from './resolveTenantByHost.js'
export type { ResolvedTenant, TenantBranding, TenantKind } from './types.js'
export {
  buildGestaoUrl,
  buildUbtUrl,
  buildVdUrl,
  gestaoPublicUrl,
  ubtPublicUrl,
  vdPublicUrl,
} from './publicUrls.js'
export { resolveGestaoUrlForEntidade, resolveUbtUrlForUnidade, resolveVdUrlForEntidade } from './transactionalUrls.js'
export { checkTenantSlugAvailability } from './slugAvailability.js'
export type { SlugAvailabilityResult } from './slugAvailability.js'
export { tenantSlugZodSchema } from './slugSchema.js'
export {
  assertGestaoSessionMatchesHost,
  assertUbtSessionMatchesHost,
  resolveGestaoTenantFromHost,
  resolveTenantHostHeader,
  resolveUbtTenantFromHost,
  TenantHostMismatchError,
} from './loginHost.js'
export { normalizeTenantSlugInput, validateTenantSlug, RESERVED_TENANT_SLUGS } from './slug.js'
