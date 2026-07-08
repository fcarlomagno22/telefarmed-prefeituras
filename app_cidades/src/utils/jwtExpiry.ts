/** Decodifica exp (segundos) de um JWT sem validar assinatura. */
export function readJwtExpiryMs(accessToken: string): number | null {
  try {
    const segment = accessToken.split('.')[1]
    if (!segment) return null
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalized)) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/** Renova só quando o access token está perto de expirar (padrão: 2 min). */
export function shouldRefreshAccessToken(
  accessToken: string | null | undefined,
  skewMs = 2 * 60 * 1000,
): boolean {
  if (!accessToken) return false
  const expiresAt = readJwtExpiryMs(accessToken)
  if (!expiresAt) return true
  return Date.now() >= expiresAt - skewMs
}
