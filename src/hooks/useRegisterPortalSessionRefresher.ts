import { useEffect } from 'react'
import { registerPortalSessionRefresher } from '../lib/auth/portalSessionRegistry'
import type { AuthPortalScope } from '../lib/auth/sessionRevocation'

type UseRegisterPortalSessionRefresherOptions = {
  scope: AuthPortalScope
  isAuthenticated: boolean
  refreshAccessToken: () => Promise<string>
}

export function useRegisterPortalSessionRefresher({
  scope,
  isAuthenticated,
  refreshAccessToken,
}: UseRegisterPortalSessionRefresherOptions): void {
  useEffect(() => {
    if (!isAuthenticated) return

    return registerPortalSessionRefresher(scope, { refreshAccessToken })
  }, [scope, isAuthenticated, refreshAccessToken])
}
