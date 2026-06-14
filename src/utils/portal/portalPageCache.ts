const store = new Map<string, unknown>()

export function readPortalPageCache<T>(key: string): T | undefined {
  return store.get(key) as T | undefined
}

export function writePortalPageCache<T>(key: string, value: T): void {
  store.set(key, value)
}

export function hasPortalPageCache(key: string): boolean {
  return store.has(key)
}

export function clearPortalPageCaches(prefix?: string): void {
  if (!prefix) {
    store.clear()
    return
  }

  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}

export function clearProfissionalPortalPageCaches(): void {
  clearPortalPageCaches('profissional:')
  clearPortalPageCaches('portal:suporte:profissional')
}
