import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminPagePermissionGuard } from '../components/auth/AdminPagePermissionGuard'
import { ADMIN_SIDEBAR_COLLAPSED_STORAGE_KEY } from '../components/layout/SidebarNavSectionGroup'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { brand } from '../config/brand'
import { filterAdminSidebarSections } from '../config/adminPageAccess'
import { adminSidebarSections } from '../config/adminSidebarNav'
import { portals } from '../config/portals'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function AdminLayout() {
  useBrandTheme()
  const navigate = useNavigate()
  const { user, logout } = useAdminAuth()
  const sidebarSections = useMemo(
    () => filterAdminSidebarSections(user, adminSidebarSections),
    [user],
  )

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
      <AdminPagePermissionGuard />
    </DashboardLayout>
  )
}
