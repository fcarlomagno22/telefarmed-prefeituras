import {
  Calendar,
  CalendarDays,
  Clock,
  Search,
  Star,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { agendaToday } from '../../../data/agendaMock'
import {
  countAvailableSlots,
  countSpecialtyAvailableSlotsOnDay,
  countTotalAvailableSlots,
  getDoctorAvailableSlots,
  getDoctorById,
  getDoctorScheduleOverview,
  getDoctorsAvailableOnDay,
  getNextAvailableDayForDoctor,
  getNextScheduleDays,
  searchScheduleDoctors,
} from '../../../data/scheduleDoctorsMock'
import { formatAgendaDayLabel, isSameDay } from '../../../utils/agendaDate'
import { AttendanceFieldHighlight } from '../../dashboard/AttendanceFieldHighlight'
import { AttendanceStepFooter } from '../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../dashboard/AttendanceStepShell'

type ScheduleDateTimeStepProps = {
  specialtyId: string
  specialtyName: string
  selectedDate: Date
  selectedDoctorId: string
  selectedTime: string
  onSelectDate: (date: Date) => void
  onSelectDoctor: (doctorId: string) => void
  onSelectTime: (time: string) => void
  onBack: () => void
  onContinue: () => void
}

type ScheduleViewMode = 'by_day' | 'by_doctor'

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const
/** Hoje + 30 dias à frente (31 dias no total) */
const SCHEDULE_DAY_COUNT = 31

const viewModeOptions: { id: ScheduleViewMode; label: string; icon: typeof Calendar }[] = [
  { id: 'by_day', label: 'Por data', icon: Calendar },
  { id: 'by_doctor', label: 'Agenda do médico', icon: UserRound },
]

export function ScheduleDateTimeStep({
  specialtyId,
  specialtyName,
  selectedDate,
  selectedDoctorId,
  selectedTime,
  onSelectDate,
  onSelectDoctor,
  onSelectTime,
  onBack,
  onContinue,
}: ScheduleDateTimeStepProps) {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('by_day')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [showHints, setShowHints] = useState(false)

  const scheduleDays = useMemo(
    () => getNextScheduleDays(SCHEDULE_DAY_COUNT, agendaToday),
    [],
  )

  const doctorsForSpecialty = useMemo(
    () => searchScheduleDoctors(doctorSearch, specialtyId),
    [doctorSearch, specialtyId],
  )

  const selectedDoctor = selectedDoctorId ? getDoctorById(selectedDoctorId) : undefined

  const doctorScheduleOverview = useMemo(
    () =>
      selectedDoctorId
        ? getDoctorScheduleOverview(selectedDoctorId, agendaToday, SCHEDULE_DAY_COUNT)
        : [],
    [selectedDoctorId],
  )

  const slots = selectedDoctorId
    ? getDoctorAvailableSlots(selectedDoctorId, selectedDate)
    : []

  const availableSlotCount = slots.filter((slot) => slot.available).length
  const canContinue = Boolean(selectedDoctorId && selectedTime)

  const doctorsAvailableOnSelectedDay = useMemo(
    () => getDoctorsAvailableOnDay(specialtyId, selectedDate),
    [specialtyId, selectedDate],
  )

  useEffect(() => {
    if (viewMode !== 'by_day' || !selectedDoctorId) return

    const stillAvailable = doctorsAvailableOnSelectedDay.some(
      (doctor) => doctor.id === selectedDoctorId,
    )
    if (!stillAvailable) {
      onSelectDoctor('')
      onSelectTime('')
    }
  }, [
    viewMode,
    selectedDoctorId,
    doctorsAvailableOnSelectedDay,
    onSelectDoctor,
    onSelectTime,
  ])

  useEffect(() => {
    if (viewMode !== 'by_doctor' || !selectedDoctorId) return

    const overview = getDoctorScheduleOverview(
      selectedDoctorId,
      agendaToday,
      SCHEDULE_DAY_COUNT,
    )
    const selectedDayInfo = overview.find((day) => isSameDay(day.date, selectedDate))

    if (selectedDayInfo?.worksThisDay && selectedDayInfo.availableSlots > 0) return

    const nextDay = getNextAvailableDayForDoctor(
      selectedDoctorId,
      agendaToday,
      SCHEDULE_DAY_COUNT,
    )
    if (nextDay && !isSameDay(nextDay, selectedDate)) {
      onSelectDate(nextDay)
      onSelectTime('')
    }
  }, [viewMode, selectedDoctorId, selectedDate, onSelectDate, onSelectTime])

  function handleViewModeChange(mode: ScheduleViewMode) {
    setViewMode(mode)
    onSelectTime('')
    setDoctorSearch('')
    if (mode === 'by_day') {
      onSelectDoctor('')
    }
  }

  function handleSelectDateByDay(date: Date) {
    onSelectDate(date)
    onSelectDoctor('')
    onSelectTime('')
  }

  function handleSelectDoctorByDay(doctorId: string) {
    onSelectDoctor(doctorId)
    onSelectTime('')
  }

  function handleSelectDoctorByDoctorMode(doctorId: string) {
    onSelectDoctor(doctorId)
    onSelectTime('')

    const nextDay = getNextAvailableDayForDoctor(
      doctorId,
      agendaToday,
      SCHEDULE_DAY_COUNT,
    )
    if (nextDay) onSelectDate(nextDay)
  }

  function renderDayChip(
    date: Date,
    options: {
      selected: boolean
      slotsOnDay: number
      worksThisDay?: boolean
      subtitle?: string
      onClick: () => void
    },
  ) {
    const { selected, slotsOnDay, worksThisDay = true, subtitle, onClick } = options
    const dayNum = date.getDate()
    const weekday = WEEKDAY_SHORT[date.getDay()]
    const disabled = !worksThisDay || slotsOnDay === 0

    return (
      <button
        key={date.toISOString()}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={[
          'flex w-[5.75rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 transition',
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
            : selected
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shadow-[0_4px_14px_rgba(255,107,0,0.2)] ring-2 ring-[var(--brand-primary)]/15'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
        ].join(' ')}
      >
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
          {weekday}
        </span>
        <span className="mt-0.5 text-lg font-bold tabular-nums">{dayNum}</span>
        {disabled ? (
          <span className="mt-1 min-h-[1.35rem] text-[9px] leading-tight">—</span>
        ) : (
          <span
            className={[
              'mt-1 flex min-h-[1.35rem] w-full items-center justify-center rounded-full px-1 py-0.5 text-center text-[8px] font-semibold leading-tight tabular-nums',
              selected ? 'bg-white/70 text-[var(--brand-primary)]' : 'bg-emerald-50 text-emerald-700',
            ].join(' ')}
          >
            {subtitle ?? `${slotsOnDay} vagas`}
          </span>
        )}
      </button>
    )
  }

  function renderDoctorListItem(
    doctor: NonNullable<ReturnType<typeof getDoctorById>>,
    options: { isSelected: boolean; slotsOnDay: number; onSelect: () => void },
  ) {
    const { isSelected, slotsOnDay, onSelect } = options

    return (
      <button
        key={doctor.id}
        type="button"
        onClick={onSelect}
        className={[
          'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition',
          isSelected
            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/60 ring-2 ring-[var(--brand-primary)]/15'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80',
        ].join(' ')}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-900">{doctor.name}</span>
          <span className="mt-0.5 block truncate text-xs text-gray-500">{doctor.crm}</span>
        </span>
        <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 tabular-nums">
          {slotsOnDay} {slotsOnDay === 1 ? 'vaga' : 'vagas'}
        </span>
      </button>
    )
  }

  function renderDoctorCard(
    doctor: NonNullable<ReturnType<typeof getDoctorById>>,
    options: { isSelected: boolean; badge: string; onSelect: () => void },
  ) {
    const { isSelected, badge, onSelect } = options

    return (
      <button
        key={doctor.id}
        type="button"
        onClick={onSelect}
        className={[
          'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition',
          isSelected
            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/60 ring-2 ring-[var(--brand-primary)]/15'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80',
        ].join(' ')}
      >
        <img
          src={doctor.avatarUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-gray-100"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-900">{doctor.name}</span>
          <span className="mt-0.5 block text-xs text-gray-500">{doctor.crm}</span>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {doctor.rating.toFixed(1)}
            <span className="text-gray-400">({doctor.reviewCount} avaliações)</span>
          </span>
        </span>
        <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 tabular-nums">
          {badge}
        </span>
      </button>
    )
  }

  function renderTimeSlots(options?: { compact?: boolean }) {
    if (!selectedDoctor) return null

    const compact = options?.compact ?? false
    const selectedDayOverview = doctorScheduleOverview.find((day) =>
      isSameDay(day.date, selectedDate),
    )

    return (
      <div className={compact ? 'flex min-h-0 flex-1 flex-col' : undefined}>
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500">
              {compact
                ? selectedDoctor.name
                : `Horários — ${selectedDoctor.name.split(' ').slice(-1).join(' ')}`}
            </p>
          </div>
          <span className="shrink-0 text-xs text-gray-500 tabular-nums">
            {availableSlotCount} disponíveis
          </span>
        </div>

        {viewMode === 'by_doctor' && selectedDayOverview && !selectedDayOverview.worksThisDay ? (
          <p className="mb-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Este médico não tem plantão em {formatAgendaDayLabel(selectedDate)}. Escolha outro dia
            na agenda dele.
          </p>
        ) : null}

        <AttendanceFieldHighlight
          highlight={showHints && !selectedTime}
          className={compact ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : undefined}
        >
          <div
            className={
              compact ? 'min-h-0 flex-1 overflow-y-auto no-scrollbar' : undefined
            }
          >
            <ul
              className={[
                'grid gap-2',
                compact
                  ? 'grid-cols-2 content-start sm:grid-cols-3'
                  : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
              ].join(' ')}
            >
            {slots.map((slot) => {
              const isSelected = slot.time === selectedTime
              const disabled = !slot.available

              return (
                <li key={slot.time}>
                  <button
                    type="button"
                    disabled={disabled}
                    title={disabled ? slot.bookedReason : `Agendar às ${slot.time}`}
                    onClick={() => {
                      if (!slot.available) return
                      onSelectTime(slot.time)
                    }}
                    className={[
                      'flex h-11 w-full items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition',
                      disabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300 line-through'
                        : isSelected
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]'
                          : 'border-gray-200 bg-white text-gray-800 hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary-light)]/40',
                    ].join(' ')}
                  >
                    {slot.time}
                  </button>
                </li>
              )
            })}
            </ul>
          </div>
        </AttendanceFieldHighlight>

        {selectedTime ? (
          <p
            className={[
              'shrink-0 rounded-xl bg-emerald-50 text-sm text-emerald-800 ring-1 ring-emerald-100',
              compact ? 'mt-2 px-3 py-2.5' : 'mt-3 px-4 py-3',
            ].join(' ')}
          >
            <strong>
              {formatAgendaDayLabel(selectedDate)} às {selectedTime}
            </strong>
          </p>
        ) : null}
      </div>
    )
  }

  const stepDescription =
    viewMode === 'by_day'
      ? `Em ${specialtyName}, escolha primeiro a data, depois o médico disponível nesse dia e o horário.`
      : `Em ${specialtyName}, escolha o médico e veja os dias e horários em que ele atende.`

  return (
    <AttendanceStepShell
      hideScrollbar
      title="Data, médico e horário"
      description={stepDescription}
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Agendar"
          continueReady={canContinue}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <div
        className={[
          'flex min-h-0 flex-1 flex-col gap-5',
          viewMode === 'by_day' ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar',
        ].join(' ')}
      >
        <div
          role="tablist"
          aria-label="Forma de busca"
          className="flex shrink-0 gap-1 rounded-xl border border-gray-200 bg-gray-50/80 p-1"
        >
          {viewModeOptions.map((option) => {
            const Icon = option.icon
            const active = viewMode === option.id

            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleViewModeChange(option.id)}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                  active
                    ? 'bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-gray-100'
                    : 'text-gray-600 hover:text-gray-900',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {option.label}
              </button>
            )
          })}
        </div>

        {viewMode === 'by_day' ? (
          <>
            <section className="min-w-0 shrink-0 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  1. Escolha a data
                </p>
              </div>
              <p className="mb-3 text-sm text-gray-600">
                Hoje e os próximos 30 dias com atendimento em {specialtyName}.
              </p>

              <div className="schedule-days-scroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto scroll-smooth px-1 pb-2">
                {scheduleDays.map((date) => {
                  const slotsOnDay = countSpecialtyAvailableSlotsOnDay(specialtyId, date)
                  const doctorsOnDay = getDoctorsAvailableOnDay(specialtyId, date).length
                  const isToday = isSameDay(date, agendaToday)

                  return renderDayChip(date, {
                    selected: isSameDay(date, selectedDate),
                    slotsOnDay,
                    subtitle:
                      slotsOnDay > 0
                        ? isToday
                          ? `Hoje · ${doctorsOnDay} méd.`
                          : `${doctorsOnDay} méd.`
                        : isToday
                          ? 'Hoje'
                          : undefined,
                    onClick: () => handleSelectDateByDay(date),
                  })
                })}
              </div>

              <p className="mt-2 text-xs text-gray-500">{formatAgendaDayLabel(selectedDate)}</p>
            </section>

            <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              <p className="mb-3 shrink-0 text-sm text-gray-600">
                Profissionais com horário livre em {formatAgendaDayLabel(selectedDate)}.
              </p>

              {doctorsAvailableOnSelectedDay.length === 0 ? (
                <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-5 text-center text-sm text-gray-500">
                  Nenhum médico com horário livre nesta data. Escolha outro dia ou use{' '}
                  <strong className="text-gray-700">Agenda do médico</strong>.
                </p>
              ) : (
                <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2 lg:items-stretch">
                  <div className="flex min-h-0 flex-col">
                    <div className="mb-2 flex shrink-0 items-center gap-2">
                      <Stethoscope
                        className="h-4 w-4 text-[var(--brand-primary)]"
                        strokeWidth={2}
                      />
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        2. Médicos neste dia
                      </p>
                    </div>

                    <AttendanceFieldHighlight
                      highlight={showHints && !selectedDoctorId}
                      className="flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto no-scrollbar"
                    >
                      {doctorsAvailableOnSelectedDay.map((doctor) => {
                        const slotsOnDay = countAvailableSlots(doctor.id, selectedDate)
                        return renderDoctorListItem(doctor, {
                          isSelected: doctor.id === selectedDoctorId,
                          slotsOnDay,
                          onSelect: () => handleSelectDoctorByDay(doctor.id),
                        })
                      })}
                    </AttendanceFieldHighlight>
                  </div>

                  <div className="flex min-h-0 flex-col border-gray-100 lg:border-l lg:pl-4">
                    <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      3. Escolha o horário
                    </p>

                    <div className="flex min-h-0 flex-1 flex-col">
                      {selectedDoctor ? (
                        renderTimeSlots({ compact: true })
                      ) : (
                        <p className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                          Selecione um médico à esquerda para ver os horários disponíveis.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : null}

        {viewMode === 'by_doctor' ? (
          <>
            <section>
              <div className="mb-2 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  1. Escolha o médico
                </p>
              </div>
              <p className="mb-3 text-sm text-gray-600">
                Busque o profissional para ver os dias e horários em que ele atende.
              </p>

              <label className="relative mb-3 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={doctorSearch}
                  onChange={(event) => setDoctorSearch(event.target.value)}
                  placeholder="Nome, CRM ou especialidade..."
                  className="w-full rounded-xl border border-gray-200/80 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>

              <AttendanceFieldHighlight
                highlight={showHints && !selectedDoctorId}
                className="max-h-[14rem] space-y-2 overflow-y-auto no-scrollbar"
              >
                {doctorsForSpecialty.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                    Nenhum médico encontrado para esta especialidade.
                  </p>
                ) : (
                  doctorsForSpecialty.map((doctor) => {
                    const totalUpcoming = countTotalAvailableSlots(
                      doctor.id,
                      agendaToday,
                      SCHEDULE_DAY_COUNT,
                    )
                    return renderDoctorCard(doctor, {
                      isSelected: doctor.id === selectedDoctorId,
                      badge:
                        totalUpcoming > 0
                          ? `${totalUpcoming} vagas em 30 dias`
                          : 'Sem vagas',
                      onSelect: () => handleSelectDoctorByDoctorMode(doctor.id),
                    })
                  })
                )}
              </AttendanceFieldHighlight>
            </section>

            {selectedDoctor ? (
              <>
                <section className="rounded-2xl border border-[var(--brand-primary)]/20 bg-gradient-to-br from-[var(--brand-primary-light)]/50 to-white p-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                      2. Dias disponíveis — {selectedDoctor.name}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Toque no dia em que o médico tem plantão para ver os horários.
                  </p>

                  <div className="schedule-days-scroll -mx-1 mt-3 flex flex-nowrap gap-2 overflow-x-auto scroll-smooth px-1 pb-2">
                    {doctorScheduleOverview.map((day) =>
                      renderDayChip(day.date, {
                        selected: isSameDay(day.date, selectedDate),
                        slotsOnDay: day.availableSlots,
                        worksThisDay: day.worksThisDay,
                        onClick: () => {
                          if (!day.worksThisDay || day.availableSlots === 0) return
                          onSelectDate(day.date)
                          onSelectTime('')
                        },
                      }),
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {formatAgendaDayLabel(selectedDate)}
                  </p>
                </section>

                <section>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    3. Escolha o horário
                  </p>
                  {renderTimeSlots({ compact: false })}
                </section>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-5 text-center text-sm text-gray-500">
                Selecione um médico para visualizar a agenda dele nos próximos 30 dias.
              </p>
            )}
          </>
        ) : null}
      </div>
    </AttendanceStepShell>
  )
}
