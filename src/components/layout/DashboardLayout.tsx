import { useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { brand } from '../../config/brand'
import { filterUbtSidebarItems } from '../../config/ubtPageAccess'
import { useOptionalUbtAuth } from '../../contexts/UbtAuthContext'
import { useUbtUnreadInbox } from '../../contexts/UbtNotificacoesContext'
import { useUbtSuporteAwaitingCount } from '../../contexts/UbtSuporteContext'
import { useAuditNavigation } from '../../hooks/useAuditNavigation'
import { defaultSidebarItems } from '../../config/sidebarNav'
import { ubtRoutes } from '../../config/ubtRoutes'
import { OperatorFooter, type OperatorFooterProps } from './OperatorFooter'
import { Sidebar } from './Sidebar'
import type { SidebarNavItemProps, SidebarNavSection } from './SidebarNavItem'

const UBT_NOTIFICACOES_PATH = ubtRoutes.notificacoes

type DashboardLayoutProps = {
  children: ReactNode
  sidebarItems?: SidebarNavItemProps[]
  sidebarSections?: SidebarNavSection[]
  logoutPath?: string
  onLogout?: () => void | Promise<void>
  footer?: OperatorFooterProps
  collapsedSectionsStorageKey?: string
}

export function DashboardLayout({
  children,
  sidebarItems,
  sidebarSections,
  logoutPath,
  onLogout,
  footer,
  collapsedSectionsStorageKey,
}: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const ubtAuth = useOptionalUbtAuth()
  const hasUbtUnreadInbox = useUbtUnreadInbox()
  const ubtSuporteAwaitingCount = useUbtSuporteAwaitingCount()
  const isUbtPortal =
    location.pathname.startsWith('/ubt/') && !location.pathname.startsWith('/ubt/login')

  useAuditNavigation({
    scope: 'ubt',
    enabled: isUbtPortal && Boolean(ubtAuth?.isAuthenticated),
    getAccessToken: () => ubtAuth?.getAccessToken() ?? null,
  })

  const resolvedFooter = useMemo(() => {
    if (footer) return footer
    if (!isUbtPortal || !ubtAuth?.user) return undefined
    return {
      label: brand.operatorFooterLabel,
      name: ubtAuth.user.nome,
      role: ubtAuth.user.funcao?.trim() || ubtAuth.user.accessLevel,
    }
  }, [footer, isUbtPortal, ubtAuth?.user])

  const resolvedOnLogout = useMemo(() => {
    if (onLogout) return onLogout
    if (!isUbtPortal || !ubtAuth) return undefined
    return async () => {
      await ubtAuth.logout()
      navigate(ubtRoutes.login, { replace: true })
    }
  }, [isUbtPortal, navigate, onLogout, ubtAuth])

  const resolvedLogoutPath = logoutPath ?? (isUbtPortal ? ubtRoutes.login : undefined)

  const resolvedSidebarItems = useMemo(() => {
    const base = sidebarItems ?? defaultSidebarItems
    let items = sidebarItems ? base : base

    if (!sidebarItems && isUbtPortal && ubtAuth?.user) {
      items = filterUbtSidebarItems(ubtAuth.user, items)
    }

    if (sidebarItems) return items

    return items.map((item) => {
      if (item.to === UBT_NOTIFICACOES_PATH) {
        return { ...item, showAlertDot: hasUbtUnreadInbox }
      }
      if (item.to === ubtRoutes.suporte) {
        return { ...item, badgeCount: ubtSuporteAwaitingCount }
      }
      return item
    })
  }, [hasUbtUnreadInbox, isUbtPortal, sidebarItems, ubtAuth?.user, ubtSuporteAwaitingCount])

  return (
    <div className="min-h-dvh bg-[#f5f6f8] p-3 sm:p-4">
      <div className="flex h-[calc(100dvh-1.5rem)] gap-3 sm:h-[calc(100dvh-2rem)] sm:gap-4">
        <Sidebar
          items={sidebarSections ? undefined : resolvedSidebarItems}
          sections={sidebarSections}
          logoutPath={resolvedLogoutPath}
          onLogout={resolvedOnLogout}
          collapsedSectionsStorageKey={collapsedSectionsStorageKey}
        />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-12">
            {children}
          </main>
          <OperatorFooter {...resolvedFooter} />
        </div>
      </div>
    </div>
  )
}
