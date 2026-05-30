import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import {
  buildCalendarGrid,
  CALENDAR_MONTH_LABELS,
  CALENDAR_WEEKDAY_LABELS,
  isSameCalendarMonth,
  type CalendarCell,
} from '../../../utils/calendar'
import { isSameDay, toDateKey } from '../../../utils/agendaDate'

const CELL_HEIGHT = 'h-10 sm:h-11'

type ProfissionalAgendaMonthCalendarProps = {
  viewMonth: Date
  selectedDateKey: string
  shiftCountByDate: Map<string, number>
  onSelectDate: (dateKey: string) => void
  onPreviousMonth: () => void
  onNextMonth: () => void
  onGoToToday: () => void
  referenceToday?: Date
}

function isWeekend(date: Date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function ShiftMarker({
  count,
  selected,
}: {
  count: number
  selected: boolean
}) {
  if (count <= 0) return <span className="h-2" aria-hidden />

  if (selected) {
    return (
      <span className="flex items-center gap-1" aria-hidden>
        {count > 1 ? (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white backdrop-blur-sm">
            {count}
          </span>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        )}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] shadow-[0_0_6px_rgba(255,107,0,0.45)]" />
      {count > 1 ? (
        <span className="text-[10px] font-bold tabular-nums text-[var(--brand-primary)]">
          +{count - 1}
        </span>
      ) : null}
    </span>
  )
}

type DayCellProps = {
  date: Date
  inCurrentMonth: boolean
  selected: boolean
  today: boolean
  shiftCount: number
  onSelect: () => void
  cellHeightClass: string
}

function DayCell({
  date,
  inCurrentMonth,
  selected,
  today,
  shiftCount,
  onSelect,
  cellHeightClass,
}: DayCellProps) {
  const hasShift = shiftCount > 0 && inCurrentMonth
  const weekend = inCurrentMonth && isWeekend(date)

  if (!inCurrentMonth) {
    return (
      <span
        className={[
          'flex items-center justify-center text-sm font-medium text-gray-200/80',
          cellHeightClass,
        ].join(' ')}
        aria-hidden
      >
        {date.getDate()}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border transition-all duration-200 ease-out',
        cellHeightClass,
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]',
        selected
          ? 'border-transparent bg-gradient-to-br from-[#ff6b00] via-[#ff7f1f] to-[#ffb347] text-white shadow-[0_6px_20px_rgba(255,107,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]'
          : today
            ? 'border-[var(--brand-primary)]/30 bg-gradient-to-b from-white to-orange-50/90 text-gray-900 shadow-[inset_0_0_0_1px_rgba(255,107,0,0.12)] hover:shadow-md'
            : hasShift
              ? 'border-orange-100/80 bg-gradient-to-br from-white via-[var(--brand-primary-light)]/30 to-orange-50/40 text-gray-900 hover:border-orange-200 hover:shadow-[0_4px_14px_rgba(255,107,0,0.1)]'
              : weekend
                ? 'border-violet-100/50 bg-gradient-to-b from-violet-50/30 to-white text-gray-700 hover:border-violet-200/80 hover:bg-violet-50/50'
                : 'border-gray-100/80 bg-white text-gray-800 hover:border-gray-200 hover:shadow-sm',
      ].join(' ')}
      aria-label={date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}
      aria-pressed={selected}
    >
      {hasShift && !selected ? (
        <span
          className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-[var(--brand-primary)] to-orange-300"
          aria-hidden
        />
      ) : null}

      {selected ? (
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.22)_0%,transparent_55%)]"
          aria-hidden
        />
      ) : null}

      {today && !selected ? (
        <span className="absolute inset-x-0 top-1 text-center text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--brand-primary)]">
          Hoje
        </span>
      ) : null}

      <span
        className={[
          'relative z-[1] tabular-nums leading-none',
          today && !selected ? 'mt-1.5 text-sm font-bold' : 'text-base font-semibold',
          selected ? 'text-lg font-bold' : '',
        ].join(' ')}
      >
        {date.getDate()}
      </span>

      <span className="relative z-[1] mt-1">
        <ShiftMarker count={shiftCount} selected={selected} />
      </span>
    </button>
  )
}

function chunkWeeks(cells: CalendarCell[]): CalendarCell[][] {
  const weeks: CalendarCell[][] = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }
  return weeks
}

