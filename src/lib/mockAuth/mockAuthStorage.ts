export function readMockSession<TUser>(keys: { token: string; user: string }): {
  accessToken: string | null
  user: TUser | null
} {
  try {
    const accessToken = sessionStorage.getItem(keys.token)
    const rawUser = sessionStorage.getItem(keys.user)
    if (!accessToken || !rawUser) {
      return { accessToken: null, user: null }
    }
    return { accessToken, user: JSON.parse(rawUser) as TUser }
  } catch {
    return { accessToken: null, user: null }
  }
}

export function writeMockSession<TUser>(
  keys: { token: string; user: string },
  accessToken: string | null,
  user: TUser | null,
): void {
  try {
    if (!accessToken || !user) {
      sessionStorage.removeItem(keys.token)
      sessionStorage.removeItem(keys.user)
      return
    }
    sessionStorage.setItem(keys.token, accessToken)
    sessionStorage.setItem(keys.user, JSON.stringify(user))
  } catch {
    // sessionStorage indisponível
  }
}

export function createMockAccessToken(scope: string, userId: string): string {
  return `mock.${scope}.${userId}.${Date.now()}`
}
