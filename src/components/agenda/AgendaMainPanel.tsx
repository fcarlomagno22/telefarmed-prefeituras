import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { brand } from '../../config/brand'
import type { AppointmentStatus, DayAppointment } from '../../data/agendaMock'
import type { useAgendaDateNavigation } from '../../hooks/useAgendaDateNavigation'
import { useNetworkUserDrawer } from '../../hooks/useNetworkUserDrawer'
import { findNetworkUserForAppointment } from '../../utils/agendaPatientUser'
import { maskCpfForDisplay, maskPhoneForDisplay } from '../../utils/lgpdDisplay'
import { AgendaDatePicker } from './AgendaDatePicker'

const STATUS_BADGE_WIDTH = 'w-[9rem]'

const statusConfig: Record<
  AppointmentStatus,
  { label: string; text: string; accent: string; lineGlow: string }
> = {
  realizado: {
    label: 'Realizado',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  em_atendimento: {
    label: 'Em atendimento',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  aguardando: {
    label: 'Aguardando',
    text: 'text-orange-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-[#ff6b00]',
    lineGlow: 'shadow-[0_2px_10px_rgba(255,107,0,0.55)]',
  },
  agendado: {
    label: 'Agendado',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
  faltou: {
    label: 'Faltou',
    text: 'text-red-600',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
}

function rowBackground(status: AppointmentStatus) {
  switch (status) {
    case 'em_atendimento':
      return 'bg-sky-50/70'
    case 'aguardando':
      return 'bg-orange-50/60'
    case 'faltou':
      return 'bg-red-50/50'
    default:
      return 'bg-white'
  }
}

function timeColor(status: AppointmentStatus) {
  switch (status) {
    case 'em_atendimento':
      return 'text-sky-600'
    case 'aguardando':
      return 'text-orange-600'
    case 'faltou':
      return 'text-red-600'
    default:
      return 'text-gray-900'
  }
}

function filterAppointmentsByName(query: string, appointments: DayAppointment[]) {
  const trimmed = query.trim()
  if (!trimmed) return appointments

  const normalized = trimmed.toLowerCase()
  return appointments.filter((appointment) =>
    appointment.patientName.toLowerCase().includes(normalized),
  )
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={[
        'relative inline-flex h-8 items-center justify-center overflow-hidden rounded-lg bg-transparent px-2 pb-2 text-xs font-semibold',
        STATUS_BADGE_WIDTH,
        config.text,
      ].join(' ')}
    >
      {config.label}
      <span
        className={`absolute inset-x-0 bottom-0 h-[3px] ${config.accent} ${config.lineGlow}`}
        aria-hidden
      />
    </span>
  )
}

type AppointmentRowProps = {
  appointment: DayAppointment
  sensitiveDataUnlocked: boolean
  displayCpf: (cpf: string) => string
  displayPhone: (phone: string) => string
  onViewDetails: (appointment: DayAppointment) => void
}

function AppointmentRow({
  appointment,
  sensitiveDataUnlocked,
  displayCpf,
  displayPhone,
  onViewDetails,
}: AppointmentRowProps) {
  const patient = findNetworkUserForAppointment(appointment)

  return (
    <tr className={rowBackground(appointment.status)}>
      <td className="whitespace-nowrap px-4 py-2.5 sm:px-5">
        <span className={`text-sm font-semibold tabular-nums ${timeColor(appointment.status)}`}>
          {appointment.time}
        </span>
      </td>
      <td className="px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-3">
          {patient.avatarUrl ? (
            <img
              src={patient.avatarUrl}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-full border border-gray-100 object-cover shadow-sm"
            />
          ) : (
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${patient.avatarClassName}`}
            >
              {patient.initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{appointment.patientName}</p>
            <p
              className={`mt-0.5 text-xs ${
                sensitiveDataUnlocked ? 'text-sky-600' : 'text-gray-500'
              }`}
            >
              {displayCpf(appointment.patientCpf)}
            </p>
          </div>
        </div>
      </td>
      <td
        className={`whitespace-nowrap px-4 py-2.5 text-center text-sm sm:px-5 ${
          sensitiveDataUnlocked ? 'text-sky-600' : 'text-gray-600'
        }`}
      >
        {displayPhone(appointment.patientPhone)}
      </td>
      <td className="hidden px-4 py-2.5 text-center text-sm text-gray-600 sm:table-cell sm:px-5">
        {appointment.serviceType}
      </td>
      <td className="px-4 py-2.5 text-center sm:px-5">
        <div className="flex justify-center">
          <StatusBadge status={appointment.status} />
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 text-center sm:px-5">
        <button
          type="button"
          onClick={() => onViewDetails(appointment)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
          Ver detalhes
        </button>
      </td>
    </tr>
  )
}

type AgendaAppointmentsTableProps = {
  filteredAppointments: DayAppointment[]
  showEmptySearchMessage: boolean
  searchQuery: string
  sensitiveDataUnlocked: boolean
  displayCpf: (cpf: string) => string
  displayPhone: (phone: string) => string
  onViewDetails: (appointment: DayAppointment) => void
}

function AgendaAppointmentsTable({
  filteredAppointments,
  showEmptySearchMessage,
  searchQuery,
  sensitiveDataUnlocked,
  displayCpf,
  displayPhone,
  onViewDetails,
}: AgendaAppointmentsTableProps) {
  return (
    <table className="w-full min-w-[760px] border-collapse text-left">
      <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
        <tr className="border-b border-gray-100">
          <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-5">
            Horário
          </th>
          <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-5">
            Paciente
          </th>
          <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-5">
            Telefone
          </th>
          <th className="hidden px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:table-cell sm:px-5">
            Tipo de atendimento
          </th>
          <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-5">
            Situação
          </th>
          <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-5">
            Ação
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {showEmptySearchMessage ? (
          <tr>
            <td colSpan={6} className="px-4 py-16 text-center text-sm text-gray-500 sm:px-5">
              Nenhum paciente encontrado para &ldquo;{searchQuery}&rdquo;.
            </td>
          </tr>
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentRow
              key={appointment.id}
              appointment={appointment}
              sensitiveDataUnlocked={sensitiveDataUnlocked}
              displayCpf={displayCpf}
              displayPhone={displayPhone}
              onViewDetails={onViewDetails}
            />
          ))
        )}
      </tbody>
    </table>
  )
}

type AgendaDateNavigation = ReturnType<typeof useAgendaDateNavigation>

type AgendaDaySchedulePanelProps = {
  search: string
  onSearchChange: (value: string) => void
  filteredAppointments: DayAppointment[]
  showEmptySearchMessage: boolean
  sensitiveDataUnlocked: boolean
  onUnlock: () => void
  onLock: () => void
  displayCpf: (cpf: string) => string
  displayPhone: (phone: string) => string
  onViewDetails: (appointment: DayAppointment) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  dayLabel: string
  isToday: boolean
  selectedDate: Date
  onGoToToday: () => void
  onGoToPreviousDay: () => void
  onGoToNextDay: () => void
  onSelectDate: (date: Date) => void
  className?: string
}

function AgendaDaySchedulePanel({
  search,
  onSearchChange,
  filteredAppointments,
  showEmptySearchMessage,
  sensitiveDataUnlocked,
  onUnlock,
  onLock,
  displayCpf,
  displayPhone,
  onViewDetails,
  isFullscreen,
  onToggleFullscreen,
  dayLabel,
  isToday,
  selectedDate,
  onGoToToday,
  onGoToPreviousDay,
  onGoToNextDay,
  onSelectDate,
  className = '',
}: AgendaDaySchedulePanelProps) {
  return (
    <div className={`flex min-h-0 flex-col ${className}`.trim()}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Agenda do dia</h2>
          <p className="mt-1 text-sm text-gray-500">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onGoToToday}
            disabled={isToday}
            className={[
              'rounded-lg border px-3 py-2 text-xs font-medium transition',
              isToday
                ? 'cursor-default border-[var(--brand-primary)]/30 bg-orange-50 text-[var(--brand-primary)]'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={onGoToPreviousDay}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onGoToNextDay}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
          <AgendaDatePicker selectedDate={selectedDate} onSelectDate={onSelectDate} />
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Expandir lista em tela cheia'}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[var(--brand-primary)]/30 hover:bg-orange-50 hover:text-[var(--brand-primary)]"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      <label className="relative mt-5 block shrink-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          strokeWidth={2}
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
        />
      </label>

      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100">
        <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-2 sm:px-5">
          {!sensitiveDataUnlocked ? (
            <>
              <span className="mr-auto text-xs text-gray-500">
                CPF e telefone mascarados conforme a LGPD.
              </span>
              <button
                type="button"
                onClick={onUnlock}
                className="text-sm font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
              >
                Ver dados
              </button>
            </>
          ) : (
            <>
              <span className="mr-auto text-xs font-medium text-emerald-600">
                Dados pessoais visíveis
              </span>
              <button
                type="button"
                onClick={onLock}
                className="text-sm font-semibold text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
              >
                Ocultar dados
              </button>
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain">
          <AgendaAppointmentsTable
            filteredAppointments={filteredAppointments}
            showEmptySearchMessage={showEmptySearchMessage}
            searchQuery={search.trim()}
            sensitiveDataUnlocked={sensitiveDataUnlocked}
            displayCpf={displayCpf}
            displayPhone={displayPhone}
            onViewDetails={onViewDetails}
          />
        </div>
      </div>
    </div>
  )
}

export type AgendaNetworkUserDrawer = Pick<
  ReturnType<typeof useNetworkUserDrawer>,
  | 'sensitiveDataUnlocked'
  | 'setSensitiveDataUnlocked'
  | 'openUnlockModal'
  | 'openUser'
  | 'drawerLayer'
>

type AgendaMainPanelProps = {
  agendaDate: AgendaDateNavigation
  networkUserDrawer: AgendaNetworkUserDrawer
}

export function AgendaMainPanel({ agendaDate, networkUserDrawer }: AgendaMainPanelProps) {
  const illustrationUrl = brand.dashboardAgendaImageUrl
  const [search, setSearch] = useState('')
  const {
    sensitiveDataUnlocked,
    setSensitiveDataUnlocked,
    openUnlockModal,
    openUser,
    drawerLayer,
  } = networkUserDrawer

  const appointments = agendaDate.dayData.appointments

  const filteredAppointments = useMemo(
    () => filterAppointmentsByName(search, appointments),
    [search, appointments],
  )

  useEffect(() => {
    setSearch('')
  }, [agendaDate.selectedDate])

  const [isFullscreen, setIsFullscreen] = useState(false)
  const hasActiveSearch = search.trim().length > 0
  const showEmptySearchMessage = hasActiveSearch && filteredAppointments.length === 0

  useEffect(() => {
    if (!isFullscreen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsFullscreen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  function displayCpf(cpf: string) {
    return sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)
  }

  function displayPhone(phone: string) {
    return sensitiveDataUnlocked ? phone : maskPhoneForDisplay(phone)
  }

  function handleViewDetails(appointment: DayAppointment) {
    openUser(findNetworkUserForAppointment(appointment))
  }

  const schedulePanelProps = {
    search,
    onSearchChange: setSearch,
    filteredAppointments,
    showEmptySearchMessage,
    sensitiveDataUnlocked,
    onUnlock: openUnlockModal,
    onLock: () => setSensitiveDataUnlocked(false),
    displayCpf,
    displayPhone,
    onViewDetails: handleViewDetails,
    dayLabel: agendaDate.dayLabel,
    isToday: agendaDate.isToday,
    selectedDate: agendaDate.selectedDate,
    onGoToToday: agendaDate.goToToday,
    onGoToPreviousDay: agendaDate.goToPreviousDay,
    onGoToNextDay: agendaDate.goToNextDay,
    onSelectDate: agendaDate.goToDate,
  }

  return (
    <>
      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <AgendaDaySchedulePanel
          {...schedulePanelProps}
          isFullscreen={false}
          onToggleFullscreen={() => setIsFullscreen(true)}
          className="min-h-0 flex-1 px-5 py-5 sm:px-6 sm:py-6"
        />

        <div className="shrink-0 border-t border-gray-100 px-5 pt-5 sm:px-6 sm:pt-6 pb-5">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Histórico de agendas</h2>
              <p className="mt-1 text-sm text-gray-500">
                Visualize os atendimentos dos últimos dias.
              </p>
            </div>
            <a
              href="#"
              className="shrink-0 text-sm font-semibold text-[var(--brand-primary)] underline-offset-2 transition hover:text-[var(--brand-primary-hover)] hover:underline"
            >
              Ver mais
            </a>
          </header>

          <div className="mt-4 grid grid-cols-1 gap-4 pb-2 xl:grid-cols-[minmax(0,1fr)_minmax(180px,280px)] xl:items-end xl:gap-6">
            <ul className="min-w-0 space-y-2">
              {agendaDate.history.map((day) => (
                <li
                  key={day.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-2 transition hover:border-gray-200 hover:bg-gray-50/80 sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[var(--brand-primary)]">
                    <FileText className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{day.weekdayLabel}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {day.total} atendimentos • {day.completed} realizados • {day.noShows}{' '}
                      faltas
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 self-start text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 sm:self-center"
                  >
                    Ver relatório &gt;
                  </button>
                </li>
              ))}
            </ul>

            <img
              src={illustrationUrl}
              alt=""
              aria-hidden
              className="pointer-events-none mx-auto h-36 w-auto max-w-[220px] object-contain object-bottom sm:h-40 sm:max-w-[240px] xl:mx-0 xl:ml-auto xl:h-52 xl:max-w-[300px]"
            />
          </div>
        </div>
      </section>

      {isFullscreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9990] flex flex-col bg-[#f5f6f8] p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Agenda do dia em tela cheia"
          >
            <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <AgendaDaySchedulePanel
                {...schedulePanelProps}
                isFullscreen
                onToggleFullscreen={() => setIsFullscreen(false)}
                className="min-h-0 flex-1 px-5 py-5 sm:px-6 sm:py-6"
              />
            </article>
          </div>,
          document.body,
        )}

      {drawerLayer}
    </>
  )
}
