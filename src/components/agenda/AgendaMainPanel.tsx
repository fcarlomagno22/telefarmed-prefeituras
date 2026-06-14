import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Search,
} from 'lucide-react'
import { AgendaAppointmentActionsMenu } from './AgendaAppointmentActionsMenu'
import { AgendaUpdatingStatusBadge } from './AgendaUpdatingIndicator'
import { AgendaCancelAppointmentModal } from './AgendaCancelAppointmentModal'
import { AgendaMarkNoShowModal } from './AgendaMarkNoShowModal'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppointmentStatus, DayAppointment } from '../../data/agendaMock'
import type { useAgendaDateNavigation } from '../../hooks/useAgendaDateNavigation'
import { useNetworkUserDrawer } from '../../hooks/useNetworkUserDrawer'
import {
  sortAppointmentsBySpecialty,
  sortAppointmentsByStatusOrder,
  sortAppointmentsByTime,
} from '../../utils/agenda/agendaAppointmentSort'
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

type AgendaTableSortKey = 'time' | 'status' | 'specialty'

function AgendaSortableColumnHeader({
  label,
  active,
  activeTitle,
  inactiveTitle,
  onClick,
  className = '',
}: {
  label: string
  active: boolean
  activeTitle: string
  inactiveTitle: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? activeTitle : inactiveTitle}
      className={[
        'inline-flex items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition',
        active
          ? 'text-[var(--brand-primary)]'
          : 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600',
        className,
      ].join(' ')}
    >
      {label}
      <ArrowDownUp
        className={['h-3 w-3 shrink-0', active ? 'opacity-100' : 'opacity-50'].join(' ')}
        strokeWidth={2.25}
        aria-hidden
      />
    </button>
  )
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
  isUpdating: boolean
  sensitiveDataUnlocked: boolean
  displayCpf: (cpf: string) => string
  displayPhone: (phone: string) => string
  actionsOpen: boolean
  onToggleActions: () => void
  onCloseActions: () => void
  onViewDetails: (appointment: DayAppointment) => void
  onReschedule: (appointment: DayAppointment) => void
  onCancel: (appointment: DayAppointment) => void
  onMarkNoShow: (appointment: DayAppointment) => void
  onConfirmArrival: (appointment: DayAppointment) => void
}

