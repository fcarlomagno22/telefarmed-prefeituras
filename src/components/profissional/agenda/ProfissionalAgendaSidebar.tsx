import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  RefreshCw,
  Shield,
  Sparkles,
} from 'lucide-react'
import type {
  ProfissionalAgendaNotice,
  ProfissionalShift,
} from '../../../types/profissionalAgenda'
import { parseDateKey } from '../../../utils/agendaDate'
import {
  PROFISSIONAL_TELEMEDICINE_LABEL,
  profissionalAgendaPanelClass,
} from './profissionalAgendaUi'

const noticeIcon = {
  troca: RefreshCw,
  cancelamento: AlertTriangle,
  reserva: Shield,
} as const

const doctorsIllustrationUrl = `${import.meta.env.BASE_URL}doctors.png`

type ProfissionalAgendaSidebarProps = {
  notices: ProfissionalAgendaNotice[]
  upcomingShifts: ProfissionalShift[]
  monthSummaryLabel: string
  monthShiftCount: number
  monthTitularCount: number
  monthReservaCount: number
  monthWeekDistribution: number[]
  selectedDateKey: string
  onSelectDate: (dateKey: string) => void
}

function formatShiftDayShort(dateKey: string): string {
  const date = parseDateKey(dateKey)
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
    .format(date)
    .replace('.', '')
  const day = date.getDate()
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace('.', '')
  return `${weekday}, ${day} ${month}`
}

function ProfissionalAgendaNotices({ notices }: { notices: ProfissionalAgendaNotice[] }) {
  if (notices.length === 0) return null

  return (
    <section className={[profissionalAgendaPanelClass, 'shrink-0 p-4'].join(' ')}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avisos</h3>
      <ul className="mt-2 space-y-2">
        {notices.slice(0, 4).map((notice) => {
          const Icon = noticeIcon[notice.type]
          return (
            <li
              key={notice.id}
              className="flex gap-2.5 rounded-lg border-l-2 bg-gray-50/80 py-2 pl-2.5 pr-2"
              style={{
                borderLeftColor:
                  notice.type === 'cancelamento'
                    ? '#fca5a5'
                    : notice.type === 'reserva'
                      ? '#c4b5fd'
                      : '#7dd3fc',
              }}
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800">{notice.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">
                  {notice.body}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function ProfissionalAgendaSidebar({
  notices,
  upcomingShifts,
  monthSummaryLabel,
  monthShiftCount,
  monthTitularCount,
  monthReservaCount,
  monthWeekDistribution,
  selectedDateKey,
  onSelectDate,
}: ProfissionalAgendaSidebarProps) {
  return (
    <aside data-tour="agenda-sidebar" className="flex w-full flex-col gap-3 xl:gap-4">
      <section
        className={[
          profissionalAgendaPanelClass,
          'shrink-0 overflow-hidden bg-gradient-to-br from-[var(--brand-primary-light)]/50 via-white to-white p-4',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-orange-100">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {monthSummaryLabel}
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-gray-900">
              {monthShiftCount}
              <span className="ml-1 text-sm font-semibold text-gray-500">plantões</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-white/80 px-2 py-2 ring-1 ring-orange-100/80">
            <p className="text-lg font-bold text-gray-900">{monthTitularCount}</p>
            <p className="text-[10px] font-medium text-gray-500">Como titular</p>
          </div>
          <div className="rounded-xl bg-white/80 px-2 py-2 ring-1 ring-violet-100/80">
            <p className="text-lg font-bold text-violet-700">{monthReservaCount}</p>
            <p className="text-[10px] font-medium text-gray-500">Como reserva</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Distribuição no mês
          </p>
          <MonthWeekChart bars={monthWeekDistribution} />
        </div>
      </section>

      <ProfissionalAgendaNotices notices={notices} />

      <section
        className={[profissionalAgendaPanelClass, 'flex flex-col overflow-hidden'].join(' ')}
      >
        <div className="shrink-0 border-b border-gray-100 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <CalendarDays className="h-4 w-4 text-[var(--brand-primary)]" />
            Próximos plantões
          </h3>
        </div>

        <div className="px-3 py-2">
          {upcomingShifts.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs leading-relaxed text-gray-500">
              Nenhum plantão publicado nos próximos dias.
            </p>
          ) : (
            <ul className="relative space-y-0 pb-1">
              <span
                className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-[var(--brand-primary)]/40 to-gray-200"
                aria-hidden
              />
              {upcomingShifts.map((shift) => {
                const isSelected = shift.dateKey === selectedDateKey
                return (
                  <li key={shift.id}>
                    <button
                      type="button"
                      onClick={() => onSelectDate(shift.dateKey)}
                      className={[
                        'group flex w-full items-start gap-3 rounded-xl py-2 pl-0 pr-1 text-left transition',
                        isSelected ? 'bg-orange-50/80' : 'hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'relative z-[1] mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white',
                          shift.role === 'reserva'
                            ? 'bg-violet-500'
                            : 'bg-[var(--brand-primary)]',
                        ].join(' ')}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {formatShiftDayShort(shift.dateKey)}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 transition group-hover:text-[var(--brand-primary)]" />
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold text-[var(--brand-primary)]">
                          {shift.specialty}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-gray-500">
                          {shift.startTime} – {shift.endTime} · {shift.turnLabel}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-gray-400">
                          {PROFISSIONAL_TELEMEDICINE_LABEL}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="relative shrink-0 overflow-hidden border-t border-orange-100/70 bg-gradient-to-t from-[var(--brand-primary-light)]/25 via-white to-white px-2 pt-2">
          <img
            src={doctorsIllustrationUrl}
            alt=""
            className="pointer-events-none mx-auto h-28 w-full max-w-[16rem] object-contain object-bottom sm:h-32"
          />
        </div>
      </section>
    </aside>
  )
}

function MonthWeekChart({ bars }: { bars: number[] }) {
  const max = Math.max(1, ...bars)

  return (
    <div className="flex h-14 items-end justify-between gap-2">
      {bars.map((value, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className="w-full max-w-[1.5rem] rounded-t-md bg-gradient-to-t from-[var(--brand-primary)] to-orange-300 transition-all"
            style={{ height: `${Math.max(value > 0 ? 10 : 4, (value / max) * 48)}px` }}
            title={`${value} plantão(ões)`}
          />
          <span className="text-[9px] font-medium text-gray-400">S{index + 1}</span>
        </div>
      ))}
    </div>
  )
}
