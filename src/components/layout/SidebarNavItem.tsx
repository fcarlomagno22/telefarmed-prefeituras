import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export type SidebarNavItemProps = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function SidebarNavItem({ to, label, icon: Icon, end }: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        [
          'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
          isActive
            ? 'bg-[var(--brand-primary)] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}
