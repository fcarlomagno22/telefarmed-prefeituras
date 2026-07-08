import { useEffect, useRef } from 'react'
import { shouldRefreshAccessToken } from '../utils/jwtExpiry'
import { getVdAccessToken } from '../lib/vd/vdAccessToken'

type UseVdAuthSessionGuardOptions = {
  isAuthenticated: boolean
  refreshAccessToken: () => Promise<string>
}

const FOCUS_DEBOUNCE_MS = 500

/** Renova o access token antes de expirar (foco na aba + intervalo). */
export function useVdAuthSessionGuard({
  isAuthenticated,
  refreshAccessToken,
}: UseVdAuthSessionGuardOptions): void {
  const accessTokenRef = useRef(getVdAccessToken())
  accessTokenRef.current = getVdAccessToken()

  useEffect(() => {
    if (!isAuthenticated) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const maybeRefresh = () => {
      if (!shouldRefreshAccessToken(accessTokenRef.current)) return
      void refreshAccessToken().catch(() => {})
    }

    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        maybeRefresh()
      }, FOCUS_DEBOUNCE_MS)
    }

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        scheduleRefresh()
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }
  }, [isAuthenticated, refreshAccessToken])

  useEffect(() => {
    if (!isAuthenticated) return

    const intervalMs = 60 * 1000
    const id = setInterval(() => {
      accessTokenRef.current = getVdAccessToken()
      if (!shouldRefreshAccessToken(accessTokenRef.current)) return
      void refreshAccessToken().catch(() => {})
    }, intervalMs)

    return () => clearInterval(id)
  }, [isAuthenticated, refreshAccessToken])
}
