import { useEffect } from 'react'
import { useTenantHost } from '../contexts/TenantHostContext'
import {
  bindAuthSessionToHostSlug,
  isAuthSessionHostSlugMismatch,
} from '../lib/auth/tenantSessionBinding'
import type { AuthPortalScope } from '../lib/auth/sessionRevocation'

type TenantHostAuthGuardScope = Extract<AuthPortalScope, 'prefeitura' | 'ubt'>

/** Encerra sessão se o subdomínio atual não corresponde ao tenant do login. */
export function useTenantHostAuthGuard(
  scope: TenantHostAuthGuardScope,
  options: {
    isAuthenticated: boolean
    onForceLogout: () => void | Promise<void>
  },
): void {
  const { slug } = useTenantHost()
  const { isAuthenticated, onForceLogout } = options

  useEffect(() => {
    if (!isAuthenticated || !slug) return

    if (isAuthSessionHostSlugMismatch(scope)) {
      void onForceLogout()
      return
    }

    bindAuthSessionToHostSlug(scope, slug)
  }, [scope, slug, isAuthenticated, onForceLogout])
}
