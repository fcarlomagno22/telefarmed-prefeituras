let refreshAccessToken: (() => Promise<string | null>) | null = null
let refreshInFlight: Promise<string | null> | null = null

export function registerVdAccessTokenRefresh(fn: () => Promise<string | null>): () => void {
  refreshAccessToken = fn
  return () => {
    if (refreshAccessToken === fn) {
      refreshAccessToken = null
    }
  }
}

export async function tryRefreshVdAccessToken(): Promise<string | null> {
  if (!refreshAccessToken) return null

  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = refreshAccessToken()
    .then((token) => token)
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null
    })

  return refreshInFlight
}
