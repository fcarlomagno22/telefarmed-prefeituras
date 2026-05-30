import type { ProfissionalAvaliacoesTab } from '../../../types/profissionalAvaliacoes'

const tabs: { id: ProfissionalAvaliacoesTab; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'criticos', label: 'Críticas' },
]

type ProfissionalAvaliacaoTabsProps = {
  activeTab: ProfissionalAvaliacoesTab
  onTabChange: (tab: ProfissionalAvaliacoesTab) => void
  totalCount: number
  criticalCount: number
}

function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function ProfissionalAvaliacaoTabs({
  activeTab,
  onTabChange,
  totalCount,
  criticalCount,
}: ProfissionalAvaliacaoTabsProps) {
  const counts: Record<ProfissionalAvaliacoesTab, number> = {
    todos: totalCount,
    criticos: criticalCount,
  }

  return (
    <nav
      role="tablist"
      aria-label="Filtrar comentários"
      data-tour="avaliacao-tabs"
      className="inline-flex w-full max-w-sm gap-1 rounded-xl bg-gray-100/90 p-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const count = counts[tab.id]
        const isCriticalTab = tab.id === 'criticos'

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            {...(isCriticalTab ? { 'data-tour': 'avaliacao-tab-criticos' } : {})}
            onClick={() => onTabChange(tab.id)}
            className={[
              'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150 sm:px-4',
              isActive
                ? [
                    'bg-white font-semibold shadow-sm',
                    isCriticalTab ? 'text-red-700' : 'text-gray-900',
                  ].join(' ')
                : 'font-medium text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            <span>{tab.label}</span>
            <span
              className={[
                'min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                isActive
                  ? isCriticalTab
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                  : 'bg-gray-200/60 text-gray-500',
              ].join(' ')}
            >
              {formatCount(count)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
