type ReplyLike = { header: (name: string, value: string) => void }

/** Catálogos semi-estáticos públicos (clínico, legal, contratos, consulta). */
export const PUBLIC_CATALOG_MAX_AGE_SECONDS = 10 * 60
export const PUBLIC_CATALOG_STALE_WHILE_REVALIDATE_SECONDS = 15 * 60

/** Catálogos autenticados (admin clientes, exames). */
export const PRIVATE_CATALOG_MAX_AGE_SECONDS = PUBLIC_CATALOG_MAX_AGE_SECONDS
export const PRIVATE_CATALOG_STALE_WHILE_REVALIDATE_SECONDS =
  PUBLIC_CATALOG_STALE_WHILE_REVALIDATE_SECONDS

/** Tenant/branding (resolve por host). */
export const TENANT_MAX_AGE_SECONDS = 5 * 60
export const TENANT_S_MAXAGE_SECONDS = 5 * 60
export const TENANT_STALE_WHILE_REVALIDATE_SECONDS = 10 * 60

/** Unidades de rede / opções UBT derivadas. */
export const UNITS_MAX_AGE_SECONDS = 3 * 60
export const UNITS_STALE_WHILE_REVALIDATE_SECONDS = 5 * 60

/** Especialidades do dia (triagem / agenda por data). */
export const DAY_SPECIALTIES_MAX_AGE_SECONDS = 90
export const DAY_SPECIALTIES_STALE_WHILE_REVALIDATE_SECONDS = 120

/** Especialidades para agendamento (catálogo menos volátil que fila do dia). */
export const SCHEDULE_SPECIALTIES_MAX_AGE_SECONDS = 3 * 60
export const SCHEDULE_SPECIALTIES_STALE_WHILE_REVALIDATE_SECONDS = 5 * 60

export function setPublicCatalogCacheHeaders(reply: ReplyLike): void {
  reply.header(
    'Cache-Control',
    `public, max-age=${PUBLIC_CATALOG_MAX_AGE_SECONDS}, stale-while-revalidate=${PUBLIC_CATALOG_STALE_WHILE_REVALIDATE_SECONDS}`,
  )
}

export function setPrivateCatalogCacheHeaders(reply: ReplyLike): void {
  reply.header(
    'Cache-Control',
    `private, max-age=${PRIVATE_CATALOG_MAX_AGE_SECONDS}, stale-while-revalidate=${PRIVATE_CATALOG_STALE_WHILE_REVALIDATE_SECONDS}`,
  )
}

export function setTenantCacheHeaders(reply: ReplyLike): void {
  reply.header(
    'Cache-Control',
    `public, max-age=${TENANT_MAX_AGE_SECONDS}, s-maxage=${TENANT_S_MAXAGE_SECONDS}, stale-while-revalidate=${TENANT_STALE_WHILE_REVALIDATE_SECONDS}`,
  )
}

export function setUnitsCacheHeaders(reply: ReplyLike): void {
  reply.header(
    'Cache-Control',
    `private, max-age=${UNITS_MAX_AGE_SECONDS}, stale-while-revalidate=${UNITS_STALE_WHILE_REVALIDATE_SECONDS}`,
  )
}

export function setDaySpecialtiesCacheHeaders(reply: ReplyLike): void {
  reply.header(
    'Cache-Control',
    `private, max-age=${DAY_SPECIALTIES_MAX_AGE_SECONDS}, stale-while-revalidate=${DAY_SPECIALTIES_STALE_WHILE_REVALIDATE_SECONDS}`,
  )
}

export function setScheduleSpecialtiesCacheHeaders(reply: ReplyLike): void {
  reply.header(
    'Cache-Control',
    `private, max-age=${SCHEDULE_SPECIALTIES_MAX_AGE_SECONDS}, stale-while-revalidate=${SCHEDULE_SPECIALTIES_STALE_WHILE_REVALIDATE_SECONDS}`,
  )
}

/** Respostas admin pós-mutação ou leitura que deve refletir alterações imediatas. */
export function setAdminCatalogNoCacheHeaders(reply: ReplyLike): void {
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate')
  reply.header('Pragma', 'no-cache')
}
