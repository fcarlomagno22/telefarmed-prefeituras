import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  escalaDateRangeError,
  getEscalaRangeDaySpan,
  isValidEscalaDateRange,
  MAX_ESCALA_RANGE_DAYS,
  parseDateOnly,
} from '../../../utils/adminEscala/dateRange'
import {
  adminEscalaWeekdayOptions,
  type AdminEscalaWeekday,
} from '../../../utils/adminEscala/buildClosedSchedule'
import {
  escalaComposeInputClass,
  escalaComposeLabelClass,
} from './adminEscalaComposePremium'

type AdminEscalaComposePeriodStepProps = {
  rangeStart: string
  rangeEnd: string
  onRangeStartChange: (value: string) => void
  onRangeEndChange: (value: string) => void
  previewShiftCount?: number
  singleWeekday?: AdminEscalaWeekday | null
}

type PeriodPreset = {
  id: string
  label: string
  description: string
  getRange: () => { start: string; end: string }
}

function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatDateLongBr(iso: string) {
  const date = parseDateOnly(iso)
  if (!date) return iso
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function clampRangeEnd(startIso: string, endIso: string) {
  const span = getEscalaRangeDaySpan(startIso, endIso)
  if (span === 0 || span <= MAX_ESCALA_RANGE_DAYS) return endIso
  const start = parseDateOnly(startIso)
  if (!start) return endIso
  const end = new Date(start)
  end.setDate(end.getDate() + MAX_ESCALA_RANGE_DAYS - 1)
  return toDateInputValue(end)
}

function buildPresets(): PeriodPreset[] {
  return [
    {
      id: '2weeks',
      label: 'Próximas 2 semanas',
      description: '14 dias a partir de hoje',
      getRange: () => {
        const start = new Date()
        const end = new Date()
        end.setDate(end.getDate() + 13)
        return { start: toDateInputValue(start), end: toDateInputValue(end) }
      },
    },
    {
      id: 'rest-month',
      label: 'Resto deste mês',
      description: 'De hoje até o fim do mês',
      getRange: () => {
        const start = new Date()
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
        return { start: toDateInputValue(start), end: toDateInputValue(end) }
      },
    },
    {
      id: 'next-month',
      label: 'Próximo mês',
      description: 'Mês calendário completo',
      getRange: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        return { start: toDateInputValue(start), end: toDateInputValue(end) }
      },
    },
  ]
}

function isPresetActive(
  preset: PeriodPreset,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const { start, end } = preset.getRange()
  return rangeStart === start && rangeEnd === end
}

