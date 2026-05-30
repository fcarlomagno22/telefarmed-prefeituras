import { profissionalAgendaPanelClass } from './profissionalAgendaUi'

type DayStripItem = {
  date: Date
  dateKey: string
  hasShift: boolean
  isToday: boolean
}

type ProfissionalAgendaDayStripProps = {
  days: DayStripItem[]
  selectedDateKey: string
  onSelectDate: (dateKey: string) => void
}

export function ProfissionalAgendaDayStrip({
  days,
  selectedDateKey,
  onSelectDate,
}: ProfissionalAgendaDayStripProps) {
  return (
    <section className={[profissionalAgendaPanelClass, 'p-4 sm:p-5'].join(' ')}>
      <h2 className="text-sm font-bold text-gray-900">Próximos dias</h2>
      <p className="mt-1 text-xs text-gray-500">
        Dias com plantão designado na escala aparecem destacados.
      </p>

      <div className="schedule-days-scroll -mx-1 mt-3 flex flex-nowrap gap-2 overflow-x-auto scroll-smooth px-1 pb-1">
        {days.map((day) => {
          const selected = day.dateKey === selectedDateKey
          const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
            .format(day.date)
            .replace('.', '')
          const dayNum = day.date.getDate()

          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => onSelectDate(day.dateKey)}
              className={[
                'flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 text-center transition',
                selected
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-sm'
                  : day.hasShift
                    ? 'border-orange-200 bg-orange-50/60 hover:border-orange-300'
                    : 'border-gray-200 bg-white hover:border-gray-300',
              ].join(' ')}
            >
              <span className="text-[10px] font-semibold uppercase text-gray-500">
                {day.isToday ? 'Hoje' : weekday}
              </span>
              <span
                className={[
                  'mt-1 text-lg font-bold tabular-nums',
                  selected ? 'text-[var(--brand-primary)]' : 'text-gray-900',
                ].join(' ')}
              >
                {dayNum}
              </span>
              {day.hasShift ? (
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
              ) : (
                <span className="mt-1 h-1.5 w-1.5" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
