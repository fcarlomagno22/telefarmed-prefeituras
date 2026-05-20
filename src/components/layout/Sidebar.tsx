import { brand } from '../../config/brand'
import { defaultSidebarItems } from '../../config/sidebarNav'
import { SidebarNavItem } from './SidebarNavItem'

type SidebarProps = {
  items?: typeof defaultSidebarItems
}

export function Sidebar({ items = defaultSidebarItems }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col rounded-2xl border border-gray-200/80 bg-white px-4 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] lg:w-64">
      <div className="mb-8 flex justify-center px-1">
        <img
          src={brand.logoUrl}
          alt={brand.appName}
          className="h-7 w-auto max-w-[120px] object-contain"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {items.map((item) => (
          <SidebarNavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  )
}
