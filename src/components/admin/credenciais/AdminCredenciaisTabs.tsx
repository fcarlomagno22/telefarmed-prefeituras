export type AdminCredenciaisTab = 'admin' | 'prefeitura' | 'ubt'

const tabs: { id: AdminCredenciaisTab; label: string; hint: string }[] = [
  {
    id: 'admin',
    label: 'Admin Telefarmed',
    hint: 'Equipe interna · /admin',
  },
  {
    id: 'prefeitura',
    label: 'Prefeitura',
    hint: 'Gestores municipais · /prefeitura',
  },
  {
    id: 'ubt',
    label: 'UBT',
    hint: 'Operadores de unidade · /ubt',
  },
]

type AdminCredenciaisTabsProps = {
  activeTab: AdminCredenciaisTab
  onTabChange: (tab: AdminCredenciaisTab) => void
}

export function AdminCredenciaisTabs({ activeTab, onTabChange }: AdminCredenciaisTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Portais de acesso"
      className="flex shrink-0 gap-0 overflow-x-auto border-b border-gray-200 bg-white px-4 sm:px-5"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={[
              'relative shrink-0 px-4 py-3 text-left transition sm:px-5',
              isActive ? 'text-[var(--brand-primary)]' : 'text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className="mt-0.5 block text-[10px] font-medium text-gray-400">{tab.hint}</span>
            <span
              className={[
                'pointer-events-none absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-all duration-200 sm:inset-x-4',
                isActive
                  ? 'bg-gradient-to-r from-[var(--brand-primary)] via-orange-500 to-amber-400 opacity-100 shadow-[0_2px_10px_rgba(255,107,0,0.45)]'
                  : 'scale-x-0 opacity-0',
              ].join(' ')}
              aria-hidden
            />
          </button>
        )
      })}
    </nav>
  )
}
