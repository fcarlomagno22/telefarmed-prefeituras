import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrefeituraPagePermissionGuard } from '../components/auth/PrefeituraPagePermissionGuard'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { brand } from '../config/brand'
import { filterPrefeituraSidebarSections } from '../config/prefeituraPageAccess'
import { prefeituraSidebarSections } from '../config/prefeituraSidebarNav'
import { portals } from '../config/portals'
import {
  PrefeituraNotificacoesProvider,
  usePrefeituraGestorUnreadInbox,
} from '../contexts/PrefeituraNotificacoesContext'
import { PrefeituraSuporteProvider, usePrefeituraSuporteAwaitingCount } from '../contexts/PrefeituraSuporteContext'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useAuditNavigation } from '../hooks/useAuditNavigation'

const PREFEITURA_NOTIFICACOES_PATH = '/prefeitura/notificacoes'
const PREFEITURA_SUPORTE_PATH = '/prefeitura/suporte'

function PrefeituraLayoutShell() {
  const navigate = useNavigate()
  const { user, logout, getAccessToken } = usePrefeituraAuth()
  const hasGestorUnreadInbox = usePrefeituraGestorUnreadInbox()
  const awaitingSuporteCount = usePrefeituraSuporteAwaitingCount()
  useAuditNavigation({ scope: 'prefeitura', getAccessToken })

  const sidebarSections = useMemo(() => {
    const filtered = filterPrefeituraSidebarSections(user, prefeituraSidebarSections)
    return filtered.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.to === PREFEITURA_NOTIFICACOES_PATH) {
          return { ...item, showAlertDot: hasGestorUnreadInbox }
        }
        if (item.to === PREFEITURA_SUPORTE_PATH) {
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
      logoutPath={portals.prefeitura.loginPath}
      onLogout={handleLogout}
      footer={{
        label: brand.prefeituraOperatorFooterLabel,
        name: user?.nome ?? brand.prefeituraOperatorName,
        role: user?.funcao?.trim() || user?.accessLevel || brand.prefeituraOperatorRole,
      }}
    >
      <PrefeituraPagePermissionGuard />
    </DashboardLayout>
  )
}

export function PrefeituraLayout() {
  useBrandTheme()

  return (
    <PrefeituraNotificacoesProvider>
      <PrefeituraSuporteProvider>
        <PrefeituraLayoutShell />
      </PrefeituraSuporteProvider>
    </PrefeituraNotificacoesProvider>
  )
}
