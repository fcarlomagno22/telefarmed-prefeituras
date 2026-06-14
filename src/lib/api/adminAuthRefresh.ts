let refreshAccessToken: (() => Promise<string | null>) | null = null

export function registerAdminAccessTokenRefresh(fn: () => Promise<string | null>): void {
  refreshAccessToken = fn
}

export async function tryRefreshAdminAccessToken(): Promise<string | null> {
  if (!refreshAccessToken) return null
  try {
    return await refreshAccessToken()
  } catch {
    return null
  }
}
