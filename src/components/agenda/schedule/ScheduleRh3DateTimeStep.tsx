import { Clock, Stethoscope } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useUbtRh3ScheduleMutations } from '../../../hooks/useUbtRh3ScheduleMutations'
import type { Rh3ScheduleSlot } from '../../../lib/services/ubt/rh3'
import { formatAgendaDayLabel, formatAgendaDayMonthShort, parseDateKey, toDateKey } from '../../../utils/agendaDate'
import { formatRh3ProfessionalName, formatRh3ScheduleHour } from '../../../utils/rh3ScheduleFormat'
import { AttendanceStepFooter } from '../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../dashboard/AttendanceStepShell'
import {
  AttendanceStepLoadingPanel,
} from '../../dashboard/AttendanceStepLoadingPanel'

type ScheduleRh3DateTimeStepProps = {
  specialtyName: string
  rh3EspecialidadId: number
  selectedDate: Date
  selectedTurnoId: number | null
  selectedTime: string
  selectedProfessionalName?: string
  onSelectDate: (date: Date) => void
  onSelectSlot: (slot: Rh3ScheduleSlot) => void
  onBack: () => void
  onContinue: () => void
  isSubmitting?: boolean
  continueLabel?: string
}

const SCHEDULE_DAY_COUNT = 31

type AvailableRh3Day = {
  date: Date
  key: string
  count: number
}

function calendarDaysBetween(previous: Date, next: Date): number {
  const utcPrevious = Date.UTC(previous.getFullYear(), previous.getMonth(), previous.getDate())
  const utcNext = Date.UTC(next.getFullYear(), next.getMonth(), next.getDate())
  return Math.round((utcNext - utcPrevious) / (24 * 60 * 60 * 1000)) - 1
}

function ScheduleRh3DayGapIndicator() {
  return (
    <div
      className="flex shrink-0 items-center gap-1 self-center px-0.5"
      aria-hidden
      title="Dias intermediários sem vaga"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300"
          style={{ animationDelay: `${dot * 0.18}s` }}
        />
      ))}
    </div>
  )
}