function shiftViewMonth(year: number, month: number, delta: number) {
  const next = new Date(year, month + delta, 1)
  return { year: next.getFullYear(), month: next.getMonth() }
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

type MonthGridProps = {
  year: number
  month: number
  rangeStart: string
  rangeEnd: string
  rangeAnchor: string | null
  hoverDate: string | null
  onDayClick: (iso: string) => void
  onDayHover: (iso: string | null) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onGoToday: () => void
}

function MonthGrid({
  year,
  month,
  rangeStart,
  rangeEnd,
  rangeAnchor,
  hoverDate,
  onDayClick,
  onDayHover,
  onPrevMonth,
  onNextMonth,
  onGoToday,
}: MonthGridProps) {
  const previewStart = rangeAnchor
    ? hoverDate && hoverDate < rangeAnchor
      ? hoverDate
      : rangeAnchor
    : rangeStart
  const previewEnd = rangeAnchor
    ? hoverDate && hoverDate > rangeAnchor
      ? hoverDate
      : hoverDate && hoverDate < rangeAnchor
        ? rangeAnchor
        : rangeAnchor
    : rangeEnd

  const start = parseDateOnly(previewStart)
  const end = parseDateOnly(previewEnd)

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = firstDay.getDay()
  const monthLabel = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const todayIso = toDateInputValue(new Date())

  const cells: Array<{ day: number | null; iso: string; weekday: number }> = []
  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push({ day: null, iso: '', weekday: i })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({ day, iso: toDateInputValue(date), weekday: date.getDay() })
  }

  function dayButtonClass(input: {
    inRange: boolean
    isStart: boolean
    isEnd: boolean
    isToday: boolean
    isWeekend: boolean
    singleDay: boolean
  }) {
    const { inRange, isStart, isEnd, isToday, isWeekend, singleDay } = input

    if (isStart || isEnd) {
      return [
        'z-10 bg-[var(--brand-primary)] text-white font-bold',
        'shadow-[0_6px_16px_rgba(255,107,0,0.32)]',
        singleDay ? 'rounded-xl' : isStart ? 'rounded-l-xl' : 'rounded-r-xl',
      ].join(' ')
    }

    if (inRange) {
      return 'bg-[var(--brand-primary-light)]/55 font-semibold text-[var(--brand-primary)]'
    }

    if (isToday) {
      return 'font-bold text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/25 bg-white'
    }

    if (isWeekend) {
      return 'font-medium text-gray-400 hover:bg-white/80 hover:text-gray-600'
    }

    return 'font-medium text-gray-700 hover:bg-white/90 hover:text-gray-900'
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-[#fafbfd] via-white to-[#f8f9fb] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-gray-200/70">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100/90 bg-white/70 px-2 py-2.5 backdrop-blur-sm sm:px-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold capitalize tracking-tight text-gray-900">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={onGoToday}
            className="mt-0.5 text-[11px] font-semibold text-[var(--brand-primary)] transition hover:underline"
          >
            Ir para hoje
          </button>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-2 grid grid-cols-7">
          {WEEKDAY_LABELS.map((label, index) => (
            <span
              key={label}
              className={[
                'py-1 text-center text-[10px] font-bold uppercase tracking-wider',
                index === 0 || index === 6 ? 'text-gray-400' : 'text-gray-500',
              ].join(' ')}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((cell, index) => {
            if (cell.day === null) {
              return <span key={`blank-${index}`} className="h-10" />
            }

            const date = parseDateOnly(cell.iso)
            const inRange = start && end && date ? date >= start && date <= end : false
            const isStart = cell.iso === previewStart
            const isEnd = cell.iso === previewEnd
            const isToday = cell.iso === todayIso
            const isWeekend = cell.weekday === 0 || cell.weekday === 6
            const singleDay = isStart && isEnd

            return (
              <div key={cell.iso} className="relative h-10 p-0.5">
                <button
                  type="button"
                  onClick={() => onDayClick(cell.iso)}
                  onMouseEnter={() => onDayHover(cell.iso)}
                  onMouseLeave={() => onDayHover(null)}
                  className={[
                    'flex h-full w-full flex-col items-center justify-center text-sm tabular-nums transition duration-150',
                    dayButtonClass({ inRange, isStart, isEnd, isToday, isWeekend, singleDay }),
                  ].join(' ')}
                >
                  <span>{cell.day}</span>
                  {isToday && !isStart && !isEnd && !inRange ? (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--brand-primary)]" />
                  ) : null}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getInitialViewMonth(rangeStart: string) {
  const parsed = parseDateOnly(rangeStart)
  if (parsed) {
    return { year: parsed.getFullYear(), month: parsed.getMonth() }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function AdminEscalaComposePeriodStep({
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  previewShiftCount = 0,
  singleWeekday = null,
}: AdminEscalaComposePeriodStepProps) {
  const presets = useMemo(() => buildPresets(), [])
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const initialView = useMemo(() => getInitialViewMonth(rangeStart), [rangeStart])
  const [viewYear, setViewYear] = useState(initialView.year)
  const [viewMonth, setViewMonth] = useState(initialView.month)

  useEffect(() => {
    const parsed = parseDateOnly(rangeStart)
    if (parsed) {
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
    }
  }, [rangeStart])

  const isValid = isValidEscalaDateRange(rangeStart, rangeEnd)
  const rangeError = escalaDateRangeError(rangeStart, rangeEnd)
  const calendarDays = isValid ? getEscalaRangeDaySpan(rangeStart, rangeEnd) : 0
  const weeksApprox = calendarDays > 0 ? Math.ceil(calendarDays / 7) : 0

  const visibleMonth = useMemo(
    () => ({ year: viewYear, month: viewMonth }),
    [viewYear, viewMonth],
  )

  function applyRange(start: string, end: string) {
    const clampedEnd = clampRangeEnd(start, end)
    onRangeStartChange(start)
    onRangeEndChange(clampedEnd)
  }

  function handleDayClick(iso: string) {
    if (!rangeAnchor) {
      setRangeAnchor(iso)
      applyRange(iso, iso)
      return
    }

    const start = iso < rangeAnchor ? iso : rangeAnchor
    const end = iso < rangeAnchor ? rangeAnchor : iso
    applyRange(start, end)
    setRangeAnchor(null)
    setHoverDate(null)
  }

  function handlePresetSelect(start: string, end: string) {
    setRangeAnchor(null)
    setHoverDate(null)
    applyRange(start, end)
  }

  function handleStartInput(value: string) {
    setRangeAnchor(null)
    setHoverDate(null)
    onRangeStartChange(value)
    if (rangeEnd && value > rangeEnd) {
      onRangeEndChange(value)
    }
  }

  function handleEndInput(value: string) {
    setRangeAnchor(null)
    setHoverDate(null)
    if (rangeStart && value >= rangeStart) {
      onRangeEndChange(clampRangeEnd(rangeStart, value))
    } else {
      onRangeEndChange(value)
    }
  }

  const calendarHint = rangeAnchor
    ? 'Agora clique no dia final do período.'
    : 'Clique no dia inicial e depois no dia final.'

  const singleWeekdayLabel =
    singleWeekday !== null
      ? (adminEscalaWeekdayOptions.find((option) => option.value === singleWeekday)?.label ??
        'dia selecionado')
      : null

  if (singleWeekday !== null && singleWeekdayLabel) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--brand-primary-light)]/45 via-white to-white p-5 ring-1 ring-[var(--brand-primary)]/15 sm:p-6">
          <p className="text-sm font-bold text-gray-900">Repetição semanal</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            O plantão ocorre toda <strong className="text-gray-900">{singleWeekdayLabel}</strong>.
            Informe apenas a primeira e a última data — o sistema gera somente as ocorrências desse
            dia no intervalo, sem precisar marcar o calendário dia a dia.
          </p>
        </div>

        <div className="rounded-2xl bg-[#f8f9fb] p-5 ring-1 ring-gray-200/70 sm:p-6">
          <p className="mb-4 text-sm font-bold text-gray-900">Intervalo de repetição</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={escalaComposeLabelClass} htmlFor="escala-range-start-single">
                Primeira data
              </label>
              <input
                id="escala-range-start-single"
                type="date"
                value={rangeStart}
                onChange={(e) => handleStartInput(e.target.value)}
                className={escalaComposeInputClass}
              />
            </div>
            <div>
              <label className={escalaComposeLabelClass} htmlFor="escala-range-end-single">
                Última data
              </label>
              <input
                id="escala-range-end-single"
                type="date"
                value={rangeEnd}
                onChange={(e) => handleEndInput(e.target.value)}
                className={escalaComposeInputClass}
              />
            </div>
          </div>
          {rangeError ? (
            <p className="mt-3 text-sm text-red-600">{rangeError}</p>
          ) : (
            <p className="mt-3 text-xs text-gray-500">
              Período máximo de {MAX_ESCALA_RANGE_DAYS} dias (~12 meses).
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/80 sm:p-6">
          <p className="mb-3 text-sm font-bold text-gray-900">Atalhos rápidos</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {presets.map((preset) => {
              const active = isPresetActive(preset, rangeStart, rangeEnd)
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const { start, end } = preset.getRange()
                    handlePresetSelect(start, end)
                  }}
                  className={[
                    'rounded-xl px-4 py-3 text-left transition sm:min-w-[10.5rem] sm:flex-1',
                    active
                      ? 'bg-[var(--brand-primary-light)]/50 ring-2 ring-[var(--brand-primary)]'
                      : 'bg-[#f8f9fb] ring-1 ring-gray-200/80 hover:bg-gray-50 hover:ring-gray-300',
                  ].join(' ')}
                >
                  <span className="block text-sm font-semibold text-gray-900">{preset.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{preset.description}</span>
                </button>
              )
            })}
          </div>

          {isValid ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-gray-600">
                De <strong className="text-gray-900">{formatDateBr(rangeStart)}</strong> até{' '}
                <strong className="text-gray-900">{formatDateBr(rangeEnd)}</strong>
              </p>
              {previewShiftCount > 0 ? (
                <p className="text-sm text-gray-600">
                  Serão gerados{' '}
                  <strong className="text-[var(--brand-primary)]">
                    {previewShiftCount} plantão{previewShiftCount === 1 ? '' : 'ões'}
                  </strong>{' '}
                  (toda {singleWeekdayLabel} no intervalo).
                </p>
              ) : (
                <p className="text-sm text-amber-700">
                  Nenhuma {singleWeekdayLabel.toLowerCase()} cai nesse intervalo — ajuste as datas.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8 xl:gap-10">
      <div className="min-w-0 space-y-5">
        <div>
          <p className="mb-3 text-sm font-bold text-gray-900">Atalhos rápidos</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {presets.map((preset) => {
              const active = isPresetActive(preset, rangeStart, rangeEnd)
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const { start, end } = preset.getRange()
                    handlePresetSelect(start, end)
                  }}
                  className={[
                    'rounded-xl px-4 py-3 text-left transition sm:min-w-[10.5rem] sm:flex-1',
                    active
                      ? 'bg-[var(--brand-primary-light)]/50 ring-2 ring-[var(--brand-primary)]'
                      : 'bg-white ring-1 ring-gray-200/80 hover:bg-gray-50 hover:ring-gray-300',
                  ].join(' ')}
                >
                  <span className="block text-sm font-semibold text-gray-900">{preset.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{preset.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-[#f8f9fb] p-5 ring-1 ring-gray-200/70">
          <p className="mb-4 text-sm font-bold text-gray-900">Datas personalizadas</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={escalaComposeLabelClass} htmlFor="escala-range-start">
                Data inicial
              </label>
              <input
                id="escala-range-start"
                type="date"
                value={rangeStart}
                onChange={(e) => handleStartInput(e.target.value)}
                className={escalaComposeInputClass}
              />
            </div>
            <div>
              <label className={escalaComposeLabelClass} htmlFor="escala-range-end">
                Data final
              </label>
              <input
                id="escala-range-end"
                type="date"
                value={rangeEnd}
                onChange={(e) => handleEndInput(e.target.value)}
                className={escalaComposeInputClass}
              />
            </div>
          </div>
          {rangeError ? (
            <p className="mt-3 text-sm text-red-600">{rangeError}</p>
          ) : (
            <p className="mt-3 text-xs text-gray-500">
              Período máximo de {MAX_ESCALA_RANGE_DAYS} dias (~12 meses).
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200/80 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary-light)] to-white text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--brand-primary)]/10">
              <CalendarRange className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Resumo do período</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{calendarHint}</p>
            </div>
          </div>

          <MonthGrid
            year={visibleMonth.year}
            month={visibleMonth.month}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            rangeAnchor={rangeAnchor}
            hoverDate={hoverDate}
            onDayClick={handleDayClick}
            onDayHover={setHoverDate}
            onPrevMonth={() => {
              const prev = shiftViewMonth(viewYear, viewMonth, -1)
              setViewYear(prev.year)
              setViewMonth(prev.month)
            }}
            onNextMonth={() => {
              const next = shiftViewMonth(viewYear, viewMonth, 1)
              setViewYear(next.year)
              setViewMonth(next.month)
            }}
            onGoToday={() => {
              const now = new Date()
              setViewYear(now.getFullYear())
              setViewMonth(now.getMonth())
            }}
          />

          {isValid ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-[#f8f9fb] to-white px-4 py-3.5 ring-1 ring-gray-200/60">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900">
                    {calendarDays}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    dia{calendarDays === 1 ? '' : 's'} no calendário
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[#f8f9fb] to-white px-4 py-3.5 ring-1 ring-gray-200/60">
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-gray-900">
                    {weeksApprox}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    semana{weeksApprox === 1 ? '' : 's'} (aprox.)
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-r from-[var(--brand-primary-light)]/40 via-[var(--brand-primary-light)]/25 to-transparent p-[1px]">
                <div className="space-y-1 rounded-[11px] bg-white/90 px-4 py-3.5 backdrop-blur-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                    De {formatDateBr(rangeStart)} a {formatDateBr(rangeEnd)}
                  </p>
                  <p className="text-sm font-medium capitalize text-gray-800">
                    {formatDateLongBr(rangeStart)}
                  </p>
                  <p className="text-sm text-gray-500">até {formatDateLongBr(rangeEnd)}</p>
                </div>
              </div>

              {previewShiftCount > 0 ? (
                <p className="mt-4 text-sm text-gray-600">
                  Com a programação atual:{' '}
                  <strong className="text-gray-900">
                    {previewShiftCount} plantão{previewShiftCount === 1 ? '' : 'ões'}
                  </strong>{' '}
                  serão gerados.
                </p>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Na próxima etapa você define os plantões que serão repetidos neste intervalo.
                </p>
              )}
            </>
          ) : rangeError ? (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {rangeError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
