import { useMemo, type ReactNode } from 'react'
import { useUbtUnreadInbox } from '../../contexts/UbtNotificacoesContext'
import { defaultSidebarItems } from '../../config/sidebarNav'
import { OperatorFooter, type OperatorFooterProps } from './OperatorFooter'
import { Sidebar } from './Sidebar'
import type { SidebarNavItemProps, SidebarNavSection } from './SidebarNavItem'

const UBT_NOTIFICACOES_PATH = '/notificacoes'

type DashboardLayoutProps = {
  children: ReactNode
  sidebarItems?: SidebarNavItemProps[]
  sidebarSections?: SidebarNavSection[]
  logoutPath?: string
  footer?: OperatorFooterProps
  collapsedSectionsStorageKey?: string
}

export function DashboardLayout({
  children,
  sidebarItems,
  sidebarSections,
  logoutPath,
  footer,
  collapsedSectionsStorageKey,
}: DashboardLayoutProps) {
  const hasUbtUnreadInbox = useUbtUnreadInbox()

  const resolvedSidebarItems = useMemo(() => {
    const base = sidebarItems ?? defaultSidebarItems
    if (sidebarItems) return base

    return base.map((item) =>
      item.to === UBT_NOTIFICACOES_PATH
        ? { ...item, showAlertDot: hasUbtUnreadInbox }
        : item,
    )
  }, [sidebarItems, hasUbtUnreadInbox])

  return (
    <div className="min-h-dvh bg-[#f5f6f8] p-3 sm:p-4">
      <div className="flex h-[calc(100dvh-1.5rem)] gap-3 sm:h-[calc(100dvh-2rem)] sm:gap-4">
        <Sidebar
          items={sidebarSections ? undefined : resolvedSidebarItems}
          sections={sidebarSections}
          logoutPath={logoutPath}
          collapsedSectionsStorageKey={collapsedSectionsStorageKey}
        />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-12">
            {children}
          </main>
          <OperatorFooter {...footer} />
        </div>
      </div>
    </div>
  )
}
