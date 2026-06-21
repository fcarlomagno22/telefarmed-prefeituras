import { Clock, Stethoscope } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  filterAvailableSlotsFromNow,
  type ScheduleDoctor,
  type ScheduleTimeSlot,
} from '../../../data/scheduleDoctorsMock'
import { useUbtScheduleCatalog } from '../../../hooks/useUbtScheduleCatalog'
import { formatAgendaDayLabel, toDateKey } from '../../../utils/agendaDate'
import { AttendanceFieldHighlight } from '../../dashboard/AttendanceFieldHighlight'
import { AttendanceStepFooter } from '../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../dashboard/AttendanceStepShell'
import { AttendanceStepLoadingPanel } from '../../dashboard/AttendanceStepLoadingPanel'

type WalkInDoctorTimeStepProps = {
  specialtyId: string
  specialtyName: string
  selectedDate: Date
  selectedDoctorId: string
  selectedTime: string
  onSelectDoctor: (doctorId: string, doctorName?: string) => void
  onSelectTime: (time: string) => void
  onBack: () => void
  onContinue: () => void
}

function formatNowLabel(now: Date): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function WalkInDoctorTimeStep({
  specialtyId,
  specialtyName,
  selectedDate,
  selectedDoctorId,
  selectedTime,
  onSelectDoctor,
  onSelectTime,
  onBack,
  onContinue,
}: WalkInDoctorTimeStepProps) {
  const catalog = useUbtScheduleCatalog()
  const [showHints, setShowHints] = useState(false)
  const [doctors, setDoctors] = useState<ScheduleDoctor[]>([])
  const [slots, setSlots] = useState<ScheduleTimeSlot[]>([])
  const [doctorSlotCounts, setDoctorSlotCounts] = useState<Map<string, number>>(new Map())
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  const nowLabel = useMemo(() => formatNowLabel(new Date()), [])
  const dayLabel = formatAgendaDayLabel(selectedDate)

  useEffect(() => {
    if (!specialtyId) {
      setDoctors([])
      setDoctorSlotCounts(new Map())
      return
    }

    let cancelled = false
    setIsLoadingDoctors(true)

    void catalog.getDoctorsForSpecialty(specialtyId, toDateKey(selectedDate)).then(async (list) => {
      const available: ScheduleDoctor[] = []
      const counts = new Map<string, number>()

      for (const doctor of list) {
        const doctorSlots = await catalog.getDoctorAvailableSlots(doctor.id, toDateKey(selectedDate))
        const fromNow = filterAvailableSlotsFromNow(doctorSlots)
        if (fromNow.length > 0) {
          available.push(doctor)
          counts.set(doctor.id, fromNow.length)
        }
      }

      if (cancelled) return
      setDoctors(available)
      setDoctorSlotCounts(counts)
    }).finally(() => {
      if (!cancelled) setIsLoadingDoctors(false)
    })

    return () => {
      cancelled = true
    }
  }, [catalog, selectedDate, specialtyId])

  useEffect(() => {
    if (!selectedDoctorId) {
      setSlots([])
      setIsLoadingSlots(false)
      return
    }

    let cancelled = false
    setIsLoadingSlots(true)
    void catalog
      .getDoctorAvailableSlots(selectedDoctorId, toDateKey(selectedDate))
      .then((result) => {
        if (!cancelled) setSlots(filterAvailableSlotsFromNow(result))
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false)
      })

    return () => {
      cancelled = true
    }
  }, [catalog, selectedDate, selectedDoctorId])

  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId)
  const availableSlotCount = slots.filter((slot) => slot.available).length
  const canContinue = Boolean(selectedDoctorId && selectedTime)

  if (!specialtyId) {
    return (
      <AttendanceStepShell
        hideScrollbar
        title="Médico e horário"
        description="Selecione uma especialidade antes de escolher médico e horário."
        footer={
          <AttendanceStepFooter
            onBack={onBack}
            onContinue={() => undefined}
            continueLabel="Continuar"
            continueReady={false}
          />
        }
      >
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Volte ao passo anterior e escolha a especialidade com plantão neste momento.
        </p>
      </AttendanceStepShell>
    )
  }

  return (
    <AttendanceStepShell
      hideScrollbar
      title="Médico e horário"
      description={`Encaixe presencial em ${specialtyName}: escolha o profissional e o horário livre a partir de agora (${nowLabel}).`}
      footer={
        <AttendanceStepFooter
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Continuar"
          continueReady={canContinue}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="shrink-0 rounded-xl border border-violet-200/90 bg-violet-50/80 px-4 py-3">
          <p className="text-sm font-semibold text-violet-900">{dayLabel} — encaixe de hoje</p>
          <p className="mt-1 text-xs leading-relaxed text-violet-800/90">
            Sem escolha de data: listamos apenas médicos e horários disponíveis a partir de{' '}
            <strong className="tabular-nums">{nowLabel}</strong>.
          </p>
        </div>

        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          {isLoadingDoctors ? (
            <AttendanceStepLoadingPanel message="Buscando médicos com horário livre agora…" />
          ) : doctors.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
              Nenhum médico com horário livre neste momento para {specialtyName}. Tente outra
              especialidade ou aguarde a próxima vaga.
            </p>
          ) : (
            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2 lg:items-stretch">
              <div className="flex min-h-0 flex-col">
                <div className="mb-2 flex shrink-0 items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    1. Médico disponível agora
                  </p>
                </div>

                <AttendanceFieldHighlight
                  highlight={showHints && !selectedDoctorId}
                  className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto no-scrollbar"
                >
                  {doctors.map((doctor) => {
                    const slotsOnDay = doctorSlotCounts.get(doctor.id) ?? 0
                    const isSelected = doctor.id === selectedDoctorId

                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          onSelectDoctor(doctor.id, doctor.name)
                          onSelectTime('')
                        }}
                        className={[
                          'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                          isSelected
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/60 ring-2 ring-[var(--brand-primary)]/15'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80',
                        ].join(' ')}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-gray-900">
                            {doctor.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {doctor.crm}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 tabular-nums">
                          {slotsOnDay} {slotsOnDay === 1 ? 'vaga' : 'vagas'}
                        </span>
                      </button>
                    )
                  })}
                </AttendanceFieldHighlight>
              </div>

              <div className="flex min-h-0 flex-col border-gray-100 lg:border-l lg:pl-4">
                <div className="mb-2 flex shrink-0 items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    2. Horário de encaixe
                  </p>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  {selectedDoctor ? (
                    <>
                      <p className="mb-2 shrink-0 text-xs text-gray-500">
                        {availableSlotCount} horários livres com {selectedDoctor.name}
                      </p>
                      {isLoadingSlots ? (
                        <AttendanceStepLoadingPanel
                          compact
                          message="Carregando horários de encaixe…"
                        />
                      ) : (
                      <AttendanceFieldHighlight
                        highlight={showHints && !selectedTime}
                        className="min-h-0 flex-1 overflow-y-auto no-scrollbar"
                      >
                        <ul className="grid grid-cols-2 content-start gap-2 sm:grid-cols-3">
                          {slots.map((slot) => {
                            const isSelected = slot.time === selectedTime
                            return (
                              <li key={slot.time}>
                                <button
                                  type="button"
                                  disabled={!slot.available}
                                  onClick={() => onSelectTime(slot.time)}
                                  className={[
                                    'flex h-11 w-full items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition',
                                    isSelected
                                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]'
                                      : 'border-gray-200 bg-white text-gray-800 hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary-light)]/40',
                                  ].join(' ')}
                                >
                                  {slot.time}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </AttendanceFieldHighlight>
                      )}
                      {selectedTime ? (
                        <p className="mt-3 shrink-0 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-100">
                          Encaixe hoje às <strong className="tabular-nums">{selectedTime}</strong>
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                      Selecione um médico para ver os horários disponíveis a partir de agora.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AttendanceStepShell>
  )
}
