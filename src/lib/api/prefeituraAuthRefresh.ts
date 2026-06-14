let refreshAccessToken: (() => Promise<string | null>) | null = null

export function registerPrefeituraAccessTokenRefresh(fn: () => Promise<string | null>): void {
  refreshAccessToken = fn
}

export async function tryRefreshPrefeituraAccessToken(): Promise<string | null> {
  if (!refreshAccessToken) return null
  try {
    return await refreshAccessToken()
  } catch {
    return null
  }
}
