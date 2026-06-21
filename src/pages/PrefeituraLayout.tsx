import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PortalCatalogPrefetch } from '../components/query/PortalCatalogPrefetch'
import { PrefeituraPagePermissionGuard } from '../components/auth/PrefeituraPagePermissionGuard'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { brand } from '../config/brand'
import { filterPrefeituraSidebarSections, resolvePrefeituraPageIdFromPath } from '../config/prefeituraPageAccess'
import { getPrefeituraSidebarSections } from '../config/prefeituraSidebarNav'
import { portals } from '../config/portals'
import {
  PrefeituraNotificacoesProvider,
  usePrefeituraGestorUnreadInbox,
} from '../contexts/PrefeituraNotificacoesContext'
import { PrefeituraSuporteProvider, usePrefeituraSuporteAwaitingCount } from '../contexts/PrefeituraSuporteContext'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { useEntidadeBrandTheme } from '../hooks/useEntidadeBrandTheme'
import { useAuditNavigation } from '../hooks/useAuditNavigation'

function PrefeituraLayoutShell() {
  const navigate = useNavigate()
  const { user, logout, getAccessToken } = usePrefeituraAuth()
  const hasGestorUnreadInbox = usePrefeituraGestorUnreadInbox()
  const awaitingSuporteCount = usePrefeituraSuporteAwaitingCount()
  useAuditNavigation({ scope: 'prefeitura', getAccessToken })

  const sidebarSections = useMemo(() => {
    const filtered = filterPrefeituraSidebarSections(user, getPrefeituraSidebarSections())
    return filtered.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        const pageId = resolvePrefeituraPageIdFromPath(item.to)
        if (pageId === 'notificacoes') {
          return { ...item, showAlertDot: hasGestorUnreadInbox }
        }
        if (pageId === 'suporte') {
          return { ...item, badgeCount: awaitingSuporteCount }
        }
        return item
      }),
    }))
  }, [awaitingSuporteCount, hasGestorUnreadInbox, user])

  async function handleLogout() {
    await logout()
    navigate(portals.prefeitura.loginPath, { replace: true })
  }

  return (
    <DashboardLayout
      sidebarSections={sidebarSections}
      sidebarLogoClassName="h-[35px] w-auto max-w-[150px] object-contain"
      logoutPath={portals.prefeitura.loginPath}
      onLogout={handleLogout}
      footer={{
        label: brand.prefeituraOperatorFooterLabel,
        name: user?.nome ?? brand.prefeituraOperatorName,
        role: user?.funcao?.trim() || user?.accessLevel || brand.prefeituraOperatorRole,
      }}
    >
      <PortalCatalogPrefetch portal="prefeitura" />
      <PrefeituraPagePermissionGuard />
    </DashboardLayout>
  )
}

export function PrefeituraLayout() {
  useEntidadeBrandTheme()

  return (
    <PrefeituraNotificacoesProvider>
      <PrefeituraSuporteProvider>
        <PrefeituraLayoutShell />
      </PrefeituraSuporteProvider>
    </PrefeituraNotificacoesProvider>
  )
}