function AppointmentRow({
  appointment,
  isUpdating,
  sensitiveDataUnlocked,
  displayCpf,
  displayPhone,
  actionsOpen,
  onToggleActions,
  onCloseActions,
  onViewDetails,
  onReschedule,
  onCancel,
  onMarkNoShow,
  onConfirmArrival,
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
              className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover shadow-sm"
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
          {isUpdating ? (
            <AgendaUpdatingStatusBadge />
          ) : (
            <StatusBadge status={appointment.status} />
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 text-center sm:px-5">
        <AgendaAppointmentActionsMenu
          appointment={appointment}
          isUpdating={isUpdating}
          open={actionsOpen}
          onToggle={onToggleActions}
          onClose={onCloseActions}
          onViewDetails={() => {
            onCloseActions()
            onViewDetails(appointment)
          }}
          onReschedule={() => {
            onCloseActions()
            onReschedule(appointment)
          }}
          onCancel={() => {
            onCloseActions()
            onCancel(appointment)
          }}
          onMarkNoShow={() => {
            onCloseActions()
            onMarkNoShow(appointment)
          }}
          onConfirmArrival={() => {
            onCloseActions()
            onConfirmArrival(appointment)
          }}
        />
      </td>
    </tr>
  )
}

type AgendaAppointmentsTableProps = {
  filteredAppointments: DayAppointment[]
  updatingAppointmentId: string | null
  showEmptySearchMessage: boolean
  searchQuery: string
  sensitiveDataUnlocked: boolean
  displayCpf: (cpf: string) => string
  displayPhone: (phone: string) => string
  onViewDetails: (appointment: DayAppointment) => void
  onReschedule: (appointment: DayAppointment) => void
  onCancel: (appointment: DayAppointment) => void
  onMarkNoShow: (appointment: DayAppointment) => void
  onConfirmArrival: (appointment: DayAppointment) => void
  openActionsId: string | null
  onToggleActions: (appointmentId: string) => void
  onCloseActions: () => void
  sortKey: AgendaTableSortKey
  onToggleSortByTime: () => void
  onToggleSortByStatus: () => void
  onToggleSortBySpecialty: () => void
}

function AgendaAppointmentsTable({
  filteredAppointments,
  updatingAppointmentId,
  showEmptySearchMessage,
  searchQuery,
  sensitiveDataUnlocked,
  displayCpf,
  displayPhone,
  onViewDetails,
  onReschedule,
  onCancel,
  onMarkNoShow,
  onConfirmArrival,
  openActionsId,
  onToggleActions,
  onCloseActions,
  sortKey,
  onToggleSortByTime,
  onToggleSortByStatus,
  onToggleSortBySpecialty,
}: AgendaAppointmentsTableProps) {
  return (
    <table className="w-full min-w-[760px] border-collapse text-left">
      <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
        <tr className="border-b border-gray-200">
          <th className="px-4 py-2.5 text-left sm:px-5">
            <AgendaSortableColumnHeader
              label="Horário"
              active={sortKey === 'time'}
              activeTitle="Ordenado por horário"
              inactiveTitle="Ordenar por horário"
              onClick={onToggleSortByTime}
            />
          </th>
          <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-5">
            Paciente
          </th>
          <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-5">
            Telefone
          </th>
          <th className="hidden px-4 py-2.5 text-center sm:table-cell sm:px-5">
            <AgendaSortableColumnHeader
              label="Especialidade"
              active={sortKey === 'specialty'}
              activeTitle="Ordenado por especialidade (clique para voltar ao horário)"
              inactiveTitle="Ordenar por especialidade"
              onClick={onToggleSortBySpecialty}
              className="mx-auto"
            />
          </th>
          <th className="px-4 py-2.5 text-center sm:px-5">
            <AgendaSortableColumnHeader
              label="Situação"
              active={sortKey === 'status'}
              activeTitle="Ordenado por situação (clique para voltar ao horário)"
              inactiveTitle="Ordenar por situação"
              onClick={onToggleSortByStatus}
              className="mx-auto"
            />
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
              isUpdating={updatingAppointmentId === appointment.id}
              sensitiveDataUnlocked={sensitiveDataUnlocked}
              displayCpf={displayCpf}
              displayPhone={displayPhone}
              actionsOpen={openActionsId === appointment.id}
              onToggleActions={() => onToggleActions(appointment.id)}
              onCloseActions={onCloseActions}
              onViewDetails={onViewDetails}
              onReschedule={onReschedule}
              onCancel={onCancel}
              onMarkNoShow={onMarkNoShow}
              onConfirmArrival={onConfirmArrival}
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
  updatingAppointmentId: string | null
  showEmptySearchMessage: boolean
  sensitiveDataUnlocked: boolean
  onUnlock: () => void
  onLock: () => void
  displayCpf: (cpf: string) => string
  displayPhone: (phone: string) => string
  onViewDetails: (appointment: DayAppointment) => void
  onReschedule: (appointment: DayAppointment) => void
  onCancel: (appointment: DayAppointment) => void
  onMarkNoShow: (appointment: DayAppointment) => void
  onConfirmArrival: (appointment: DayAppointment) => void
  openActionsId: string | null
  onToggleActions: (appointmentId: string) => void
  onCloseActions: () => void
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
  sortKey: AgendaTableSortKey
  onToggleSortByTime: () => void
  onToggleSortByStatus: () => void
  onToggleSortBySpecialty: () => void
  hasAppointmentsOnDate?: (date: Date) => boolean
  onMonthChange?: (year: number, month: number) => void
  referenceToday?: Date
}

function AgendaDaySchedulePanel({
  search,
  onSearchChange,
  filteredAppointments,
  updatingAppointmentId,
  showEmptySearchMessage,
  sensitiveDataUnlocked,
  onUnlock,
  onLock,
  displayCpf,
  displayPhone,
  onViewDetails,
  onReschedule,
  onCancel,
  onMarkNoShow,
  onConfirmArrival,
  openActionsId,
  onToggleActions,
  onCloseActions,
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
  sortKey,
  onToggleSortByTime,
  onToggleSortByStatus,
  onToggleSortBySpecialty,
  hasAppointmentsOnDate,
  onMonthChange,
  referenceToday,
}: AgendaDaySchedulePanelProps) {
  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`.trim()}>
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
          <AgendaDatePicker
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            referenceToday={referenceToday}
            hasAppointmentsOnDate={hasAppointmentsOnDate}
            onMonthChange={onMonthChange}
          />
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

      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200">
        <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-4 py-2 sm:px-5">
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

        <div
          className={[
            'min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-auto overscroll-contain',
            '[-ms-overflow-style:none] [scrollbar-width:thin]',
            '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5',
            '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300',
            '[&::-webkit-scrollbar-track]:bg-transparent',
          ].join(' ')}
        >
          <AgendaAppointmentsTable
            filteredAppointments={filteredAppointments}
            updatingAppointmentId={updatingAppointmentId}
            showEmptySearchMessage={showEmptySearchMessage}
            searchQuery={search.trim()}
            sensitiveDataUnlocked={sensitiveDataUnlocked}
            displayCpf={displayCpf}
            displayPhone={displayPhone}
            onViewDetails={onViewDetails}
            onReschedule={onReschedule}
            onCancel={onCancel}
            onMarkNoShow={onMarkNoShow}
            onConfirmArrival={onConfirmArrival}
            openActionsId={openActionsId}
            onToggleActions={onToggleActions}
            onCloseActions={onCloseActions}
            sortKey={sortKey}
            onToggleSortByTime={onToggleSortByTime}
            onToggleSortByStatus={onToggleSortByStatus}
            onToggleSortBySpecialty={onToggleSortBySpecialty}
          />
        </div>
      </div>
    </div>
  )
}

export type AgendaNetworkUserDrawer = Pick<
  ReturnType<typeof useNetworkUserDrawer>,
  | 'sensitiveDataUnlocked'
  | 'lockSensitiveData'
  | 'openUnlockModal'
  | 'openUser'
  | 'openUserWithPacienteDetail'
  | 'drawerLayer'
>

type AgendaMainPanelProps = {
  agendaDate: AgendaDateNavigation
  appointments: DayAppointment[]
  updatingAppointmentId?: string | null
  networkUserDrawer: AgendaNetworkUserDrawer
  onRescheduleAppointment: (appointment: DayAppointment) => void
  onCancelAppointment: (appointment: DayAppointment) => void
  onMarkNoShowAppointment: (appointment: DayAppointment) => void
  onOpenReception: (appointment: DayAppointment) => void
  hasAppointmentsOnDate?: (date: Date) => boolean
  onMonthChange?: (year: number, month: number) => void
}

export function AgendaMainPanel({
  agendaDate,
  appointments,
  updatingAppointmentId = null,
  networkUserDrawer,
  onRescheduleAppointment,
  onCancelAppointment,
  onMarkNoShowAppointment,
  onOpenReception,
  hasAppointmentsOnDate,
  onMonthChange,
}: AgendaMainPanelProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<AgendaTableSortKey>('time')
  const {
    sensitiveDataUnlocked,
    lockSensitiveData,
    openUnlockModal,
    openUser,
    openUserWithPacienteDetail,
    drawerLayer,
  } = networkUserDrawer

  const [openActionsId, setOpenActionsId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<DayAppointment | null>(null)
  const [noShowTarget, setNoShowTarget] = useState<DayAppointment | null>(null)

  const filteredAppointments = useMemo(() => {
    const filtered = filterAppointmentsByName(search, appointments)
    if (sortKey === 'time') return sortAppointmentsByTime(filtered)
    if (sortKey === 'status') return sortAppointmentsByStatusOrder(filtered)
    if (sortKey === 'specialty') return sortAppointmentsBySpecialty(filtered)
    return filtered
  }, [search, appointments, sortKey])

  useEffect(() => {
    setSearch('')
    setSortKey('time')
    setOpenActionsId(null)
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
    const fallbackUser = findNetworkUserForAppointment(appointment)
    if (appointment.pacienteId) {
      openUserWithPacienteDetail(appointment.pacienteId, fallbackUser)
      return
    }
    openUser(fallbackUser)
  }

  function handleToggleActions(appointmentId: string) {
    setOpenActionsId((current) => (current === appointmentId ? null : appointmentId))
  }

  function handleReschedule(appointment: DayAppointment) {
    onRescheduleAppointment(appointment)
  }

  function handleConfirmCancel() {
    if (!cancelTarget) return
    onCancelAppointment(cancelTarget)
    setCancelTarget(null)
  }

  function handleConfirmNoShow() {
    if (!noShowTarget) return
    onMarkNoShowAppointment(noShowTarget)
    setNoShowTarget(null)
  }

  const schedulePanelProps = {
    search,
    onSearchChange: setSearch,
    filteredAppointments,
    updatingAppointmentId,
    showEmptySearchMessage,
    sensitiveDataUnlocked,
    onUnlock: openUnlockModal,
    onLock: () => lockSensitiveData(),
    displayCpf,
    displayPhone,
    onViewDetails: handleViewDetails,
    onReschedule: handleReschedule,
    onCancel: setCancelTarget,
    onMarkNoShow: setNoShowTarget,
    onConfirmArrival: onOpenReception,
    openActionsId,
    onToggleActions: handleToggleActions,
    onCloseActions: () => setOpenActionsId(null),
    dayLabel: agendaDate.dayLabel,
    isToday: agendaDate.isToday,
    selectedDate: agendaDate.selectedDate,
    onGoToToday: agendaDate.goToToday,
    onGoToPreviousDay: agendaDate.goToPreviousDay,
    onGoToNextDay: agendaDate.goToNextDay,
    onSelectDate: agendaDate.goToDate,
    sortKey,
    onToggleSortByTime: () => setSortKey('time'),
    onToggleSortByStatus: () =>
      setSortKey((current) => (current === 'status' ? 'time' : 'status')),
    onToggleSortBySpecialty: () =>
      setSortKey((current) => (current === 'specialty' ? 'time' : 'specialty')),
    hasAppointmentsOnDate,
    onMonthChange,
    referenceToday: agendaDate.referenceToday,
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <section className="relative flex h-full min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <AgendaDaySchedulePanel
          {...schedulePanelProps}
          isFullscreen={false}
          onToggleFullscreen={() => setIsFullscreen(true)}
          className="min-h-0 flex-1 overflow-hidden px-5 py-5 sm:px-6 sm:py-6"
        />
      </section>

      {isFullscreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9990] flex flex-col bg-[#f5f6f8] p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Agenda do dia em tela cheia"
          >
            <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
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

      <AgendaCancelAppointmentModal
        open={cancelTarget !== null}
        appointment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
      />

      <AgendaMarkNoShowModal
        open={noShowTarget !== null}
        appointment={noShowTarget}
        onClose={() => setNoShowTarget(null)}
        onConfirm={handleConfirmNoShow}
      />

      {drawerLayer}
    </div>
  )
}
