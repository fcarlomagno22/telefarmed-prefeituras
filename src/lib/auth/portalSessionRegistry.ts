import type { AuthPortalScope } from './sessionRevocation'

export type PortalSessionRefresher = {
  refreshAccessToken: () => Promise<string>
}

const refreshers = new Map<AuthPortalScope, PortalSessionRefresher>()
const refreshInFlight = new Map<AuthPortalScope, Promise<string>>()

export function registerPortalSessionRefresher(
  scope: AuthPortalScope,
  refresher: PortalSessionRefresher,
): () => void {
  refreshers.set(scope, refresher)
  return () => {
    if (refreshers.get(scope) === refresher) {
      refreshers.delete(scope)
    }
  }
}

export async function refreshPortalAccessToken(scope: AuthPortalScope): Promise<string> {
  const inFlight = refreshInFlight.get(scope)
  if (inFlight) return inFlight

  const refresher = refreshers.get(scope)
  if (!refresher) {
    throw new Error(`Nenhum refresher de sessão registrado para ${scope}.`)
  }

  const promise = refresher.refreshAccessToken()
  refreshInFlight.set(scope, promise)

  try {
    return await promise
  } finally {
    refreshInFlight.delete(scope)
  }
}
