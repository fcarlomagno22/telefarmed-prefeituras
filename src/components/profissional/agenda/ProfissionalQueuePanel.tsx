import { Clock3, PhoneOff, Play, Search, Stethoscope, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  dashboardMainPanelMinHeightClass,
  dashboardMainPanelSurfaceClass,
} from '../../layout/dashboardPageLayout'
import {
  endProfissionalShift,
  enterProfissionalShift,
  getProfissionalQueue,
  patchPatientStatus,
  markProfissionalAttendanceOrigin,
  readActiveShiftSession,
  writeActiveAttendanceId,
} from '../../../data/profissionalQueueStore'
import { formatQueueWaitMinutes, useProfissionalQueue } from '../../../hooks/useProfissionalQueue'
import { partitionProfissionalQueue } from '../../../utils/profissional/sortProfissionalQueue'
import type {
  ProfissionalEndShiftSummary,
  ProfissionalQueuePatient,
  ProfissionalQueuePatientStatus,
  ProfissionalShift,
} from '../../../types/profissionalAgenda'
import { startProfissionalAttendanceFromQueue } from '../../../utils/profissional/buildProfissionalAttendance'
import { writeConsultationLockToStorage } from '../../../hooks/useConsultationSessionGuard'
import { maskCpfForDisplay } from '../../../utils/lgpdDisplay'
import { formatScheduledDelayLabel } from '../../../utils/waitingQueueDisplay'
import { ProfissionalEndShiftModal } from './ProfissionalEndShiftModal'
import {
  ProfissionalQueueListTabs,
  profissionalQueueListTabHint,
  type ProfissionalQueueListTab,
} from './ProfissionalQueueListTabs'
import { ProfissionalQueueNoShowModal } from './ProfissionalQueueNoShowModal'
import { PROFISSIONAL_TELEMEDICINE_LABEL } from './profissionalAgendaUi'

type ProfissionalQueuePanelProps = {
  shift: ProfissionalShift
  sessionEnteredAt: string
  onShiftEnded: () => void
  /** Sessão iniciada com "Entrar no plantão". */
  shiftSessionActive?: boolean
  onEnterShift?: () => void
}

const STATUS_BADGE_WIDTH = 'w-[11.5rem]'

const queueActionIconBtnBase = [
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
  'transition-all duration-150',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
].join(' ')

const queueActionBtnConsult = [
  queueActionIconBtnBase,
  'bg-gradient-to-b from-sky-500 to-blue-700 text-white',
  'shadow-[0_2px_10px_rgba(37,99,235,0.35)] ring-1 ring-sky-400/25',
  'hover:brightness-[1.03] hover:shadow-[0_4px_14px_rgba(37,99,235,0.4)]',
  'active:scale-[0.98]',
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:active:scale-100',
].join(' ')

const queueActionBtnNoShow = [
  queueActionIconBtnBase,
  'border border-red-200/90 bg-white text-red-700',
  'shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-red-100/60',
  'hover:border-red-300 hover:bg-red-50 hover:text-red-800',
  'active:scale-[0.98]',
].join(' ')

const queueActionBtnSuccess = [
  queueActionIconBtnBase,
  'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white',
  'shadow-[0_2px_8px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/20',
  'hover:brightness-[1.03] active:scale-[0.98]',
  'disabled:cursor-not-allowed disabled:opacity-45',
].join(' ')

const queueActionBtnGhost = [
  queueActionIconBtnBase,
  'border border-gray-200/80 bg-transparent text-gray-300',
  'shadow-none cursor-default pointer-events-none',
].join(' ')

function QueueActionSlotPlaceholder() {
  return <span className="inline-block h-10 w-10 shrink-0" aria-hidden />
}

const statusConfig: Record<
  ProfissionalQueuePatientStatus,
  { label: string; text: string; accent: string; lineGlow: string }
