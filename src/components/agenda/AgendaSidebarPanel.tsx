import { Download, Plus, Printer, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AgendaDaySummary, AgendaHistoryDay, AgendaOperationalClimate } from '../../data/agendaMock'
import { AgendaDayPixelChart } from './AgendaDayPixelChart'
import { AgendaHistoryCard } from './AgendaHistoryCard'
import { AgendaOperationalClimateCard } from './AgendaOperationalClimateCard'

type AgendaSidebarPanelProps = {
  daySummary: AgendaDaySummary
  operationalClimate: AgendaOperationalClimate
  history?: AgendaHistoryDay[]
  selectedDateKey?: string
  onSelectHistoryDay?: (dateKey: string) => void
  onScheduleAppointment?: () => void
  onWalkInReception?: () => void
  walkInReceptionDisabled?: boolean
  onPrintAgenda?: () => void
  onExportReport?: () => void
  isPreparingPrint?: boolean
}

function formatStat(value: number) {
  return value.toString().padStart(2, '0')
}

const quickActions = [
  {
    icon: Printer,
    title: 'Imprimir agenda',
    subtitle: 'Imprimir agenda do dia',
  },
  {
    icon: Download,
    title: 'Exportar relatório',
    subtitle: 'PDF do relatório completo',
  },
] as const

export function AgendaSidebarPanel({
  daySummary,
  operationalClimate,
  history = [],
  selectedDateKey = '',
  onSelectHistoryDay,
  onScheduleAppointment,
  onWalkInReception,
  walkInReceptionDisabled = false,
  onPrintAgenda,
  onExportReport,
  isPreparingPrint = false,
}: AgendaSidebarPanelProps) {
  const [attendanceAnimate, setAttendanceAnimate] = useState(false)

  useEffect(() => {
    setAttendanceAnimate(false)
    const timer = window.setTimeout(() => setAttendanceAnimate(true), 120)
    return () => window.clearTimeout(timer)
  }, [daySummary.attendanceRate, daySummary.total])

  return (
    <aside className="flex w-full flex-col gap-4">
      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <h2 className="text-lg font-bold text-gray-900">Ações rápidas</h2>

        <div className="mt-4 space-y-2.5">
          <button
            type="button"
            onClick={onScheduleAppointment}
            className="flex w-full items-center gap-3 rounded-xl bg-[var(--brand-primary)] px-4 py-3.5 text-left shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">Agendar consulta</span>
              <span className="mt-0.5 block text-xs text-white/85">Agendar novo atendimento</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onWalkInReception}
            disabled={walkInReceptionDisabled || !onWalkInReception}
            title={
              walkInReceptionDisabled
                ? 'Encaixe presencial disponível apenas na agenda de hoje'
                : undefined
            }
            className={[
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition',
              walkInReceptionDisabled || !onWalkInReception
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                : 'border-sky-200 bg-gradient-to-r from-sky-50 to-white shadow-sm hover:border-sky-300 hover:from-sky-100/80',
            ].join(' ')}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <UserPlus className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-sky-900">
                Recepção presencial
              </span>
              <span className="mt-0.5 block text-xs text-sky-700/90">Encaixe com médico e horário</span>
            </span>
          </button>

          {quickActions.map((action) => {
            const Icon = action.icon
            const isPrint = action.title === 'Imprimir agenda'
            const isExport = action.title === 'Exportar relatório'
            const isBusy = isPreparingPrint && (isPrint || isExport)

            return (
              <button
                key={action.title}
                type="button"
                disabled={isBusy}
                onClick={
                  isPrint ? onPrintAgenda : isExport ? onExportReport : undefined
                }
                className={[
                  'flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition',
                  isBusy
                    ? 'cursor-wait opacity-70'
                    : 'hover:border-gray-300 hover:bg-gray-50/80',
                ].join(' ')}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">
                    {isBusy ? 'Abrindo impressão…' : action.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {isBusy ? 'Aguarde um instante' : action.subtitle}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <h2 className="text-lg font-bold text-gray-900">Resumo do dia</h2>

        <div className="mt-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <span className="text-sm text-gray-600">Total de agendamentos</span>
          <span className="text-2xl font-bold tabular-nums text-gray-900">
            {formatStat(daySummary.total)}
          </span>
        </div>

        <AgendaDayPixelChart className="mt-4 overflow-visible pt-1" summary={daySummary} />

        <div className="mt-5 border-t border-gray-200 pt-4">
          <div className="flex items-end justify-between gap-2">
            <span className="text-sm text-gray-600">Taxa de comparecimento</span>
            <span
              className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-2xl font-bold text-transparent transition-opacity duration-700"
              style={{
                opacity: attendanceAnimate ? 1 : 0,
                transitionDelay: '0.5s',
              }}
            >
              {daySummary.attendanceRate}%
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.35)] transition-[width] duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ width: attendanceAnimate ? `${daySummary.attendanceRate}%` : '0%' }}
            />
          </div>
        </div>
      </section>

      <AgendaOperationalClimateCard operationalClimate={operationalClimate} />

      <AgendaHistoryCard
        history={history}
        selectedDateKey={selectedDateKey}
        onSelectDay={onSelectHistoryDay}
      />
    </aside>
  )
}
