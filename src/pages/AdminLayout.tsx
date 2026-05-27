import { Outlet } from 'react-router-dom'
import { ADMIN_SIDEBAR_COLLAPSED_STORAGE_KEY } from '../components/layout/SidebarNavSectionGroup'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { brand } from '../config/brand'
import { adminSidebarSections } from '../config/adminSidebarNav'
import { portals } from '../config/portals'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function AdminLayout() {
  useBrandTheme()

  return (
    <DashboardLayout
      sidebarSections={adminSidebarSections}
      collapsedSectionsStorageKey={ADMIN_SIDEBAR_COLLAPSED_STORAGE_KEY}
      logoutPath={portals.admin.loginPath}
      footer={{
        label: brand.adminOperatorFooterLabel,
        name: brand.adminOperatorName,
        role: brand.adminOperatorRole,
      }}
    >
      <Outlet />
    </DashboardLayout>
  )
}
