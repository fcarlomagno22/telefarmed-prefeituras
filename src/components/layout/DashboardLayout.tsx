import type { ReactNode } from 'react'
import { OperatorFooter } from './OperatorFooter'
import { Sidebar } from './Sidebar'
import type { SidebarNavItemProps } from './SidebarNavItem'

type DashboardLayoutProps = {
  children: ReactNode
  sidebarItems?: SidebarNavItemProps[]
}

export function DashboardLayout({ children, sidebarItems }: DashboardLayoutProps) {
  return (
    <div className="min-h-dvh bg-[#f5f6f8] p-3 sm:p-4">
      <div className="flex h-[calc(100dvh-1.5rem)] gap-3 sm:h-[calc(100dvh-2rem)] sm:gap-4">
        <Sidebar items={sidebarItems} />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-12">
            {children}
          </main>
          <OperatorFooter />
        </div>
      </div>
    </div>
  )
}
