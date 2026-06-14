import { useEffect, useRef } from 'react'
import type { AuthPortalScope } from '../lib/auth/sessionRevocation'
import { registerUnauthorizedHandler } from '../lib/auth/sessionRevocation'
import { shouldRefreshAccessToken } from '../lib/auth/jwtExpiry'

type UseAuthSessionGuardOptions = {
  scope: AuthPortalScope
  isAuthenticated: boolean
  accessToken: string | null
  onForceLogout: () => void | Promise<void>
  revalidateSession: () => Promise<void>
  refreshAccessToken?: () => Promise<string>
}

const FOCUS_DEBOUNCE_MS = 500

/** Registra handler de 401 e renova sessão só quando o access token está perto de expirar. */
export function useAuthSessionGuard({
  scope,
  isAuthenticated,
  accessToken,
  onForceLogout,
  revalidateSession,
  refreshAccessToken,
}: UseAuthSessionGuardOptions): void {
  const accessTokenRef = useRef(accessToken)
  accessTokenRef.current = accessToken

  useEffect(() => {
    return registerUnauthorizedHandler(scope, () => {
      void onForceLogout()
    })
  }, [scope, onForceLogout])

  useEffect(() => {
    if (!isAuthenticated) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const maybeRevalidate = () => {
      if (!shouldRefreshAccessToken(accessTokenRef.current)) return
      void revalidateSession().catch(() => {
        // revalidateSession chama notifyUnauthorizedSession internamente
      })
    }

    const scheduleRevalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        maybeRevalidate()
      }, FOCUS_DEBOUNCE_MS)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduleRevalidate()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [isAuthenticated, revalidateSession])

  useEffect(() => {
    if (!isAuthenticated || !refreshAccessToken) return

    const intervalMs = 60 * 1000
    const id = window.setInterval(() => {
      if (!shouldRefreshAccessToken(accessTokenRef.current)) return
      void refreshAccessToken().catch(() => {
        void revalidateSession().catch(() => {})
      })
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [isAuthenticated, refreshAccessToken, revalidateSession])
}
