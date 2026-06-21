export type AuthPortalScope = 'admin' | 'ubt' | 'prefeitura' | 'profissional'

type CacheEntry = {
  expiresAt: number
  value: unknown
}

const AUTH_SESSION_TTL_MS = 90 * 1000
const MAX_ENTRIES = 2000

const store = new Map<string, CacheEntry>()

function cacheKey(portal: AuthPortalScope, userId: string): string {
  return `${portal}:${userId}`
}

function evictIfNeeded(): void {
  if (store.size < MAX_ENTRIES) return
  const oldestKey = store.keys().next().value
  if (oldestKey !== undefined) store.delete(oldestKey)
}

export async function getCachedAuthSession<T>(
  portal: AuthPortalScope,
  userId: string,
  loader: () => Promise<T>,
): Promise<T> {
  const key = cacheKey(portal, userId)
  const now = Date.now()
  const cached = store.get(key)

  if (cached && cached.expiresAt > now) {
    return cached.value as T
  }

  const value = await loader()
  evictIfNeeded()
  store.set(key, { value, expiresAt: now + AUTH_SESSION_TTL_MS })
  return value
}

export function invalidateAuthSessionCache(portal: AuthPortalScope, userId: string): void {
  store.delete(cacheKey(portal, userId))
}

export function clearAuthSessionCache(): void {
  store.clear()
}
