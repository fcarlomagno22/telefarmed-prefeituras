import { Calendar } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FLOATING_POPOVER_Z_INDEX } from '../../config/overlayLayers'
import { FloatingOverlayPortal } from './FloatingOverlayPortal'
import { isSameDay } from '../../utils/agendaDate'
import {
  buildCalendarGrid,
  buildYearRange,
  CALENDAR_MONTH_LABELS,
  CALENDAR_WEEKDAY_LABELS,
  formatDatePtBr,
  isDateWithinRange,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from '../../utils/calendar'

type CompactDatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  className?: string
  hasError?: boolean
  compact?: boolean
}

const defaultMaxDate = new Date()
const defaultMinDate = new Date(
  defaultMaxDate.getFullYear() - 120,
  defaultMaxDate.getMonth(),
  defaultMaxDate.getDate(),
)

export function CompactDatePicker({
  value,
  onChange,
  placeholder = 'Selecione a data',
  minDate = defaultMinDate,
  maxDate = defaultMaxDate,
  className = '',
  hasError = false,
  compact = false,
}: CompactDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseIsoDate(value)
  const [viewDate, setViewDate] = useState(() =>
    startOfMonth(selectedDate ?? maxDate),
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const today = useMemo(() => new Date(), [])

  type MenuPosition = { top: number; left: number }
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)

  function computeMenuPosition(): MenuPosition | null {
    if (!triggerRef.current) return null
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 6
    const menuWidth = 268
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - menuWidth - 8,
    )
    const top = rect.bottom + gap

    return { top, left }
  }

  function updateMenuPosition() {
    const next = computeMenuPosition()
    if (next) setMenuPosition(next)
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    updateMenuPosition()

    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open])

  const cells = useMemo(() => buildCalendarGrid(viewDate), [viewDate])
  const years = useMemo(() => buildYearRange(minDate, maxDate), [minDate, maxDate])
  const displayValue = formatDatePtBr(value)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
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
      setViewDate(startOfMonth(selectedDate ?? maxDate))
    }
  }, [open, selectedDate, maxDate])

  function handleSelectDay(date: Date) {
    if (!isDateWithinRange(date, minDate, maxDate)) return
    onChange(toIsoDate(date))
    setOpen(false)
  }

  const fieldClass = hasError
    ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-200/60'
    : 'border-gray-200/80 focus-within:border-[var(--brand-primary)] focus-within:ring-[var(--brand-primary)]/15'

  function toggleOpen() {
    if (open) {
      setOpen(false)
      return
    }
    const position = computeMenuPosition()
    if (position) setMenuPosition(position)
    setOpen(true)
  }

  const calendarMenu =
    open && menuPosition ? (
      <FloatingOverlayPortal>
        <div
          ref={menuRef}
          role="dialog"
          aria-label="Selecionar data"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            width: 268,
            zIndex: FLOATING_POPOVER_Z_INDEX,
            pointerEvents: 'auto',
          }}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
        >
            <div className="bg-gradient-to-br from-[var(--brand-primary-light)] via-orange-50/90 to-white px-2.5 pb-2 pt-2.5">
              <div className="grid grid-cols-2 gap-1.5">
                <label className="sr-only">Mês</label>
                <select
                  value={viewDate.getMonth()}
                  onChange={(event) => {
                    const month = Number(event.target.value)
                    setViewDate((current) => new Date(current.getFullYear(), month, 1))
                  }}
                  className="rounded-lg border border-white/80 bg-white/90 px-2 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/20"
                >
                  {CALENDAR_MONTH_LABELS.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="sr-only">Ano</label>
                <select
                  value={viewDate.getFullYear()}
                  onChange={(event) => {
                    const year = Number(event.target.value)
                    setViewDate((current) => new Date(year, current.getMonth(), 1))
                  }}
                  className="rounded-lg border border-white/80 bg-white/90 px-2 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/20"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-2 pb-2 pt-1.5">
              <div className="mb-0.5 grid grid-cols-7 gap-px">
                {CALENDAR_WEEKDAY_LABELS.map((label) => (
                  <span
                    key={label}
                    className="py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-gray-400"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px">
                {cells.map(({ date, inCurrentMonth }) => {
                  const selected = selectedDate ? isSameDay(date, selectedDate) : false
                  const isToday = isSameDay(date, today)
                  const disabled = !isDateWithinRange(date, minDate, maxDate)

                  return (
                    <button
                      key={toIsoDate(date)}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectDay(date)}
                      className={[
                        'flex h-7 items-center justify-center rounded-md text-xs font-medium transition',
                        disabled && 'cursor-not-allowed text-gray-300',
                        !disabled && !inCurrentMonth && 'text-gray-300',
                        !disabled && inCurrentMonth && !selected && 'text-gray-700 hover:bg-orange-50',
                        selected &&
                          'bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8c33] text-white shadow-[0_2px_8px_rgba(255,107,0,0.3)]',
                        isToday && !selected && !disabled && 'ring-1 ring-[var(--brand-primary)]/30',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-label={date.toLocaleDateString('pt-BR')}
                      aria-pressed={selected}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
          </div>
        </div>
      </FloatingOverlayPortal>
    ) : null

  return (
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <div
        ref={triggerRef}
        className={[
          'flex w-full items-center rounded-xl border bg-white pr-1.5 transition focus-within:ring-2',
          fieldClass,
          open ? 'ring-2' : '',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={toggleOpen}
          className={[
            'min-w-0 flex-1 text-left text-gray-800 outline-none',
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-3 text-sm',
          ].join(' ')}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {displayValue ? (
            <span>{displayValue}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </button>
        <button
          type="button"
          onClick={toggleOpen}
          aria-label="Abrir calendário"
          className={[
            'inline-flex shrink-0 items-center justify-center rounded-lg border transition',
            compact ? 'h-7 w-7' : 'h-8 w-8',
            open
              ? 'border-[var(--brand-primary)]/40 bg-orange-50 text-[var(--brand-primary)]'
              : 'border-transparent text-gray-500 hover:bg-orange-50 hover:text-[var(--brand-primary)]',
          ].join(' ')}
        >
          <Calendar className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {calendarMenu}
    </div>
  )
}
