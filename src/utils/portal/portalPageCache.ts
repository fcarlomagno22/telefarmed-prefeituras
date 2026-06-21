/**
 * @deprecated Cache de sessão migrado para React Query (`src/lib/query`).
 * Mantido apenas para compatibilidade durante a transição.
 */
import { queryClient } from '../../lib/query/client'
import { clearPortalSessionQueries } from '../../lib/query/portalSession'

/** @deprecated */
export function readPortalPageCache<T>(_key: string): T | undefined {
  return undefined
}

/** @deprecated */
export function writePortalPageCache<T>(_key: string, _value: T): void {
  // no-op — dados persistidos via React Query
}

/** @deprecated */
export function hasPortalPageCache(_key: string): boolean {
  return false
}

/** @deprecated */
export function clearPortalPageCaches(_prefix?: string): void {
  queryClient.clear()
}

/** @deprecated Use `clearPortalSessionQueries(queryClient, 'profissional')`. */
export function clearProfissionalPortalPageCaches(): void {
  clearPortalSessionQueries(queryClient, 'profissional')
}
