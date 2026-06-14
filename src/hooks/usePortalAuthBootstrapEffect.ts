import { useEffect, useRef } from 'react'
import { isDefinitivePortalAuthError, isTransientPortalNetworkError } from '../lib/auth/portalAuthErrors'
import { runPortalAuthBootstrap } from '../lib/auth/portalSessionBootstrap'
import type { AuthPortalScope } from '../lib/auth/sessionRevocation'

type UsePortalAuthBootstrapEffectOptions<TUser> = {
  scope: AuthPortalScope
  readStoredAccessToken: () => string | null
  fetchMe: (token: string) => Promise<{ user: TUser }>
  refresh: () => Promise<{ accessToken: string; user: TUser }>
  isTransientError: (error: unknown) => boolean
  createError: (message: string, status: number) => Error
  applySession: (accessToken: string, user: TUser) => void
  clearSession: (options?: { markRevoked?: boolean }) => void
  setIsBootstrapping: (value: boolean) => void
}

export function usePortalAuthBootstrapEffect<TUser>(
  options: UsePortalAuthBootstrapEffectOptions<TUser>,
): void {
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    let cancelled = false
    const MAX_TRANSIENT_RETRIES = 8

    async function bootstrap(transientAttempt = 0): Promise<void> {
      const current = optionsRef.current

      try {
        const session = await runPortalAuthBootstrap({
          scope: current.scope,
          accessToken: current.readStoredAccessToken(),
          fetchMe: current.fetchMe,
          refresh: current.refresh,
          isTransientError: current.isTransientError,
          createError: current.createError,
        })
        if (cancelled) return
        current.applySession(session.accessToken, session.user)
        current.setIsBootstrapping(false)
      } catch (error) {
        if (cancelled) return

        if (isTransientPortalNetworkError(error) && transientAttempt < MAX_TRANSIENT_RETRIES) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200))
          if (!cancelled) await bootstrap(transientAttempt + 1)
          return
        }

        if (isDefinitivePortalAuthError(error)) {
          current.clearSession({ markRevoked: false })
        }
        current.setIsBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [options.scope])
}
