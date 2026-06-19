import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isSidebarNavItemActive } from '../../utils/sidebarNavPath'
import { SidebarNavItem, type SidebarNavSection } from './SidebarNavItem'

export const PREFEITURA_SIDEBAR_COLLAPSED_STORAGE_KEY =
  'prefeitura-sidebar-collapsed-sections'

export const ADMIN_SIDEBAR_COLLAPSED_STORAGE_KEY = 'admin-sidebar-collapsed-sections'

function readCollapsedSectionIds(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function writeCollapsedSectionIds(storageKey: string, collapsed: Set<string>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...collapsed]))
  } catch {
    /* quota / private mode */
  }
}

function isNavItemActive(pathname: string, to: string, end?: boolean) {
  return isSidebarNavItemActive(pathname, to, end)
}

function sectionHasActiveItem(pathname: string, section: SidebarNavSection) {
  return section.items.some((item) => isNavItemActive(pathname, item.to, item.end))
}

type SidebarNavSectionGroupProps = {
  section: SidebarNavSection
  defaultCollapsed?: boolean
  collapsedStorageKey?: string
}

export function SidebarNavSectionGroup({
  section,
  defaultCollapsed = false,
  collapsedStorageKey = PREFEITURA_SIDEBAR_COLLAPSED_STORAGE_KEY,
}: SidebarNavSectionGroupProps) {
  const { pathname } = useLocation()
  const panelId = useId()
  const [collapsed, setCollapsed] = useState(() => {
    const stored = readCollapsedSectionIds(collapsedStorageKey)
    if (stored.has(section.id)) return true
    return defaultCollapsed
  })

  const expandSection = useCallback(() => {
    setCollapsed((current) => {
      if (!current) return current
      const nextStored = readCollapsedSectionIds(collapsedStorageKey)
      nextStored.delete(section.id)
      writeCollapsedSectionIds(collapsedStorageKey, nextStored)
      return false
    })
  }, [collapsedStorageKey, section.id])

  useEffect(() => {
    if (sectionHasActiveItem(pathname, section)) {
      expandSection()
    }
  }, [pathname, section, expandSection])

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      const stored = readCollapsedSectionIds(collapsedStorageKey)
      if (next) stored.add(section.id)
      else stored.delete(section.id)
      writeCollapsedSectionIds(collapsedStorageKey, stored)
      return next
    })
  }

  return (
    <div>
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={!collapsed}
        aria-controls={panelId}
        onClick={toggleCollapsed}
        className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg px-4 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
      >
        <span className="truncate">{section.label}</span>
        <ChevronDown
          className={[
            'h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200',
            collapsed ? '-rotate-90' : '',
          ].join(' ')}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        hidden={collapsed}
        className={collapsed ? 'hidden' : undefined}
      >
        <div className="flex flex-col gap-1.5">
          {section.items.map((item) => (
            <SidebarNavItem key={item.to} {...item} />
          ))}
        </div>
      </div>
    </div>
  )
}
