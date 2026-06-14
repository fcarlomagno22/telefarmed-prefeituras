let refreshAccessToken: (() => Promise<string | null>) | null = null

export function registerProfissionalAccessTokenRefresh(fn: () => Promise<string | null>): void {
  refreshAccessToken = fn
}

export async function tryRefreshProfissionalAccessToken(): Promise<string | null> {
  if (!refreshAccessToken) return null
  try {
    return await refreshAccessToken()
  } catch {
    return null
  }
}
