import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PortalCatalogPrefetch } from '../components/query/PortalCatalogPrefetch'
import { ProfissionalPagePermissionGuard } from '../components/auth/ProfissionalPagePermissionGuard'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { brand } from '../config/brand'
import { filterProfissionalSidebarItems } from '../config/profissionalPageAccess'
import { profissionalSidebarItems } from '../config/profissionalSidebarNav'
import { profissionalRoutes } from '../config/profissionalRoutes'
import { portals } from '../config/portals'
import { ProfissionalNotificacoesProvider } from '../contexts/ProfissionalNotificacoesContext'
import {
  ProfissionalSuporteProvider,
  useProfissionalSuporteUnreadCount,
} from '../contexts/ProfissionalSuporteContext'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useAuditNavigation } from '../hooks/useAuditNavigation'

function ProfissionalLayoutShell() {
  const navigate = useNavigate()
  const { user, logout, getAccessToken } = useProfissionalAuth()
  const unreadSuporteCount = useProfissionalSuporteUnreadCount()
  useAuditNavigation({ scope: 'profissional', getAccessToken })

  const sidebarItems = useMemo(
    () =>
      filterProfissionalSidebarItems(user, profissionalSidebarItems).map((item) =>
        item.to === profissionalRoutes.suporte
          ? {
              ...item,
              badgeCount: unreadSuporteCount,
              badgeDescription: 'mensagens não lidas da Telefarmed',
            }
          : item,
      ),
    [unreadSuporteCount, user],
  )

  async function handleLogout() {
    await logout()
    navigate(portals.profissional.loginPath, { replace: true })
  }

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      logoutPath={portals.profissional.loginPath}
      onLogout={handleLogout}
      footer={{
        label: brand.profissionalOperatorFooterLabel,
        name: user?.nome ?? brand.profissionalOperatorName,
        role: user?.specialty?.trim() || brand.profissionalOperatorRole,
      }}
    >
      <ProfissionalPagePermissionGuard />
    </DashboardLayout>
  )
}

export function ProfissionalLayout() {
  useBrandTheme()

  return (
    <ProfissionalNotificacoesProvider>
      <ProfissionalSuporteProvider>
        <PortalCatalogPrefetch portal="profissional" />
        <ProfissionalLayoutShell />
      </ProfissionalSuporteProvider>
    </ProfissionalNotificacoesProvider>
  )
}
