import { CalendarDays, ListOrdered, Radio } from 'lucide-react'
import type { ProfissionalAgendaTab } from '../../../hooks/useProfissionalAgendaState'

const tabs: {
  id: ProfissionalAgendaTab
  label: string
  hint: string
  icon: typeof CalendarDays
}[] = [
  {
    id: 'dia',
    label: 'Calendário',
    hint: 'Plantões e escala do mês',
    icon: CalendarDays,
  },
  {
    id: 'fila',
    label: 'Fila de atendimento',
    hint: 'Pacientes na fila e na sala de espera',
    icon: ListOrdered,
  },
]

type ProfissionalAgendaTabsProps = {
  activeTab: ProfissionalAgendaTab
  onTabChange: (tab: ProfissionalAgendaTab) => void
  /** Pacientes aguardando na fila do plantão de hoje. */
  queueWaitingCount?: number
  /** Sessão de plantão em andamento (chip lateral). */
  shiftSessionActive?: boolean
}

export function ProfissionalAgendaTabs({
  activeTab,
  onTabChange,
  queueWaitingCount = 0,
  shiftSessionActive = false,
}: ProfissionalAgendaTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Agenda do plantão"
      data-tour="agenda-tabs"
      className={[
        'sticky top-0 z-20 mb-4 flex shrink-0 flex-col gap-2',
        'xl:flex-row xl:items-stretch',
        'overflow-hidden rounded-2xl border border-orange-100/80',
        'bg-gradient-to-br from-white via-white to-[var(--brand-primary-light)]/25',
        'p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(255,107,0,0.08)]',
        'backdrop-blur-sm',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          const showQueueBadge = tab.id === 'fila' && queueWaitingCount > 0

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-tour={tab.id === 'fila' ? 'tab-fila' : undefined}
              onClick={() => onTabChange(tab.id)}
              className={[
                'group relative flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 sm:px-4 sm:py-3',
                isActive
                  ? 'bg-white text-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_2px_12px_rgba(255,107,0,0.12)] ring-1 ring-orange-100/90'
                  : 'text-gray-600 hover:bg-white/60 hover:text-gray-900',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200',
                  isActive
                    ? 'bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8c33] text-white shadow-[0_4px_12px_rgba(255,107,0,0.35)]'
                    : 'bg-orange-50/80 text-[var(--brand-primary)] ring-1 ring-orange-100/80 group-hover:bg-orange-100/80',
                ].join(' ')}
                aria-hidden
              >
                <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.15} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      'text-sm font-semibold tracking-tight',
                      isActive ? 'text-gray-900' : 'text-gray-700',
                    ].join(' ')}
                  >
                    {tab.label}
                  </span>
                  {showQueueBadge ? (
                    <span
                      className={[
                        'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                        isActive
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-orange-100 text-orange-800 ring-1 ring-orange-200/80',
                      ].join(' ')}
                    >
                      {queueWaitingCount > 99 ? '99+' : queueWaitingCount}
                    </span>
                  ) : null}
                </span>
                <span
                  className={[
                    'mt-0.5 block truncate text-[11px] font-medium leading-snug',
                    isActive ? 'text-gray-500' : 'text-gray-400',
                  ].join(' ')}
                >
                  {tab.hint}
                </span>
              </span>

              <span
                className={[
                  'pointer-events-none absolute inset-x-4 bottom-1.5 h-[2px] rounded-full transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[var(--brand-primary)] via-orange-500 to-amber-400 opacity-100 shadow-[0_1px_8px_rgba(255,107,0,0.4)]'
                    : 'scale-x-0 opacity-0',
                ].join(' ')}
                aria-hidden
              />
            </button>
          )
        })}
      </div>

      {shiftSessionActive ? (
        <div
          className={[
            'flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-100/80',
            'bg-emerald-50/50 px-3 py-2',
            'max-xl:w-full',
            'xl:mx-0.5 xl:w-auto xl:self-center xl:border-0 xl:bg-transparent xl:px-2 xl:py-0',
          ].join(' ')}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
            <Radio className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2.25} />
            Plantão ativo
          </span>
        </div>
      ) : null}
    </nav>
  )
}
