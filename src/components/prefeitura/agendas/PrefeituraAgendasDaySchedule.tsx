import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppointmentStatus, DayAppointment } from '../../../data/agendaMock'
import { AgendaDatePicker } from '../../agenda/AgendaDatePicker'
import { CustomSelect } from '../../ui/CustomSelect'
import { Toast } from '../../ui/Toast'
import { LgpdUnlockModal } from '../../users/LgpdUnlockModal'
import type { PrefeituraAgendaUnitApi } from '../../../lib/services/prefeitura/agendas'
import { addDays, formatAgendaDayLabel, isSameDay, parseDateKey, toDateKey } from '../../../utils/agendaDate'
import { maskCpfForDisplay, maskPhoneForDisplay } from '../../../utils/lgpdDisplay'
import { computeAttendanceBreakdown } from '../../../utils/prefeituraAgendasAttendance'
import {
  prefeituraAgendasCardBodyScrollClass,
  prefeituraAgendasDayScheduleHeightClass,
} from './prefeituraAgendasUi'

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
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
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
      return 'bg-amber-50/80'
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
      return 'text-amber-600'
    case 'faltou':
      return 'text-red-600'
    default:
      return 'text-gray-900'
  }
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

type PrefeituraAgendasDayScheduleProps = {
  unitId: string
  dateKey: string
  maxDate?: Date
  appointments: DayAppointment[]
  breakdown?: {
    attended: number
    noShows: number
    attendancePercent: number
  }
  regionOptions: Array<{ value: string; label: string }>
  findUnit: (unitId: string) => PrefeituraAgendaUnitApi | undefined
  getUnitOptionsForRegion: (regionKey: string) => Array<{ value: string; label: string }>
  onDateChange: (dateKey: string) => void
  onUnitChange: (unitId: string) => void
}

