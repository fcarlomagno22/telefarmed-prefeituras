import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { brand } from '../../config/brand'
import { ubtRoutes } from '../../config/ubtRoutes'
import { defaultSidebarItems } from '../../config/sidebarNav'
import { SidebarNavItem, type SidebarNavSection } from './SidebarNavItem'
import {
  PREFEITURA_SIDEBAR_COLLAPSED_STORAGE_KEY,
  SidebarNavSectionGroup,
} from './SidebarNavSectionGroup'

type SidebarProps = {
  items?: typeof defaultSidebarItems
  sections?: SidebarNavSection[]
  logoutPath?: string
  onLogout?: () => void | Promise<void>
  /** Chave de localStorage para seções recolhidas (padrão: prefeitura). */
  collapsedSectionsStorageKey?: string
}

function SidebarNavList({ items }: { items: typeof defaultSidebarItems }) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <SidebarNavItem key={item.to} {...item} />
      ))}
    </div>
  )
}

export function Sidebar({
  items,
  sections,
  logoutPath = ubtRoutes.login,
  onLogout,
  collapsedSectionsStorageKey = PREFEITURA_SIDEBAR_COLLAPSED_STORAGE_KEY,
}: SidebarProps) {
  const navigate = useNavigate()
  const flatItems = items ?? defaultSidebarItems

  async function handleLogout() {
    if (onLogout) {
      await onLogout()
      return
    }
    navigate(logoutPath, { replace: true })
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col rounded-2xl border border-gray-200 bg-white px-4 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)] lg:w-64">
      <div className="mb-8 flex justify-center px-1">
        <img
          src={brand.logoUrl}
          alt={brand.appName}
          className="h-7 w-auto max-w-[120px] object-contain"
        />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {sections ? (
          <div className="flex flex-col gap-5">
            {sections.map((section) => (
              <SidebarNavSectionGroup
                key={section.id}
                section={section}
                collapsedStorageKey={collapsedSectionsStorageKey}
              />
            ))}
          </div>
        ) : (
          <SidebarNavList items={flatItems} />
        )}
      </nav>

      <footer className="mt-4 shrink-0 pt-4">
        <div
          className="mb-4 h-px w-full bg-red-200/80"
          role="presentation"
          aria-hidden
        />
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span>Sair</span>
        </button>
      </footer>
    </aside>
  )
}
