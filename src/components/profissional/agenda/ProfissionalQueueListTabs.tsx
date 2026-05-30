import { CheckCircle2, ListOrdered } from 'lucide-react'

export type ProfissionalQueueListTab = 'active' | 'attended'

const tabs: {
  id: ProfissionalQueueListTab
  label: string
  icon: typeof ListOrdered
}[] = [
  { id: 'active', label: 'Fila de atendimento', icon: ListOrdered },
  { id: 'attended', label: 'Atendidos', icon: CheckCircle2 },
]

type ProfissionalQueueListTabsProps = {
  activeTab: ProfissionalQueueListTab
  onTabChange: (tab: ProfissionalQueueListTab) => void
  activeCount: number
  attendedCount: number
}

export function ProfissionalQueueListTabs({
  activeTab,
  onTabChange,
  activeCount,
  attendedCount,
}: ProfissionalQueueListTabsProps) {
  const counts: Record<ProfissionalQueueListTab, number> = {
    active: activeCount,
    attended: attendedCount,
  }

  return (
    <nav
      role="tablist"
      aria-label="Filas do plantão"
      data-tour="queue-list-tabs"
      className={[
        'flex shrink-0 gap-1 overflow-x-auto p-1',
        'rounded-t-xl border-b border-gray-200 bg-gradient-to-r from-gray-50/90 to-orange-50/30',
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      ].join(' ')}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon
        const count = counts[tab.id]

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={[
              'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-left transition sm:px-4',
              isActive
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/90'
                : 'text-gray-600 hover:bg-white/70 hover:text-gray-900',
            ].join(' ')}
          >
            <Icon
              className={[
                'h-4 w-4 shrink-0',
                isActive
                  ? tab.id === 'attended'
                    ? 'text-emerald-600'
                    : 'text-[var(--brand-primary)]'
                  : 'text-gray-400',
              ].join(' ')}
              strokeWidth={2.1}
            />
            <span className="truncate text-xs font-semibold sm:text-sm">{tab.label}</span>
            <span
              className={[
                'inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                isActive
                  ? tab.id === 'attended'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-600',
              ].join(' ')}
            >
              {count > 99 ? '99+' : count}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export function profissionalQueueListTabHint(tab: ProfissionalQueueListTab): string {
  switch (tab) {
    case 'attended':
      return 'Consultas finalizadas e demais encerramentos do plantão.'
    default:
      return 'Aguardando, na sala de espera e em atendimento — ordem automática por horário e chegada.'
  }
}
