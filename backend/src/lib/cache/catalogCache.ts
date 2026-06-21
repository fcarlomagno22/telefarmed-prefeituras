export type CatalogCacheNamespace =
  | 'clinico'
  | 'contratos'
  | 'consulta'
  | 'legal'
  | 'tenant'
  | 'rede-units'
  | 'ubt-specialties'

type CacheEntry = {
  expiresAt: number
  value: unknown
}

const DEFAULT_TTL_MS: Record<CatalogCacheNamespace, number> = {
  clinico: 5 * 60 * 1000,
  contratos: 5 * 60 * 1000,
  consulta: 5 * 60 * 1000,
  legal: 5 * 60 * 1000,
  tenant: 5 * 60 * 1000,
  'rede-units': 2 * 60 * 1000,
  'ubt-specialties': 2 * 60 * 1000,
}

const MAX_ENTRIES_PER_NAMESPACE = 500

const stores = new Map<CatalogCacheNamespace, Map<string, CacheEntry>>()

function getStore(namespace: CatalogCacheNamespace): Map<string, CacheEntry> {
  let store = stores.get(namespace)
  if (!store) {
    store = new Map()
    stores.set(namespace, store)
  }
  return store
}

function evictIfNeeded(store: Map<string, CacheEntry>): void {
  if (store.size < MAX_ENTRIES_PER_NAMESPACE) return
  const oldestKey = store.keys().next().value
  if (oldestKey !== undefined) store.delete(oldestKey)
}

export async function withCatalogCache<T>(
  namespace: CatalogCacheNamespace,
  key: string,
  loader: () => Promise<T>,
  ttlMs?: number,
): Promise<T> {
  const store = getStore(namespace)
  const now = Date.now()
  const cached = store.get(key)

  if (cached && cached.expiresAt > now) {
    return cached.value as T
  }

  const value = await loader()

  if (value !== null && value !== undefined) {
    evictIfNeeded(store)
    store.set(key, {
      value,
      expiresAt: now + (ttlMs ?? DEFAULT_TTL_MS[namespace]),
    })
  }

  return value
}

export function clearCatalogCache(namespace?: CatalogCacheNamespace): void {
  if (namespace) {
    stores.get(namespace)?.clear()
    return
  }
  stores.clear()
}

export function clearCatalogCacheKey(namespace: CatalogCacheNamespace, key: string): void {
  stores.get(namespace)?.delete(key)
}

export function clearCatalogCacheKeysWithPrefix(
  namespace: CatalogCacheNamespace,
  keyPrefix: string,
): void {
  const store = stores.get(namespace)
  if (!store) return

  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) {
      store.delete(key)
    }
  }
}

export function clearRedeUnitsCacheForEntidade(entidadeId: string): void {
  clearCatalogCacheKey('rede-units', entidadeId)
  clearCatalogCacheKey('rede-units', `ubt-options:${entidadeId}`)
}

export function clearUbtSpecialtiesCacheForEntidade(entidadeId: string): void {
  clearCatalogCacheKeysWithPrefix('ubt-specialties', `${entidadeId}:`)
}

export function invalidateClinicoCatalogCache(): void {
  clearCatalogCache('clinico')
  clearCatalogCache('ubt-specialties')
}

export function invalidateContratosCatalogCache(): void {
  clearCatalogCache('contratos')
  clearCatalogCache('ubt-specialties')
}

export function invalidateConsultaCatalogCache(): void {
  clearCatalogCache('consulta')
}

export function invalidateLegalCatalogCache(): void {
  clearCatalogCache('legal')
}

export function invalidateTenantCatalogCache(): void {
  clearCatalogCache('tenant')
}

export function invalidateRedeUnitsForEntidade(entidadeId: string): void {
  clearRedeUnitsCacheForEntidade(entidadeId)
  clearUbtSpecialtiesCacheForEntidade(entidadeId)
  invalidateTenantCatalogCache()
}
