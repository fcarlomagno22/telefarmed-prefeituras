import { CalendarPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUbtPatientRegistration } from '../../../hooks/useUbtPatientRegistration'
import { useUbtPatientTerritoryPolicy } from '../../../hooks/useUbtPatientTerritoryPolicy'
import { inferAgeGroupFromBirthDate } from '../../../types/attendance'
import {
  emptyAttendanceSession,
  emptyPatientRegistration,
  type PatientRegistration,
} from '../../../types/attendance'
import { AgeGroupSelectionStep } from '../../dashboard/AgeGroupSelectionStep'
import { CpfLookupStep } from '../../dashboard/CpfLookupStep'
import { PatientAddressStep } from '../../dashboard/PatientAddressStep'
import { PatientContactsStep } from '../../dashboard/PatientContactsStep'
import { PatientRegistrationConfirmStep } from '../../dashboard/PatientRegistrationConfirmStep'
import { PatientRegistrationConsentStep } from '../../dashboard/PatientRegistrationConsentStep'
import { PatientRegistrationForm } from '../../dashboard/PatientRegistrationForm'
import { usePatientRegistrationOperator } from '../../../hooks/usePatientRegistrationOperator'
import { SpecialtySelectionStep } from '../../dashboard/SpecialtySelectionStep'
import { AttendanceStepFooter } from '../../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../../dashboard/AttendanceStepShell'
import { useUbtRh3ScheduleSpecialtyCatalog } from '../../../hooks/useUbtRh3ScheduleSpecialtyCatalog'
import { ScheduleAppointmentFlowStepper } from './ScheduleAppointmentFlowStepper'
import { ScheduleAppointmentSuccess } from './ScheduleAppointmentSuccess'
import { ScheduleRh3DateTimeStep } from './ScheduleRh3DateTimeStep'
import { useUbtRh3ScheduleMutations } from '../../../hooks/useUbtRh3ScheduleMutations'
import type { Rh3ScheduleSlot } from '../../../lib/services/ubt/rh3'
import { toDateKey } from '../../../utils/agendaDate'
import { formatRh3ProfessionalName, formatRh3ScheduleHour, parseRh3ScheduleHourToApi } from '../../../utils/rh3ScheduleFormat'
import type {
  ScheduleAppointmentInitialState,
  ScheduleAppointmentStep,
} from './scheduleAppointmentTypes'

type ScheduleAppointmentDrawerProps = {
  open: boolean
  closing: boolean
  initialDate: Date
  initialFlow: ScheduleAppointmentInitialState | null
  onClose: () => void
  onTransitionEnd: () => void
  onScheduled: (
    registration: PatientRegistration,
    summary: string,
    meta: {
      pacienteId: string
      profissionalId: string
      especialidadeId: string
      selectedDate: Date
      selectedTime: string
      origemAtendimento?: 'mp' | 'mt'
      rh3Booked?: boolean
    },
  ) => void | Promise<void>
  onRescheduled?: (
    appointmentId: string,
    patch: { time: string; serviceType: string },
    summary: string,
    meta: {
      profissionalId: string
      especialidadeId: string
      selectedDate: Date
    },
  ) => void | Promise<void>
}

