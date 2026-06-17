import type { AdminProfissionaisTab } from '../../../types/adminProfissionais'

const tabs: { id: AdminProfissionaisTab; label: string }[] = [
  { id: 'candidaturas', label: 'Candidaturas' },
  { id: 'ativos', label: 'Profissionais aprovados' },
]

type AdminProfissionaisTabsProps = {
  activeTab: AdminProfissionaisTab
  onTabChange: (tab: AdminProfissionaisTab) => void
  candidaturasPendentes?: number
}

export function AdminProfissionaisTabs({
  activeTab,
  onTabChange,
  candidaturasPendentes = 0,
}: AdminProfissionaisTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Profissionais"
      className="flex shrink-0 gap-0 border-b border-gray-200 bg-white px-4 sm:px-5"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const showBadge = tab.id === 'candidaturas' && candidaturasPendentes > 0
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={[
              'relative shrink-0 px-4 py-3 text-sm font-semibold transition sm:px-5',
              isActive ? 'text-[var(--brand-primary)]' : 'text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            <span className="inline-flex items-center gap-2">
              {tab.label}
              {showBadge ? (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {candidaturasPendentes}
                </span>
              ) : null}
            </span>
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