export function ProfissionalAgendaMonthCalendar({
  viewMonth,
  selectedDateKey,
  shiftCountByDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onGoToToday,
  referenceToday = new Date(),
}: ProfissionalAgendaMonthCalendarProps) {
  const cellHeightClass = CELL_HEIGHT
  const cells = useMemo(() => buildCalendarGrid(viewMonth), [viewMonth])
  const weeks = useMemo(() => chunkWeeks(cells), [cells])
  const monthLabel = CALENDAR_MONTH_LABELS[viewMonth.getMonth()]
  const year = viewMonth.getFullYear()
  const isViewingCurrentMonth = isSameCalendarMonth(viewMonth, referenceToday)

  const shiftDaysInMonth = useMemo(() => {
    let count = 0
    shiftCountByDate.forEach((value, key) => {
      const [y, m] = key.split('-').map(Number)
      if (y === year && m === viewMonth.getMonth() + 1 && value > 0) count += 1
    })
    return count
  }, [shiftCountByDate, year, viewMonth])

  return (
    <section
      data-tour="agenda-calendar"
      className="w-full min-w-0 overflow-hidden rounded-2xl border border-orange-100/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_28px_rgba(255,107,0,0.07)]"
    >
      <header className="relative shrink-0 overflow-hidden border-b border-orange-100/50 px-3 py-2.5 sm:px-4 sm:py-3">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,237,213,0.55)_0%,rgba(255,255,255,0.9)_48%,rgba(255,255,255,1)_100%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ff9f4d] text-white shadow-[0_4px_12px_rgba(255,107,0,0.28)]">
              <CalendarDays className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onPreviousMonth}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-white text-gray-600 shadow-sm transition hover:border-[var(--brand-primary)]/30 hover:text-[var(--brand-primary)]"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
                </button>
                <h2 className="min-w-0 text-lg font-bold tracking-tight text-gray-900">
                  {monthLabel}
                  <span className="ml-1.5 font-semibold text-gray-400">{year}</span>
                </h2>
                <button
                  type="button"
                  onClick={onNextMonth}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-white text-gray-600 shadow-sm transition hover:border-[var(--brand-primary)]/30 hover:text-[var(--brand-primary)]"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
                </button>
                {!isViewingCurrentMonth ? (
                  <button
                    type="button"
                    onClick={onGoToToday}
                    className="rounded-lg border border-[var(--brand-primary)]/25 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-primary)] transition hover:bg-orange-100"
                  >
                    Hoje
                  </button>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {shiftDaysInMonth}{' '}
                {shiftDaysInMonth === 1 ? 'dia com plantão designado' : 'dias com plantão designados'}
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-gray-100 bg-white/80 p-1 shadow-sm backdrop-blur-sm md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] shadow-[0_0_4px_rgba(255,107,0,0.5)]" />
              Plantão
            </span>
            <span className="h-3 w-px bg-gray-200" aria-hidden />
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-gray-600">
              <span className="h-2 w-2 rounded-md ring-2 ring-[var(--brand-primary)]/25" />
              Hoje
            </span>
          </div>
        </div>
      </header>

      <div className="bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_12%)] p-2.5 sm:p-3">
        <div className="mb-1.5 shrink-0 grid grid-cols-7 gap-1 px-0.5">
          {CALENDAR_WEEKDAY_LABELS.map((label, index) => (
            <span
              key={label}
              className={[
                'text-center text-[10px] font-bold uppercase tracking-[0.08em]',
                index >= 5 ? 'text-violet-400/90' : 'text-gray-400',
              ].join(' ')}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className={[
                'grid grid-cols-7 gap-1 rounded-xl p-1',
                weekIndex % 2 === 1 ? 'bg-gray-50/70' : 'bg-white/50',
              ].join(' ')}
            >
              {week.map(({ date, inCurrentMonth }) => {
                const dateKey = toDateKey(date)
                return (
                  <DayCell
                    key={dateKey}
                    date={date}
                    inCurrentMonth={inCurrentMonth}
                    selected={dateKey === selectedDateKey}
                    today={isSameDay(date, referenceToday)}
                    shiftCount={shiftCountByDate.get(dateKey) ?? 0}
                    onSelect={() => onSelectDate(dateKey)}
                    cellHeightClass={cellHeightClass}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