export function ScheduleRh3DateTimeStep({
  specialtyName,
  rh3EspecialidadId,
  selectedDate,
  selectedTurnoId,
  selectedTime,
  selectedProfessionalName,
  onSelectDate,
  onSelectSlot,
  onBack,
  onContinue,
  isSubmitting = false,
  continueLabel = 'Agendar',
}: ScheduleRh3DateTimeStepProps) {
  const { loadRh3Availability } = useUbtRh3ScheduleMutations()
  const [appointments, setAppointments] = useState<Rh3ScheduleSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const scheduleStart = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    return today
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    void loadRh3Availability(rh3EspecialidadId, {
      date_from: toDateKey(scheduleStart),
      language: 'PT',
    })
      .then((response) => {
        if (cancelled) return
        setAppointments(response.appointments)
      })
      .catch(() => {
        if (cancelled) return
        setAppointments([])
        setLoadError('Não foi possível carregar horários terceirizados.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadRh3Availability, rh3EspecialidadId, scheduleStart])

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Rh3ScheduleSlot[]>()
    for (const slot of appointments) {
      const current = map.get(slot.date) ?? []
      current.push(slot)
      map.set(slot.date, current)
    }
    for (const [date, slots] of map.entries()) {
      map.set(
        date,
        [...slots].sort((a, b) => a.hour.localeCompare(b.hour, 'pt-BR')),
      )
    }
    return map
  }, [appointments])

  const availableDays = useMemo((): AvailableRh3Day[] => {
    return [...slotsByDate.entries()]
      .filter(([, slots]) => slots.length > 0)
      .map(([key, slots]) => ({
        key,
        date: parseDateKey(key),
        count: slots.length,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [slotsByDate])

  const selectedDateKey = toDateKey(selectedDate)
  const slotsForSelectedDay = slotsByDate.get(selectedDateKey) ?? []
  const canContinue = selectedTurnoId != null && selectedTime.trim().length > 0

  useEffect(() => {
    if (isLoading || loadError || availableDays.length === 0) return
    if ((slotsByDate.get(selectedDateKey)?.length ?? 0) > 0) return
    onSelectDate(availableDays[0].date)
  }, [isLoading, loadError, availableDays, selectedDateKey, slotsByDate, onSelectDate])

  return (
    <AttendanceStepShell
      hideScrollbar
      fillAvailable
      embedded
      title="Data e horário"
      description={`Teleconsulta terceirizada — ${specialtyName}. Escolha a data e o horário disponível.`}
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueLabel={isSubmitting ? 'Continuando…' : continueLabel}
          continueReady={canContinue}
          continueLoading={isSubmitting}
        />
      }
    >
      {isLoading ? (
        <AttendanceStepLoadingPanel message="Carregando horários terceirizados..." />
      ) : loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      ) : (
        <div className="space-y-5">
          <section>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Data</p>
            {availableDays.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-gray-300 bg-slate-50 px-4 py-6 text-center text-sm text-gray-500">
                Nenhuma data com vaga terceirizada nos próximos {SCHEDULE_DAY_COUNT} dias.
              </p>
            ) : (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                {availableDays.map((day, index) => {
                  const previousDay = index > 0 ? availableDays[index - 1] : null
                  const gapDays = previousDay
                    ? calendarDaysBetween(previousDay.date, day.date)
                    : 0
                  const selected = day.key === selectedDateKey

                  return (
                    <Fragment key={day.key}>
                      {gapDays > 0 ? <ScheduleRh3DayGapIndicator /> : null}
                      <button
                        type="button"
                        onClick={() => onSelectDate(day.date)}
                        className={[
                          'min-w-[5.5rem] shrink-0 rounded-xl border px-3 py-2 text-center transition',
                          selected
                            ? 'border-[var(--brand-primary)] bg-orange-50 shadow-[0_0_0_2px_rgba(255,107,0,0.15)]'
                            : 'border-gray-200 bg-white hover:border-gray-300',
                        ].join(' ')}
                      >
                        <span className="block text-[11px] font-semibold uppercase text-gray-500">
                          {formatAgendaDayLabel(day.date).split(',')[0]}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold tabular-nums text-gray-900">
                          {formatAgendaDayMonthShort(day.date)}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-gray-500">
                          {day.count} vaga(s)
                        </span>
                      </button>
                    </Fragment>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              Horários em {formatAgendaDayLabel(selectedDate)}
            </p>
            {slotsForSelectedDay.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-gray-300 bg-slate-50 px-4 py-6 text-center text-sm text-gray-500">
                Nenhum horário terceirizado disponível nesta data.
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-4 gap-2">
                {slotsForSelectedDay.map((slot) => {
                  const selected = selectedTurnoId === slot.idTurno
                  return (
                    <li key={slot.idTurno}>
                      <button
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        className={[
                          'h-full w-full rounded-xl border px-2 py-3 text-center transition',
                          selected
                            ? 'border-[var(--brand-primary)] bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-[var(--brand-primary)]/40',
                        ].join(' ')}
                      >
                        <span className="block text-base font-bold tabular-nums text-gray-900 sm:text-lg">
                          {formatRh3ScheduleHour(slot.hour)}
                        </span>
                        {slot.professionalName ? (
                          <span className="mt-1.5 flex flex-col items-center gap-1 text-[11px] leading-snug text-gray-600">
                            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                            {formatRh3ProfessionalName(slot.professionalName)}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {selectedProfessionalName ? (
            <p className="text-sm text-gray-600">
              Profissional selecionado:{' '}
              <strong className="text-gray-900">{selectedProfessionalName}</strong>
            </p>
          ) : null}
        </div>
      )}
    </AttendanceStepShell>
  )
}
