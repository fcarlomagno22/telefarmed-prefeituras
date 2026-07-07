import { Outlet, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { RouteErrorBoundary } from '../components/ui/RouteErrorBoundary'
import { crmPartnersBrand, crmPartnersRoutes } from '../config/crmPartnersRoutes'
import { crmPartnersSidebarItems } from '../config/crmPartnersSidebarNav'
import { useCrmPartnersAuth } from '../contexts/CrmPartnersAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'

export const CRM_PARTNERS_SIDEBAR_COLLAPSED_STORAGE_KEY = 'crm-partners-sidebar-collapsed-v1'

export function CrmPartnersLayout() {
  useBrandTheme()
  const navigate = useNavigate()
  const { user, logout } = useCrmPartnersAuth()

  async function handleLogout() {
    await logout()
    navigate(crmPartnersRoutes.login, { replace: true })
  }

  return (
    <DashboardLayout
      sidebarItems={crmPartnersSidebarItems}
      collapsedSectionsStorageKey={CRM_PARTNERS_SIDEBAR_COLLAPSED_STORAGE_KEY}
      logoutPath={crmPartnersRoutes.login}
      onLogout={handleLogout}
      sidebarLogoClassName="h-[35px] w-auto max-w-[150px] object-contain"
      footer={{
        label: crmPartnersBrand.operatorFooterLabel,
        name: user?.nome ?? crmPartnersBrand.operatorName,
        role: crmPartnersBrand.operatorRole,
      }}
    >
      <RouteErrorBoundary title="Erro no painel de parceiros">
        <Outlet />
      </RouteErrorBoundary>
    </DashboardLayout>
  )
}
