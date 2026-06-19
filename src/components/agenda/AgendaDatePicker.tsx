import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isSameDay, toDateKey } from '../../utils/agendaDate'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

type CalendarCell = {
  date: Date
  inCurrentMonth: boolean
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildCalendarGrid(viewDate: Date): CalendarCell[] {
  const monthStart = startOfMonth(viewDate)
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const leadingDays = (monthStart.getDay() + 6) % 7
  const totalCells = Math.ceil((leadingDays + monthEnd.getDate()) / 7) * 7

  return Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - leadingDays
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 + dayOffset)
    return {
      date,
      inCurrentMonth: date.getMonth() === viewDate.getMonth(),
    }
  })
}

type AgendaDatePickerProps = {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  referenceToday?: Date
  hasAppointmentsOnDate?: (date: Date) => boolean
  onMonthChange?: (year: number, month: number) => void
}

export function AgendaDatePicker({
  selectedDate,
  onSelectDate,
  referenceToday,
  hasAppointmentsOnDate,
  onMonthChange,
}: AgendaDatePickerProps) {
  const todayRef =
    referenceToday ??
    (() => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      return today
    })()
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => startOfMonth(selectedDate))
  const containerRef = useRef<HTMLDivElement>(null)
  const onMonthChangeRef = useRef(onMonthChange)

  useEffect(() => {
    onMonthChangeRef.current = onMonthChange
  }, [onMonthChange])

  const cells = useMemo(() => buildCalendarGrid(viewDate), [viewDate])
  const monthTitle = `${MONTH_LABELS[viewDate.getMonth()]} ${viewDate.getFullYear()}`

  useEffect(() => {
    onMonthChangeRef.current?.(viewDate.getFullYear(), viewDate.getMonth() + 1)
  }, [viewDate])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setViewDate(startOfMonth(selectedDate))
    }
  }, [open, selectedDate])

  function goToPreviousMonth() {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  }

  function handleSelectDay(date: Date) {
    onSelectDate(date)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Abrir calendário"
        className={[
          'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition',
          open
            ? 'border-[var(--brand-primary)]/40 bg-[var(--brand-primary-muted)] text-[var(--brand-primary)] shadow-[var(--brand-primary-focus-ring)]'
            : 'border-gray-200 bg-white text-gray-600 hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-muted)] hover:text-[var(--brand-primary)]',
        ].join(' ')}
      >
        <Calendar className="h-4 w-4" strokeWidth={2} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Selecionar data"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        >
          <div className="bg-gradient-to-br from-[var(--brand-primary-light)] via-orange-50 to-white px-4 pb-3 pt-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-gray-600 shadow-sm transition hover:bg-white hover:text-[var(--brand-primary)]"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
              </button>
              <p className="text-center text-sm font-bold capitalize text-gray-900">{monthTitle}</p>
              <button
                type="button"
                onClick={goToNextMonth}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-gray-600 shadow-sm transition hover:bg-white hover:text-[var(--brand-primary)]"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
          </div>

          <div className="px-3 pb-3 pt-2">
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAY_LABELS.map((label) => (
                <span
                  key={label}
                  className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {cells.map(({ date, inCurrentMonth }) => {
                const selected = isSameDay(date, selectedDate)
                const today = isSameDay(date, todayRef)
                const hasAgenda = hasAppointmentsOnDate?.(date) ?? false

                return (
                  <button
                    key={toDateKey(date)}
                    type="button"
                    onClick={() => handleSelectDay(date)}
                    className={[
                      'relative flex h-9 flex-col items-center justify-center rounded-lg text-sm font-medium transition',
                      !inCurrentMonth && 'text-gray-300',
                      inCurrentMonth && !selected && 'text-gray-700 hover:bg-[var(--brand-primary-muted)]',
                      selected &&
                        'bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8c33] text-white shadow-[var(--brand-primary-shadow-sm)]',
                      today && !selected && 'ring-2 ring-[var(--brand-primary)]/25 ring-offset-1',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label={date.toLocaleDateString('pt-BR')}
                    aria-pressed={selected}
                  >
                    <span className="leading-none">{date.getDate()}</span>
                    {hasAgenda && inCurrentMonth ? (
                      <span
                        className={[
                          'mt-0.5 h-1 w-1 rounded-full',
                          selected ? 'bg-white/90' : 'bg-[var(--brand-primary)]',
                        ].join(' ')}
                        aria-hidden
                      />
                    ) : (
                      <span className="mt-0.5 h-1 w-1" aria-hidden />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-200 pt-3">
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
                  Com agenda
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded ring-2 ring-[var(--brand-primary)]/25" />
                  Hoje
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectDay(new Date(todayRef))}
                className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-muted)]"
              >
                Hoje
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
