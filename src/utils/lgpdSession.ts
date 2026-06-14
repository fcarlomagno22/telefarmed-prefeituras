const LGPD_SESSION_KEY = 'ubt-lgpd-unlock'

export type LgpdSession = {
  token: string
  expiresAt: string
  operatorId: string
}

export function readLgpdSession(operatorId: string | null | undefined): LgpdSession | null {
  if (!operatorId) return null
  try {
    const raw = sessionStorage.getItem(LGPD_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LgpdSession
    if (parsed.operatorId !== operatorId) return null
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(LGPD_SESSION_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function readActiveLgpdUnlockToken(): string | null {
  try {
    const raw = sessionStorage.getItem(LGPD_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LgpdSession
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(LGPD_SESSION_KEY)
      return null
    }
    return parsed.token
  } catch {
    return null
  }
}

export function writeLgpdSession(session: LgpdSession) {
  sessionStorage.setItem(LGPD_SESSION_KEY, JSON.stringify(session))
}

export function clearLgpdSession() {
  sessionStorage.removeItem(LGPD_SESSION_KEY)
}

export function isLgpdSessionActive(operatorId: string | null | undefined): boolean {
  return readLgpdSession(operatorId) !== null
}
