import { CalendarDays } from 'lucide-react'
import type { AgendaHistoryDay } from '../../data/agendaMock'
import { formatAgendaDayLabel, parseDateKey } from '../../utils/agendaDate'

type AgendaHistoryCardProps = {
  history: AgendaHistoryDay[]
  selectedDateKey: string
  onSelectDay?: (dateKey: string) => void
}

function formatShortDate(dateKey: string) {
  const date = parseDateKey(dateKey)
  return formatAgendaDayLabel(date)
}

export function AgendaHistoryCard({
  history,
  selectedDateKey,
  onSelectDay,
}: AgendaHistoryCardProps) {
  if (!history.length) return null

  return (
    <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-[var(--brand-primary)]" strokeWidth={2} />
        <h2 className="text-lg font-bold text-gray-900">Dias anteriores</h2>
      </div>
      <p className="mt-1 text-xs text-gray-500">Resumo dos últimos dias com consultas na agenda</p>

      <ul className="mt-4 space-y-2">
        {history.map((day) => {
          const isSelected = day.id === selectedDateKey
          const attendanceRate =
            day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0

          return (
            <li key={day.id}>
              <button
                type="button"
                onClick={() => onSelectDay?.(day.id)}
                className={[
                  'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                  isSelected
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white',
                ].join(' ')}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">
                    {day.weekdayLabel}
                    <span className="ml-1.5 font-normal text-gray-500">
                      {formatShortDate(day.id)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {day.total} consulta{day.total === 1 ? '' : 's'} · {day.completed} realizada
                    {day.completed === 1 ? '' : 's'}
                    {day.noShows > 0 ? ` · ${day.noShows} falta${day.noShows === 1 ? '' : 's'}` : ''}
                  </span>
                </span>
                <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold tabular-nums text-emerald-700">
                  {attendanceRate}%
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