export function PrefeituraAgendasDaySchedule({
  unitId,
  dateKey,
  maxDate = new Date(),
  appointments,
  breakdown,
  regionOptions,
  findUnit,
  getUnitOptionsForRegion,
  onDateChange,
  onUnitChange,
}: PrefeituraAgendasDayScheduleProps) {
  const [search, setSearch] = useState('')
  const [sensitiveDataUnlocked, setSensitiveDataUnlocked] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [regionKey, setRegionKey] = useState(() => findUnit(unitId)?.regionKey ?? 'todas')

  const showSuccessToast = useCallback((message: string) => {
    setToastMessage(null)
    requestAnimationFrame(() => setToastMessage(message))
  }, [])

  useEffect(() => {
    setRegionKey(findUnit(unitId)?.regionKey ?? 'todas')
  }, [findUnit, unitId])

  const ubtOptions = useMemo(
    () => getUnitOptionsForRegion(regionKey),
    [getUnitOptionsForRegion, regionKey],
  )
  const selectedDate = useMemo(() => parseDateKey(dateKey), [dateKey])
  const isToday = isSameDay(selectedDate, maxDate)
  const canGoForward = !isSameDay(selectedDate, maxDate) && selectedDate < maxDate

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return appointments
    return appointments.filter((item) => item.patientName.toLowerCase().includes(query))
  }, [appointments, search])

  const computedBreakdown = useMemo(
    () => breakdown ?? computeAttendanceBreakdown(appointments),
    [appointments, breakdown],
  )

  const unit = findUnit(unitId)
  const unitContextLabel = unit
    ? `RA ${unit.regionLabel} · ${unit.name}`
    : 'Unidade não encontrada'
  const dayLabel = formatAgendaDayLabel(selectedDate)

  function handleRegionChange(value: string) {
    setRegionKey(value)
    const units = getUnitOptionsForRegion(value)
    if (!units.some((option) => option.value === unitId) && units[0]) {
      onUnitChange(units[0].value)
    }
  }

  function handleUbtChange(value: string) {
    onUnitChange(value)
  }

  function goToPreviousDay() {
    onDateChange(toDateKey(addDays(selectedDate, -1)))
  }

  function goToNextDay() {
    if (!canGoForward) return
    onDateChange(toDateKey(addDays(selectedDate, 1)))
  }

  function goToToday() {
    onDateChange(toDateKey(maxDate))
  }

  const displayCpf = useCallback(
    (cpf: string) => (sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)),
    [sensitiveDataUnlocked],
  )

  const displayPhone = useCallback(
    (phone: string) => (sensitiveDataUnlocked ? phone : maskPhoneForDisplay(phone)),
    [sensitiveDataUnlocked],
  )

  return (
    <section
      className={[
        'flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]',
        prefeituraAgendasDayScheduleHeightClass,
      ].join(' ')}
    >
      <div className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Agenda do dia</h2>
            <p className="mt-1 text-sm font-medium text-gray-700">{unitContextLabel}</p>
            <p className="mt-0.5 text-sm text-gray-500">{dayLabel}</p>
            {computedBreakdown.attended + computedBreakdown.noShows > 0 ? (
              <p className="mt-2 text-xs font-semibold text-gray-600">
                Comparecimento:{' '}
                <span className="text-emerald-700">{computedBreakdown.attendancePercent}%</span> (
                {computedBreakdown.attended} compareceram · {computedBreakdown.noShows} faltas)
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={goToToday}
              disabled={isToday}
              className={[
                'rounded-lg border px-3 py-2 text-xs font-medium transition',
                isToday
                  ? 'cursor-default border-[var(--brand-primary)]/30 bg-[var(--brand-primary-muted)] text-[var(--brand-primary)]'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={goToPreviousDay}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={goToNextDay}
              disabled={!canGoForward}
              className={[
                'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white transition',
                canGoForward
                  ? 'text-gray-600 hover:bg-gray-50'
                  : 'cursor-not-allowed text-gray-300',
              ].join(' ')}
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <AgendaDatePicker
              selectedDate={selectedDate}
              referenceToday={maxDate}
              onSelectDate={(date) => {
                if (date > maxDate) return
                onDateChange(toDateKey(date))
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full shrink-0 sm:w-[10.5rem]">
            <span className="sr-only">Região administrativa (RA)</span>
            <CustomSelect
              value={regionKey}
              onChange={handleRegionChange}
              options={regionOptions}
              placeholder="RA"
              className="!py-2.5"
              menuMinWidthPx={200}
            />
          </div>
          <div className="w-full shrink-0 sm:w-[12.5rem]">
            <span className="sr-only">Unidade (UBT)</span>
            <CustomSelect
              value={unitId}
              onChange={handleUbtChange}
              options={ubtOptions}
              placeholder="Unidade (UBT)"
              className="!py-2.5"
              menuMinWidthPx={220}
            />
          </div>
          <label className="relative block min-w-0 w-full flex-1">
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
        </div>
      </div>

      <div className="mx-4 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 sm:mx-5">
        <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-4 py-2 sm:px-5">
          {!sensitiveDataUnlocked ? (
            <>
              <span className="mr-auto text-xs text-gray-500">
                CPF e telefone mascarados conforme a LGPD.
              </span>
              <button
                type="button"
                onClick={() => setUnlockModalOpen(true)}
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
                onClick={() => setSensitiveDataUnlocked(false)}
                className="text-sm font-semibold text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
              >
                Ocultar dados
              </button>
            </>
          )}
        </div>
        <div className={prefeituraAgendasCardBodyScrollClass}>
          <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
            <tr className="border-b border-gray-200">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-500 sm:px-5">
                  {search.trim()
                    ? `Nenhum paciente encontrado para "${search.trim()}".`
                    : 'Nenhum agendamento para este dia nesta unidade.'}
                </td>
              </tr>
            ) : (
              filteredAppointments.map((appointment) => (
                <AppointmentReadOnlyRow
                  key={appointment.id}
                  appointment={appointment}
                  sensitiveDataUnlocked={sensitiveDataUnlocked}
                  displayCpf={displayCpf}
                  displayPhone={displayPhone}
                />
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
      <LgpdUnlockModal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        onSuccess={() => {
          setSensitiveDataUnlocked(true)
          setUnlockModalOpen(false)
          showSuccessToast('Dados liberados com sucesso.')
        }}
      />
      <Toast
        message={toastMessage ?? ''}
        visible={toastMessage !== null}
        onClose={() => setToastMessage(null)}
      />
    </section>
  )
}

type AppointmentReadOnlyRowProps = {
  appointment: DayAppointment
  sensitiveDataUnlocked: boolean
  displayCpf: (cpf: string) => string
  displayPhone: (phone: string) => string
}

function AppointmentReadOnlyRow({
  appointment,
  sensitiveDataUnlocked,
  displayCpf,
  displayPhone,
}: AppointmentReadOnlyRowProps) {
  return (
    <tr className={rowBackground(appointment.status)}>
      <td className="whitespace-nowrap px-4 py-2.5 sm:px-5">
        <span
          className={`text-sm font-semibold tabular-nums ${timeColor(appointment.status)}`}
        >
          {appointment.time}
        </span>
      </td>
      <td className="px-4 py-2.5 sm:px-5">
        <p className="text-sm font-semibold text-gray-900">{appointment.patientName}</p>
        <p
          className={[
            'mt-0.5 text-xs',
            sensitiveDataUnlocked ? 'text-sky-600' : 'text-gray-500',
          ].join(' ')}
        >
          CPF {displayCpf(appointment.patientCpf)}
        </p>
      </td>
      <td
        className={[
          'whitespace-nowrap px-4 py-2.5 text-center text-sm sm:px-5',
          sensitiveDataUnlocked ? 'text-sky-600' : 'text-gray-700',
        ].join(' ')}
      >
        {displayPhone(appointment.patientPhone)}
      </td>
      <td className="hidden whitespace-nowrap px-4 py-2.5 text-center text-sm text-gray-700 sm:table-cell sm:px-5">
        {appointment.serviceType}
      </td>
      <td className="px-4 py-2.5 text-center sm:px-5">
        <StatusBadge status={appointment.status} />
      </td>
    </tr>
  )
}
