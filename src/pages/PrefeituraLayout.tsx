import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { brand } from '../config/brand'
import { prefeituraSidebarSections } from '../config/prefeituraSidebarNav'
import { portals } from '../config/portals'
import {
  PrefeituraNotificacoesProvider,
  usePrefeituraGestorUnreadInbox,
} from '../contexts/PrefeituraNotificacoesContext'
import { useBrandTheme } from '../hooks/useBrandTheme'

const PREFEITURA_NOTIFICACOES_PATH = '/prefeitura/notificacoes'

function PrefeituraLayoutShell() {
  const hasGestorUnreadInbox = usePrefeituraGestorUnreadInbox()

  const sidebarSections = useMemo(
    () =>
      prefeituraSidebarSections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.to === PREFEITURA_NOTIFICACOES_PATH
            ? { ...item, showAlertDot: hasGestorUnreadInbox }
            : item,
        ),
      })),
    [hasGestorUnreadInbox],
  )

  return (
    <DashboardLayout
      sidebarSections={sidebarSections}
      logoutPath={portals.prefeitura.loginPath}
      footer={{
        label: brand.prefeituraOperatorFooterLabel,
        name: brand.prefeituraOperatorName,
        role: brand.prefeituraOperatorRole,
      }}
    >
      <Outlet />
    </DashboardLayout>
  )
}

export function PrefeituraLayout() {
  useBrandTheme()

  return (
    <PrefeituraNotificacoesProvider>
      <PrefeituraLayoutShell />
    </PrefeituraNotificacoesProvider>
  )
}