> = {
  aguardando: {
    label: 'Aguardando',
    text: 'text-orange-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-[#ff6b00]',
    lineGlow: 'shadow-[0_2px_10px_rgba(255,107,0,0.55)]',
  },
  chamado: {
    label: 'Na sala de espera',
    text: 'text-sky-800',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(37,99,235,0.45)]',
  },
  em_atendimento: {
    label: 'Em atendimento',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  finalizado: {
    label: 'Atendido',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  nao_compareceu: {
    label: 'Não compareceu',
    text: 'text-red-600',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
  desistiu: {
    label: 'Desistiu',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
}

function buildEndShiftSummary(
  shiftId: string,
  enteredAt: string,
): ProfissionalEndShiftSummary {
  const patients = getProfissionalQueue(shiftId)
  const entered = new Date(enteredAt).getTime()
  const duracaoPlantaoMin = Math.max(
    1,
    Math.round((Date.now() - entered) / 60_000),
  )

  return {
    atendidos: patients.filter((patient) => patient.status === 'finalizado').length,
    naoCompareceu: patients.filter((patient) => patient.status === 'nao_compareceu')
      .length,
    desistiu: patients.filter((patient) => patient.status === 'desistiu').length,
    tempoMedioMin: 22,
    duracaoPlantaoMin,
  }
}

function filterPatientsByName(query: string, patients: ProfissionalQueuePatient[]) {
  const trimmed = query.trim()
  if (!trimmed) return patients
  const normalized = trimmed.toLowerCase()
  return patients.filter((patient) =>
    patient.patientName.toLowerCase().includes(normalized),
  )
}

function patientInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function rowBackground(status: ProfissionalQueuePatientStatus) {
  switch (status) {
    case 'em_atendimento':
      return 'bg-indigo-50/60'
    case 'chamado':
      return 'bg-sky-50/70'
    case 'aguardando':
      return 'bg-orange-50/60'
    case 'finalizado':
      return 'bg-emerald-50/55'
    case 'nao_compareceu':
      return 'bg-red-50/50'
    default:
      return 'bg-white'
  }
}

function timeColor(status: ProfissionalQueuePatientStatus) {
  switch (status) {
    case 'em_atendimento':
      return 'text-sky-600'
    case 'chamado':
      return 'text-sky-700'
    case 'aguardando':
      return 'text-orange-600'
    case 'nao_compareceu':
      return 'text-red-600'
    default:
      return 'text-gray-900'
  }
}

function formatLocalClock(now: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)
}

function QueueStatusBadge({ status }: { status: ProfissionalQueuePatientStatus }) {
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

type QueuePatientRowProps = {
  patient: ProfissionalQueuePatient
  now: Date
  consultDisabled: boolean
  tourHighlightConsult?: boolean
  onConsult: (patient: ProfissionalQueuePatient) => void
  onRequestNoShow: (patient: ProfissionalQueuePatient) => void
  onContinue: (patient: ProfissionalQueuePatient) => void
}

function QueuePatientRow({
  patient,
  now,
  consultDisabled,
  tourHighlightConsult = false,
  onConsult,
  onRequestNoShow,
  onContinue,
}: QueuePatientRowProps) {
  const inWaitingRoom = patient.status === 'chamado'
  const patientInSalaTone = inWaitingRoom
  const waitMin = formatQueueWaitMinutes(patient.arrivedAt, now)
  const displayTime = patient.scheduledTime ?? '—'
  const delayLabel = patient.scheduledTime
    ? formatScheduledDelayLabel(patient.scheduledTime, now)
    : null

  return (
    <tr className={rowBackground(patient.status)}>
      <td className="align-middle whitespace-nowrap px-3 py-2.5 text-center sm:px-4">
        <div className="mx-auto">
          <span className={`text-sm font-semibold tabular-nums ${timeColor(patient.status)}`}>
            {displayTime}
          </span>
          {delayLabel ? (
            <p
              className={[
                'mt-0.5 text-[11px] font-medium',
                delayLabel.includes('atraso') ? 'text-orange-600' : 'text-gray-500',
              ].join(' ')}
            >
              {delayLabel}
            </p>
          ) : null}
        </div>
      </td>

      <td className="max-w-0 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2.5">
          <span
            className={[
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold shadow-sm',
              patientInSalaTone
                ? 'border-sky-200 bg-sky-50 text-sky-800'
                : 'border-gray-200 bg-white text-gray-600',
            ].join(' ')}
          >
            {patientInitials(patient.patientName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={[
                  'truncate text-sm font-semibold',
                  patientInSalaTone ? 'text-sky-900' : 'text-gray-900',
                ].join(' ')}
              >
                {patient.patientName}
              </p>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  patientInSalaTone
                    ? 'bg-sky-100 text-sky-800 ring-1 ring-sky-200/80'
                    : 'bg-gray-100 text-gray-600',
                ].join(' ')}
              >
                {patient.patientAge} anos
              </span>
            </div>
            <p
              className={[
                'mt-0.5 truncate text-xs',
                patientInSalaTone ? 'text-sky-700' : 'text-gray-500',
              ].join(' ')}
            >
              {maskCpfForDisplay(patient.patientCpf)}
            </p>
            {patient.recallCount > 0 ? (
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Rechamado {patient.recallCount}x
              </p>
            ) : null}
          </div>
        </div>
      </td>

      <td className="hidden align-middle px-3 py-2.5 text-center sm:table-cell sm:px-4">
        {patient.status === 'finalizado' ||
        patient.status === 'nao_compareceu' ||
        patient.status === 'desistiu' ? (
          <span className="text-sm text-gray-400">—</span>
        ) : (
          <div className="mx-auto">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Tempo de espera
            </p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-gray-900">
              {waitMin}
              <span className="ml-0.5 text-sm font-semibold text-gray-500">min</span>
            </p>
          </div>
        )}
      </td>

      <td className="align-middle px-3 py-2.5 text-center sm:px-4">
        <div className="flex justify-center">
          <QueueStatusBadge status={patient.status} />
        </div>
      </td>

      <td className="align-top py-2.5 pl-2 pr-0.5 text-center sm:pl-3">
        <div className="flex h-10 items-center justify-center">
          {patient.status === 'finalizado' ? (
            <button
              type="button"
              disabled
              tabIndex={-1}
              aria-label="Consultar"
              className={queueActionBtnGhost}
            >
              <Stethoscope className="h-4 w-4" strokeWidth={2.15} />
            </button>
          ) : inWaitingRoom ? (
            <button
              type="button"
              disabled={consultDisabled}
              data-tour={tourHighlightConsult ? 'queue-consult-btn' : undefined}
              onClick={() => onConsult(patient)}
              title="Iniciar consulta com o paciente na sala de espera"
              aria-label="Consultar"
              className={queueActionBtnConsult}
            >
              <Stethoscope className="h-4 w-4" strokeWidth={2.15} />
            </button>
          ) : patient.status === 'em_atendimento' && patient.attendanceId ? (
            <button
              type="button"
              onClick={() => onContinue(patient)}
              title="Continuar teleconsulta"
              aria-label="Continuar atendimento"
              className={queueActionBtnSuccess}
            >
              <Play className="h-4 w-4" strokeWidth={2.15} />
            </button>
          ) : patient.status === 'nao_compareceu' || patient.status === 'desistiu' ? (
            <button
              type="button"
              disabled
              tabIndex={-1}
              aria-label="Consultar"
              className={queueActionBtnGhost}
            >
              <Stethoscope className="h-4 w-4" strokeWidth={2.15} />
            </button>
          ) : (
            <QueueActionSlotPlaceholder />
          )}
        </div>
      </td>
      <td className="align-top py-2.5 pl-0.5 pr-2 text-center sm:pr-3">
        <div className="flex h-10 items-center justify-center">
          {patient.status === 'finalizado' ||
          patient.status === 'nao_compareceu' ||
          patient.status === 'desistiu' ? (
            <button
              type="button"
              disabled
              tabIndex={-1}
              aria-label="Não veio"
              className={queueActionBtnGhost}
            >
              <PhoneOff className="h-4 w-4" strokeWidth={2.15} />
            </button>
          ) : patient.status === 'aguardando' || patient.status === 'chamado' ? (
            <button
              type="button"
              onClick={() => onRequestNoShow(patient)}
              title="Marcar como não compareceu"
              aria-label="Não veio"
              className={queueActionBtnNoShow}
            >
              <PhoneOff className="h-4 w-4" strokeWidth={2.15} />
            </button>
          ) : (
            <QueueActionSlotPlaceholder />
          )}
        </div>
      </td>
    </tr>
  )
}

function QueueTableColGroup() {
  return (
    <colgroup>
      <col style={{ width: '4.75rem' }} />
      <col style={{ width: '32%' }} />
      <col className="hidden sm:table-column" style={{ width: '7.5rem' }} />
      <col style={{ width: '8.75rem' }} />
      <col style={{ width: '3rem' }} />
      <col style={{ width: '3rem' }} />
    </colgroup>
  )
}

function QueueTableHead() {
  return (
    <thead className="bg-gray-50/95">
      <tr className="border-b border-gray-200">
        <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4">
          Horário
        </th>
        <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4">
          Paciente
        </th>
        <th className="hidden px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:table-cell sm:px-4">
          Espera
        </th>
        <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4">
          Situação
        </th>
        <th className="py-2.5 pl-2 pr-0.5 text-center text-[10px] font-semibold uppercase leading-tight tracking-wider text-gray-400 sm:pl-3">
          Consultar
        </th>
        <th className="py-2.5 pl-0.5 pr-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-wider text-gray-400 sm:pr-3">
          Não veio
        </th>
      </tr>
    </thead>
  )
}

type QueuePatientTableProps = {
  patients: ProfissionalQueuePatient[]
  now: Date
  consultDisabled: boolean
  emptyMessage: string
  tourConsultPatientId?: string | null
  onConsult: (patient: ProfissionalQueuePatient) => void
  onRequestNoShow: (patient: ProfissionalQueuePatient) => void
  onContinue: (patient: ProfissionalQueuePatient) => void
}

function QueuePatientTable({
  patients,
  now,
  consultDisabled,
  emptyMessage,
  tourConsultPatientId = null,
  onConsult,
  onRequestNoShow,
  onContinue,
}: QueuePatientTableProps) {
  if (patients.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-xs leading-relaxed text-gray-500 sm:px-5">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] table-fixed border-collapse">
        <QueueTableColGroup />
        <QueueTableHead />
        <tbody className="divide-y divide-gray-100">
          {patients.map((patient) => (
            <QueuePatientRow
              key={patient.id}
              patient={patient}
              now={now}
              consultDisabled={consultDisabled}
              tourHighlightConsult={patient.id === tourConsultPatientId}
              onConsult={onConsult}
              onRequestNoShow={onRequestNoShow}
              onContinue={onContinue}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ProfissionalQueuePanel({
  shift,
  sessionEnteredAt,
  onShiftEnded,
  shiftSessionActive = true,
  onEnterShift,
}: ProfissionalQueuePanelProps) {
  const navigate = useNavigate()
  const [endModalOpen, setEndModalOpen] = useState(false)
  const [noShowTarget, setNoShowTarget] = useState<ProfissionalQueuePatient | null>(null)
  const [search, setSearch] = useState('')
  const [queueListTab, setQueueListTab] = useState<ProfissionalQueueListTab>('active')

  const { patients, now, callDisabled, refresh } = useProfissionalQueue(shift.id)

  const filteredPatients = useMemo(
    () => filterPatientsByName(search, patients),
    [search, patients],
  )

  const queuePartition = useMemo(
    () => partitionProfissionalQueue(filteredPatients, now),
    [filteredPatients, now],
  )

  const tabPatients = useMemo(
    () => (queueListTab === 'attended' ? queuePartition.attended : queuePartition.active),
    [queueListTab, queuePartition],
  )

  const tabEmptyMessage =
    queueListTab === 'attended'
      ? 'Nenhuma consulta finalizada ainda.'
      : 'Nenhum paciente aguardando atendimento neste plantão.'

  const waitingCount = patients.filter(
    (patient) => patient.status === 'aguardando' || patient.status === 'chamado',
  ).length

  const localClock = useMemo(() => formatLocalClock(now), [now])
  const hasActiveSearch = search.trim().length > 0
  const showEmptySearchMessage = hasActiveSearch && filteredPatients.length === 0

  const tourConsultPatientId = useMemo(
    () => queuePartition.active.find((patient) => patient.status === 'chamado')?.id ?? null,
    [queuePartition.active],
  )

  const shiftDateLabel = useMemo(() => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(`${shift.dateKey}T12:00:00`))
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }, [shift.dateKey])

  function handleConsult(patient: ProfissionalQueuePatient) {
    if (callDisabled || patient.status !== 'chamado') return

    const activeSession = readActiveShiftSession()
    if (
      !activeSession ||
      activeSession.shiftId !== shift.id ||
      activeSession.endedAt
    ) {
      enterProfissionalShift(shift.id)
    }

    const attendanceId = startProfissionalAttendanceFromQueue(patient, shift)
    patchPatientStatus(shift.id, patient.id, 'em_atendimento', {
      attendanceId,
    })
    writeActiveAttendanceId(attendanceId)
    markProfissionalAttendanceOrigin()
    writeConsultationLockToStorage(true)
    refresh()
    navigate(`/atendimento/${attendanceId}/medico`)
  }

  function handleContinue(patient: ProfissionalQueuePatient) {
    if (!patient.attendanceId) return
    navigate(`/atendimento/${patient.attendanceId}/medico`)
  }

  function handleRequestNoShow(patient: ProfissionalQueuePatient) {
    setNoShowTarget(patient)
  }

  function handleConfirmNoShow() {
    if (!noShowTarget) return
    patchPatientStatus(shift.id, noShowTarget.id, 'nao_compareceu')
    setNoShowTarget(null)
    refresh()
  }

  function handleConfirmEndShift() {
    const summary = buildEndShiftSummary(shift.id, sessionEnteredAt)
    endProfissionalShift(summary)
    writeConsultationLockToStorage(false)
    setEndModalOpen(false)
    onShiftEnded()
  }

  const endSummary = buildEndShiftSummary(shift.id, sessionEnteredAt)

  return (
    <>
      <section
        data-tour="queue-panel"
        className={[
          dashboardMainPanelSurfaceClass,
          dashboardMainPanelMinHeightClass,
          'flex min-h-0 flex-1 flex-col overflow-hidden',
        ].join(' ')}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Fila do plantão</h2>
              <p className="mt-1 text-sm text-gray-500">
                {shift.specialty} · {shift.turnLabel} — {shiftDateLabel}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{PROFISSIONAL_TELEMEDICINE_LABEL}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1">
                  <Clock3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  Agora: <strong className="tabular-nums text-gray-900">{localClock}</strong>
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1">
                  <strong className="tabular-nums text-gray-900">{waitingCount}</strong> na fila
                </span>
              </div>
            </div>
            {shiftSessionActive ? (
              <button
                type="button"
                onClick={() => setEndModalOpen(true)}
                className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Encerrar plantão
              </button>
            ) : onEnterShift ? (
              <button
                type="button"
                onClick={onEnterShift}
                className="shrink-0 rounded-xl bg-gradient-to-b from-[var(--brand-primary)] to-[#ff8c33] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(255,107,0,0.3)] hover:brightness-[1.03]"
              >
                Entrar no plantão
              </button>
            ) : null}
          </div>

          <label className="relative mt-5 block shrink-0" data-tour="queue-search">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>

          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            {showEmptySearchMessage ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
                <p className="text-sm text-gray-500">
                  Nenhum paciente encontrado para &ldquo;{search.trim()}&rdquo;.
                </p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 ring-1 ring-gray-100">
                  <UserRound className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <p className="text-sm font-medium text-gray-700">Fila vazia</p>
                <p className="max-w-[18rem] text-xs leading-relaxed text-gray-500">
                  Os pacientes confirmados na UBT aparecerão aqui na ordem de atendimento.
                </p>
              </div>
            ) : (
              <>
                <ProfissionalQueueListTabs
                  activeTab={queueListTab}
                  onTabChange={setQueueListTab}
                  activeCount={queuePartition.active.length}
                  attendedCount={queuePartition.attended.length}
                />
                <p className="shrink-0 border-b border-gray-100 bg-white px-4 py-2 text-[11px] text-gray-500 sm:px-5">
                  {profissionalQueueListTabHint(queueListTab)}
                </p>
                <div
                  role="tabpanel"
                  className={[
                    'min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain',
                    '[-ms-overflow-style:none] [scrollbar-width:thin]',
                    '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5',
                    '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300',
                    '[&::-webkit-scrollbar-track]:bg-transparent',
                    queueListTab === 'attended' ? 'bg-emerald-50/20' : '',
                  ].join(' ')}
                >
                  <QueuePatientTable
                    patients={tabPatients}
                    now={now}
                    consultDisabled={callDisabled}
                    emptyMessage={tabEmptyMessage}
                    tourConsultPatientId={tourConsultPatientId}
                    onConsult={handleConsult}
                    onRequestNoShow={handleRequestNoShow}
                    onContinue={handleContinue}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-gray-200 px-5 py-3 text-center sm:px-6">
          {callDisabled ? (
            <p className="text-xs font-medium leading-relaxed text-amber-800">
              Consulta em andamento — finalize antes de iniciar outra teleconsulta.
            </p>
          ) : queueListTab === 'active' ? (
            <p className="text-xs font-medium leading-relaxed text-gray-600">
              <span className="font-semibold text-sky-700">Consultar</span> só aparece quando o
              paciente está{' '}
              <span className="font-semibold text-sky-700">Na sala de espera</span>.
            </p>
          ) : (
            <p className="text-xs font-medium leading-relaxed text-emerald-800">
              Pacientes com consulta já finalizada neste plantão.
            </p>
          )}
        </footer>
      </section>

      <ProfissionalEndShiftModal
        open={endModalOpen}
        summary={endSummary}
        onClose={() => setEndModalOpen(false)}
        onConfirm={handleConfirmEndShift}
      />

      <ProfissionalQueueNoShowModal
        open={noShowTarget !== null}
        patient={noShowTarget}
        onClose={() => setNoShowTarget(null)}
        onConfirm={handleConfirmNoShow}
      />
    </>
  )
}
