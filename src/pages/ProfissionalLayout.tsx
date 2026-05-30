import { Outlet } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { brand } from '../config/brand'
import { portals } from '../config/portals'
import { profissionalSidebarItems } from '../config/profissionalSidebarNav'
import { ProfissionalNotificacoesProvider } from '../contexts/ProfissionalNotificacoesContext'
import { useBrandTheme } from '../hooks/useBrandTheme'

function ProfissionalLayoutShell() {
  return (
    <DashboardLayout
      sidebarItems={profissionalSidebarItems}
      logoutPath={portals.profissional.loginPath}
      footer={{
        label: brand.profissionalOperatorFooterLabel,
        name: brand.profissionalOperatorName,
        role: brand.profissionalOperatorRole,
      }}
    >
      <Outlet />
    </DashboardLayout>
  )
}

export function ProfissionalLayout() {
  useBrandTheme()

  return (
    <ProfissionalNotificacoesProvider>
      <ProfissionalLayoutShell />
    </ProfissionalNotificacoesProvider>
  )
}