export function ScheduleAppointmentDrawer({
  open,
  closing,
  initialDate,
  initialFlow,
  onClose,
  onTransitionEnd,
  onScheduled,
  onRescheduled,
}: ScheduleAppointmentDrawerProps) {
  const { lookupByCpf, registerCompletedPatient: persistPatient } = useUbtPatientRegistration()
  const { bookRh3Appointment } = useUbtRh3ScheduleMutations()
  const territoryPolicy = useUbtPatientTerritoryPolicy(open)
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<ScheduleAppointmentStep>('cpf_lookup')
  const [registration, setRegistration] = useState(emptyPatientRegistration)
  const [session, setSession] = useState(emptyAttendanceSession)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDoctorName, setSelectedDoctorName] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [rh3EspecialidadId, setRh3EspecialidadId] = useState<number | null>(null)
  const [selectedRh3TurnoId, setSelectedRh3TurnoId] = useState<number | null>(null)
  const [isReturningPatient, setIsReturningPatient] = useState(false)
  const [existingPatientId, setExistingPatientId] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [consentBackStep, setConsentBackStep] = useState<ScheduleAppointmentStep>('address')
  const operator = usePatientRegistrationOperator()

  const catalogEnabled = open && step === 'specialty'
  const {
    specialties: rh3Specialties,
    isLoading: isCatalogLoading,
    loadError: catalogLoadError,
    reload: reloadCatalog,
  } = useUbtRh3ScheduleSpecialtyCatalog(catalogEnabled)

  const resetFlow = useCallback(() => {
    setStep('cpf_lookup')
    setRegistration(emptyPatientRegistration())
    setSession(emptyAttendanceSession())
    setSelectedDate(initialDate)
    setSelectedDoctorId('')
    setSelectedDoctorName('')
    setSelectedTime('')
    setRh3EspecialidadId(null)
    setSelectedRh3TurnoId(null)
    setIsReturningPatient(false)
    setExistingPatientId(undefined)
    setIsSubmitting(false)
    setBookingError(null)
    setConsentBackStep('address')
  }, [initialDate])

  const applyInitialFlow = useCallback((flow: ScheduleAppointmentInitialState) => {
    setStep(flow.step)
    setRegistration(flow.registration)
    setSession(flow.session)
    setSelectedDate(flow.selectedDate)
    setSelectedDoctorId(flow.selectedDoctorId)
    setSelectedTime(flow.selectedTime)
    setIsReturningPatient(flow.isReturningPatient)
  }, [])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    if (initialFlow) {
      applyInitialFlow(initialFlow)
    } else {
      resetFlow()
    }

    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, initialFlow, applyInitialFlow, resetFlow])

  const isActive = open || closing

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && step !== 'success') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose, step])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const panelVisible = isActive && entered && !closing

  function goToSpecialty() {
    setStep('specialty')
  }

  function goToScheduleDateTime() {
    setSelectedTime('')
    setSelectedDoctorId('')
    setSelectedDoctorName('')
    setSelectedRh3TurnoId(null)
    setStep('schedule_datetime')
  }

  function handleSelectSpecialty(id: string, name: string) {
    const item = rh3Specialties.find((specialty) => specialty.id === id)
    setSession((prev) => ({ ...prev, specialtyId: id, specialtyName: name }))
    setRh3EspecialidadId(item?.rh3EspecialidadId ?? null)
  }

  async function confirmSchedule() {
    const rh3Id = rh3EspecialidadId
    if (rh3Id == null || selectedRh3TurnoId == null || !selectedTime || isSubmitting) return

    setIsSubmitting(true)
    setBookingError(null)

    try {
      const saved = await persistPatient(registration, existingPatientId)
      const pacienteId = saved.id

      const isReschedule = initialFlow?.mode === 'reschedule'
      const summary = isReschedule
        ? `Consulta reagendada para ${registration.fullName}`
        : `Consulta agendada para ${registration.fullName}`

      await bookRh3Appointment({
        pacienteId,
        especialidadeId: session.specialtyId,
        rh3EspecialidadId: rh3Id,
        idTurno: selectedRh3TurnoId,
        data: toDateKey(selectedDate),
        hora: parseRh3ScheduleHourToApi(selectedTime),
        professionalName: selectedDoctorName || undefined,
        specialtyName: session.specialtyName,
        paciente: {
          cpf: registration.cpf,
          fullName: registration.fullName,
          email: registration.email,
          phone: registration.phone,
          birthDate: registration.birthDate,
          gender: registration.gender,
        },
      })

      const meta = {
        profissionalId: String(selectedRh3TurnoId),
        especialidadeId: session.specialtyId,
        selectedDate,
        selectedTime,
        origemAtendimento: 'mt' as const,
        rh3Booked: true,
      }

      if (isReschedule && initialFlow?.rescheduleAppointmentId && onRescheduled) {
        await onRescheduled(
          initialFlow.rescheduleAppointmentId,
          {
            time: selectedTime,
            serviceType: session.specialtyName,
          },
          summary,
          meta,
        )
      } else {
        await onScheduled(registration, summary, { pacienteId, ...meta })
      }

      setStep('success')
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir o agendamento terceirizado.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCloseAfterSuccess() {
    onClose()
  }

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        tabIndex={panelVisible ? 0 : -1}
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar agendamento"
        onClick={step === 'success' ? handleCloseAfterSuccess : onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/60 to-white px-5 pb-4 pt-4 sm:px-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]">
              <CalendarPlus className="h-6 w-6" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="schedule-drawer-title"
                className="text-lg font-bold text-gray-900 sm:text-xl"
              >
                {initialFlow?.drawerTitle ?? 'Agendar consulta'}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {initialFlow?.drawerSubtitle ??
                  '1. CPF e cadastro · 2. Especialidade · 3. Data, médico e horário'}
              </p>
            </div>
            <button
              type="button"
              onClick={step === 'success' ? handleCloseAfterSuccess : onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {step !== 'success' ? (
            <div className="mt-4">
              <ScheduleAppointmentFlowStepper step={step} />
            </div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-6 sm:py-5">
          {step === 'cpf_lookup' && (
            <CpfLookupStep
              cpf={registration.cpf}
              lookupByCpf={lookupByCpf}
              onChangeCpf={(cpf) => setRegistration((prev) => ({ ...prev, cpf }))}
              onFound={(found, meta) => {
                setIsReturningPatient(true)
                setRegistration(found)
                setExistingPatientId(meta?.patientId)
                setSession((prev) => ({
                  ...prev,
                  ageGroup: inferAgeGroupFromBirthDate(found.birthDate),
                }))
                setStep('confirm_registration')
              }}
              onNotFound={(cpf) => {
                setIsReturningPatient(false)
                setRegistration({
                  ...emptyPatientRegistration(),
                  cpf,
                })
                setSession((prev) => ({ ...prev, ageGroup: null }))
                setStep('age_group')
              }}
              onBack={onClose}
            />
          )}

          {step === 'confirm_registration' && (
            <PatientRegistrationConfirmStep
              hidePhoto
              data={registration}
              ageGroup={session.ageGroup ?? inferAgeGroupFromBirthDate(registration.birthDate) ?? 'adult'}
              onChange={setRegistration}
              onSubmit={() => {
                setConsentBackStep('confirm_registration')
                setStep('registration_consent')
              }}
              onBack={() => setStep('cpf_lookup')}
              onOpenPhotoCapture={() => {}}
            />
          )}

          {step === 'registration_consent' && (
            <PatientRegistrationConsentStep
              embedded
              data={registration}
              ageGroup={session.ageGroup ?? inferAgeGroupFromBirthDate(registration.birthDate) ?? 'adult'}
              operator={operator}
              onChange={setRegistration}
              onSubmit={() => setStep('specialty')}
              onBack={() => setStep(consentBackStep)}
              continueLabel="Continuar para especialidade"
            />
          )}

          {step === 'age_group' && (
            <AgeGroupSelectionStep
              selected={session.ageGroup}
              onSelect={(group) =>
                setSession((prev) => ({ ...prev, ageGroup: group }))
              }
              onBack={() => setStep('cpf_lookup')}
              onContinue={() => {
                if (!session.ageGroup) return
                setStep('registration')
              }}
            />
          )}

          {step === 'registration' && (
            <PatientRegistrationForm
              data={registration}
              ageGroup={session.ageGroup ?? 'adult'}
              cpfLocked
              onChange={setRegistration}
              onSubmit={() => setStep('contacts')}
              onBack={() => setStep('age_group')}
            />
          )}

          {step === 'contacts' && (
            <PatientContactsStep
              data={registration}
              onChange={setRegistration}
              onSubmit={() => setStep('address')}
              onBack={() => setStep('registration')}
            />
          )}

          {step === 'address' && (
            <PatientAddressStep
              data={registration}
              onChange={setRegistration}
              onSubmit={() => {
                setConsentBackStep('address')
                setStep('registration_consent')
              }}
              onBack={() => setStep('contacts')}
              requiredTerritory={territoryPolicy.requiredTerritory}
              contractAllowsOtherMunicipalities={territoryPolicy.allowsOtherMunicipalities}
              entidadeTipo={territoryPolicy.policy?.tipoEntidade}
              territoryScope="patient_registration"
              policyLoadWarning={territoryPolicy.loadError}
              isPolicyLoading={territoryPolicy.isLoading}
            />
          )}

          {step === 'specialty' && (
            <SpecialtySelectionStep
              selectedId={session.specialtyId}
              requireAvailability={false}
              specialties={rh3Specialties}
              isLoading={isCatalogLoading}
              loadError={catalogLoadError}
              onRetryLoad={() => void reloadCatalog()}
              description="Escolha a especialidade terceirizada autorizada no contrato. Na etapa seguinte você verá datas, médicos e horários disponíveis."
              emptyMessage="Nenhuma especialidade terceirizada autorizada no contrato ativo."
              onSelect={handleSelectSpecialty}
              onBack={() => {
                if (initialFlow?.mode === 'reschedule') {
                  onClose()
                  return
                }
                setStep('registration_consent')
              }}
              onContinue={() => {
                if (!rh3EspecialidadId) return
                goToScheduleDateTime()
              }}
            />
          )}

          {step === 'schedule_datetime' && rh3EspecialidadId == null ? (
            <AttendanceStepShell
              hideScrollbar
              fillAvailable
              embedded
              title="Data e horário"
              description="Esta especialidade está configurada como terceirizada, mas não foi encontrada no catálogo RH3."
              footer={<AttendanceStepFooter onBack={() => setStep('specialty')} />}
            >
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Verifique a configuração RH3 e se o nome da especialidade coincide com o catálogo
                terceirizado.
              </p>
            </AttendanceStepShell>
          ) : null}

          {step === 'schedule_datetime' && rh3EspecialidadId != null ? (
            <>
              {bookingError ? (
                <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {bookingError}
                </p>
              ) : null}
            <ScheduleRh3DateTimeStep
              specialtyName={session.specialtyName}
              rh3EspecialidadId={rh3EspecialidadId}
              selectedDate={selectedDate}
              selectedTurnoId={selectedRh3TurnoId}
              selectedTime={selectedTime}
              selectedProfessionalName={selectedDoctorName}
              onSelectDate={(date) => {
                setSelectedDate(date)
                setSelectedTime('')
                setSelectedRh3TurnoId(null)
                setSelectedDoctorName('')
              }}
              onSelectSlot={(slot: Rh3ScheduleSlot) => {
                setSelectedRh3TurnoId(slot.idTurno)
                setSelectedTime(formatRh3ScheduleHour(slot.hour))
                setSelectedDoctorName(formatRh3ProfessionalName(slot.professionalName ?? ''))
                setSelectedDoctorId(
                  slot.professionalId != null ? String(slot.professionalId) : String(slot.idTurno),
                )
              }}
              onBack={() => setStep('specialty')}
              onContinue={confirmSchedule}
              isSubmitting={isSubmitting}
            />
            </>
          ) : null}

          {step === 'success' && (
            <ScheduleAppointmentSuccess
              draft={{
                registration,
                ageGroup: session.ageGroup,
                isReturningPatient: Boolean(registration.fullName),
                specialtyId: session.specialtyId,
                specialtyName: session.specialtyName,
                selectedDate,
                selectedDoctorId,
                selectedDoctorName,
                selectedTime,
              }}
              onClose={handleCloseAfterSuccess}
            />
          )}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
