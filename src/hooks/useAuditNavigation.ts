import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { isBackendApiEnabled } from '../lib/api/config'
import { sendAdminAuditoriaClientEvent } from '../lib/services/admin/auditoria'
import { sendPortalAuditoriaClientEvent } from '../lib/services/portal/auditoria'

type AuditNavigationScope = 'admin' | 'prefeitura' | 'ubt' | 'profissional'

type UseAuditNavigationOptions = {
  scope: AuditNavigationScope
  enabled?: boolean
  getAccessToken: () => string | null
}

export function useAuditNavigation({
  scope,
  enabled = true,
  getAccessToken,
}: UseAuditNavigationOptions) {
  const location = useLocation()
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !isBackendApiEnabled()) return

    const pagePath = `${location.pathname}${location.search}`
    if (lastPathRef.current === pagePath) return
    lastPathRef.current = pagePath

    const token = getAccessToken()
    if (!token) return

    const moduleName = location.pathname.split('/').filter(Boolean)[1] ?? 'app'
    const actionLabel =
      pagePath.length > 200 ? `Acesso à página ${pagePath.slice(0, 200)}…` : `Acesso à página ${pagePath}`
    const payload = {
      pagePath: pagePath.slice(0, 240),
      actionLabel,
      moduleName: moduleName.slice(0, 120),
      resourceLabel: pagePath.slice(0, 240),
    }

    void (async () => {
      try {
        if (scope === 'admin') {
          await sendAdminAuditoriaClientEvent(token, payload)
          return
        }
        await sendPortalAuditoriaClientEvent(scope, token, payload)
      } catch {
        // auditoria de navegação não deve bloquear a UI
      }
    })()
  }, [enabled, getAccessToken, location.pathname, location.search, scope])
}
