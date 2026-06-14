import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AdminPagePermissionGuard } from '../components/auth/AdminPagePermissionGuard'
import { RouteErrorBoundary } from '../components/ui/RouteErrorBoundary'
import { ADMIN_SIDEBAR_COLLAPSED_STORAGE_KEY } from '../components/layout/SidebarNavSectionGroup'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { brand } from '../config/brand'
import { filterAdminSidebarSections } from '../config/adminPageAccess'
import { adminSidebarSections } from '../config/adminSidebarNav'
import { portals } from '../config/portals'
import { AdminSuporteBadgeProvider, useAdminSuporteAwaitingCount } from '../contexts/AdminSuporteBadgeContext'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useAuditNavigation } from '../hooks/useAuditNavigation'

const ADMIN_SUPORTE_PATH = '/admin/suporte'

function AdminLayoutShell() {
  useBrandTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, getAccessToken } = useAdminAuth()
  const awaitingSuporteCount = useAdminSuporteAwaitingCount()
  useAuditNavigation({ scope: 'admin', getAccessToken })
  const sidebarSections = useMemo(() => {
    const filtered = filterAdminSidebarSections(user, adminSidebarSections)
    return filtered.map((section) => ({
      ...section,
      items: section.items.map((item) =>
        item.to === ADMIN_SUPORTE_PATH
          ? { ...item, badgeCount: awaitingSuporteCount }
          : item,
      ),
    }))
  }, [awaitingSuporteCount, user])

  async function handleLogout() {
    await logout()
    navigate(portals.admin.loginPath, { replace: true })
  }

  return (
    <DashboardLayout
      sidebarSections={sidebarSections}
      collapsedSectionsStorageKey={ADMIN_SIDEBAR_COLLAPSED_STORAGE_KEY}
      logoutPath={portals.admin.loginPath}
      onLogout={handleLogout}
      footer={{
        label: brand.adminOperatorFooterLabel,
        name: user?.nome ?? brand.adminOperatorName,
        role:
          user?.isMaster === true
            ? 'Master · acesso total'
            : user
              ? `${user.accessLevel} · ${user.departmentId}`
              : brand.adminOperatorRole,
      }}
    >
      <RouteErrorBoundary key={location.pathname} title="Erro no painel admin">
        <AdminPagePermissionGuard />
      </RouteErrorBoundary>
    </DashboardLayout>
  )
}

export function AdminLayout() {
  return (
    <AdminSuporteBadgeProvider>
      <AdminLayoutShell />
    </AdminSuporteBadgeProvider>
  )
}
