import { UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DayAppointment } from '../../../data/agendaMock'
import { resolveWalkInMtFlowMode } from '../../../config/rh3WalkInSpecialty'
import { useUbtPatientRegistration } from '../../../hooks/useUbtPatientRegistration'
import { useUbtPatientTerritoryPolicy } from '../../../hooks/useUbtPatientTerritoryPolicy'
import { useUbtRh3ScheduleMutations } from '../../../hooks/useUbtRh3ScheduleMutations'
import { useUbtWalkInSpecialtyAvailability } from '../../../hooks/useUbtWalkInSpecialtyAvailability'
import type { Rh3ScheduleSlot } from '../../../lib/services/ubt/rh3'
import {
  emptyAttendanceSession,
  emptyPatientRegistration,
  inferAgeGroupFromBirthDate,
  type AttendanceSession,
  type PatientRegistration,
} from '../../../types/attendance'
import { formatAgendaDayLabel, toDateKey } from '../../../utils/agendaDate'
import { parseRh3ScheduleHourToApi } from '../../../utils/rh3ScheduleFormat'
import { AgeGroupSelectionStep } from '../../dashboard/AgeGroupSelectionStep'
import { CpfLookupStep } from '../../dashboard/CpfLookupStep'
import { FaceCaptureModal } from '../../dashboard/FaceCaptureModal'
import { PatientAddressStep } from '../../dashboard/PatientAddressStep'
import { PatientContactsStep } from '../../dashboard/PatientContactsStep'
import { PatientPhotoStep } from '../../dashboard/PatientPhotoStep'
import { PatientRegistrationConfirmStep } from '../../dashboard/PatientRegistrationConfirmStep'
import { PatientRegistrationConsentStep } from '../../dashboard/PatientRegistrationConsentStep'
import { PatientRegistrationForm } from '../../dashboard/PatientRegistrationForm'
import { usePatientRegistrationOperator } from '../../../hooks/usePatientRegistrationOperator'
import { SpecialtySelectionStep } from '../../dashboard/SpecialtySelectionStep'
import { WalkInDoctorTimeStep } from './WalkInDoctorTimeStep'
import { WalkInRh3WaitingRoomStep } from './WalkInRh3WaitingRoomStep'
import { ScheduleRh3DateTimeStep } from '../schedule/ScheduleRh3DateTimeStep'
import { AgendaWalkInReceptionFlowStepper } from './AgendaWalkInReceptionFlowStepper'
import { AgendaWalkInReceptionSuccess } from './AgendaWalkInReceptionSuccess'
import { ConsultationLockOverlay } from '../../dashboard/ConsultationLockOverlay'
import { writeConsultationLockToStorage } from '../../../hooks/useConsultationSessionGuard'
import type {
  AgendaWalkInReceptionStep,
  WalkInReceptionFlowMode,
} from './agendaWalkInReceptionTypes'

const MT_WAITING_ROOM_LOCK_Z_INDEX = 10_050

type AgendaWalkInReceptionDrawerProps = {
  open: boolean
  closing: boolean
  selectedDate: Date
  existingAppointments: DayAppointment[]
  onClose: () => void
  onTransitionEnd: () => void
  onCompleted: (
    appointment: DayAppointment,
    registration: PatientRegistration,
    options?: { skipFilaCheckIn?: boolean },
  ) => void
  onMtSessionEnded?: () => void
  onRegisterWalkIn: (payload: {
    pacienteId: string
    especialidadeId: string
    profissionalId: string
    hora: string
    telefoneContato?: string
  }) => Promise<DayAppointment>
}

export function AgendaWalkInReceptionDrawer({
  open,
  closing,
  selectedDate,
  existingAppointments,
  onClose,
  onTransitionEnd,
  onCompleted,
  onMtSessionEnded,
  onRegisterWalkIn,
}: AgendaWalkInReceptionDrawerProps) {
  const { lookupByCpf, registerCompletedPatient: persistPatient } = useUbtPatientRegistration()
  const { bookRh3Appointment, bookRh3ImmediateConsultation } = useUbtRh3ScheduleMutations()
  const territoryPolicy = useUbtPatientTerritoryPolicy(open)
  const registrationOperator = usePatientRegistrationOperator()
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<AgendaWalkInReceptionStep>('specialty')
  const [flowMode, setFlowMode] = useState<WalkInReceptionFlowMode>('mp')
  const [consentBackStep, setConsentBackStep] = useState<'photo' | 'confirm_registration'>('photo')
  const [registration, setRegistration] = useState(emptyPatientRegistration)
  const [session, setSession] = useState(emptyAttendanceSession)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDoctorName, setSelectedDoctorName] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [rh3EspecialidadId, setRh3EspecialidadId] = useState<number | null>(null)
  const [selectedRh3Date, setSelectedRh3Date] = useState(selectedDate)
  const [selectedRh3TurnoId, setSelectedRh3TurnoId] = useState<number | null>(null)
  const [mtDeeplinkUrl, setMtDeeplinkUrl] = useState<string | null>(null)
  const [mtScheduledTimeLabel, setMtScheduledTimeLabel] = useState('')
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false)
  const [existingPatientId, setExistingPatientId] = useState<string | undefined>()
  const [completedAppointment, setCompletedAppointment] = useState<DayAppointment | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mtWaitingRoomLocked, setMtWaitingRoomLocked] = useState(false)
  const [mtWaitingRoomAccessLoading, setMtWaitingRoomAccessLoading] = useState(false)
  const [mtWaitingRoomAccessError, setMtWaitingRoomAccessError] = useState<string | null>(null)

  const isMpFlow = flowMode === 'mp'
  const isMtImmediateFlow = flowMode === 'mt_immediate'
  const isMtScheduledFlow = flowMode === 'mt_scheduled'

  const catalogEnabled = open && step === 'specialty'
  const {
    specialties: walkInSpecialties,
    isLoading: isCatalogLoading,
    loadError: catalogLoadError,
    reload: reloadCatalog,
  } = useUbtWalkInSpecialtyAvailability(catalogEnabled, selectedDate)

  const resetFlow = useCallback(() => {
    setStep('specialty')
    setFlowMode('mp')
    setRegistration(emptyPatientRegistration())
    setSession(emptyAttendanceSession())
    setSelectedDoctorId('')
    setSelectedDoctorName('')
    setSelectedTime('')
    setRh3EspecialidadId(null)
    setSelectedRh3Date(selectedDate)
    setSelectedRh3TurnoId(null)
    setMtDeeplinkUrl(null)
    setMtScheduledTimeLabel('')
    setBookingError(null)
    setPhotoCaptureOpen(false)
    setExistingPatientId(undefined)
    setCompletedAppointment(null)
    setIsSubmitting(false)
    setMtWaitingRoomLocked(false)
    setMtWaitingRoomAccessLoading(false)
    setMtWaitingRoomAccessError(null)
  }, [selectedDate])

  const stepBeforeCpf = useCallback((): AgendaWalkInReceptionStep => {
    if (isMtImmediateFlow) return 'specialty'
    if (isMtScheduledFlow) return 'rh3_schedule_datetime'
    return 'schedule_datetime'
  }, [isMtImmediateFlow, isMtScheduledFlow])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    resetFlow()
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, resetFlow])

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && step !== 'success' && !mtWaitingRoomLocked) onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose, step, mtWaitingRoomLocked])

  function handleAccessMtWaitingRoom() {
    if (!mtDeeplinkUrl || mtWaitingRoomAccessLoading || mtWaitingRoomLocked) return

    setMtWaitingRoomAccessLoading(true)
    setMtWaitingRoomAccessError(null)

    // window.open com noopener/noreferrer costuma retornar null mesmo abrindo a aba.
    const link = document.createElement('a')
    link.href = mtDeeplinkUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.click()

    writeConsultationLockToStorage(true)
    setMtWaitingRoomLocked(true)
    setMtWaitingRoomAccessLoading(false)
  }

  function handleMtWaitingRoomComplete() {
    writeConsultationLockToStorage(false)
    setMtWaitingRoomLocked(false)
    onMtSessionEnded?.()
    handleCloseAfterSuccess()
  }

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  async function finishMtReception(nextRegistration: PatientRegistration) {
    const rh3Id = rh3EspecialidadId
    if (rh3Id == null || isSubmitting) return

    setIsSubmitting(true)
    setBookingError(null)

    try {
      const saved = await persistPatient(nextRegistration, existingPatientId)
      const pacientePayload = {
        cpf: nextRegistration.cpf,
        fullName: nextRegistration.fullName,
        email: nextRegistration.email,
        phone: nextRegistration.phone,
        birthDate: nextRegistration.birthDate,
        gender: nextRegistration.gender,
      }

      if (isMtImmediateFlow) {
        const response = await bookRh3ImmediateConsultation({
          pacienteId: saved.id,
          especialidadeId: session.specialtyId,
          rh3EspecialidadId: rh3Id,
          specialtyName: session.specialtyName,
          paciente: pacientePayload,
        })
        setMtDeeplinkUrl(response.consultation.deeplinkPaciente)
        setMtScheduledTimeLabel('')
        onCompleted(response.consultation.appointment, nextRegistration, { skipFilaCheckIn: true })
      } else {
        if (selectedRh3TurnoId == null || !selectedTime) return
        const response = await bookRh3Appointment({
          pacienteId: saved.id,
          especialidadeId: session.specialtyId,
          rh3EspecialidadId: rh3Id,
          idTurno: selectedRh3TurnoId,
          data: toDateKey(selectedRh3Date),
          hora: parseRh3ScheduleHourToApi(selectedTime),
          professionalName: selectedDoctorName || undefined,
          specialtyName: session.specialtyName,
          paciente: pacientePayload,
        })
        const deeplink = response.appointment.deeplinkPaciente
        if (!deeplink) {
          throw new Error('Link de teleconsulta não retornado pelo parceiro.')
        }
        setMtDeeplinkUrl(deeplink)
        setMtScheduledTimeLabel(
          `${formatAgendaDayLabel(selectedRh3Date)} · ${selectedTime}`,
        )
        onCompleted(response.appointment.appointment, nextRegistration, { skipFilaCheckIn: true })
      }

      setRegistration(nextRegistration)
      setStep('mt_waiting_room')
    } catch {
      setBookingError('Não foi possível registrar a teleconsulta terceirizada. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function finishReception(nextRegistration: PatientRegistration) {
    if (isSubmitting) return
    if (!isMpFlow) {
      await finishMtReception(nextRegistration)
      return
    }

    setIsSubmitting(true)
    try {
      const saved = await persistPatient(nextRegistration, existingPatientId)
      const appointment = await onRegisterWalkIn({
        pacienteId: saved.id,
        especialidadeId: session.specialtyId,
        profissionalId: selectedDoctorId,
        hora: selectedTime,
        telefoneContato: nextRegistration.phone,
      })
      setCompletedAppointment(appointment)
      onCompleted(appointment, nextRegistration)
      setRegistration(nextRegistration)
      setStep('success')
    } catch {
      // falha silenciosa — operador pode tentar novamente
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCloseAfterSuccess() {
    onClose()
  }

  if (!isActive) return null

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          tabIndex={panelVisible ? 0 : -1}
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-label="Fechar recepção presencial"
          onClick={
            mtWaitingRoomLocked
              ? undefined
              : step === 'success'
                ? handleCloseAfterSuccess
                : onClose
          }
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="walkin-reception-title"
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.propertyName === 'transform') onTransitionEnd()
          }}
          className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
            panelVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-violet-50/80 via-[var(--brand-primary-light)]/40 to-white px-5 pb-4 pt-4 sm:px-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]">
                <UserPlus className="h-6 w-6" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="walkin-reception-title"
                  className="text-lg font-bold text-gray-900 sm:text-xl"
                >
                  Recepção presencial (encaixe)
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  1. Especialidade e horário · 2. CPF e cadastro · 3. Foto e fila
                </p>
              </div>
              <button
                type="button"
                onClick={
                  mtWaitingRoomLocked
                    ? undefined
                    : step === 'success' || step === 'mt_waiting_room'
                      ? handleCloseAfterSuccess
                      : onClose
                }
          disabled={mtWaitingRoomLocked}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 ${
            mtWaitingRoomLocked ? 'pointer-events-none opacity-40' : ''
          }`}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {step !== 'success' && step !== 'mt_waiting_room' ? (
              <div className="mt-4">
                <AgendaWalkInReceptionFlowStepper step={step} />
              </div>
            ) : null}
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-6 sm:py-5">
            {bookingError ? (
              <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {bookingError}
              </p>
            ) : null}

            {step === 'specialty' && (
              <SpecialtySelectionStep
                selectedDate={selectedDate}
                showAvailability
                availabilityFilter="with-slots-only"
                walkInAvailabilityLabels
                specialties={walkInSpecialties}
                isLoading={isCatalogLoading}
                loadError={catalogLoadError}
                onRetryLoad={() => void reloadCatalog()}
                selectedId={session.specialtyId}
                description="Especialidades com médico disponível neste dia: plantão local (MP) ou teleconsulta terceirizada (MT) com vaga."
                emptyMessage="Nenhuma especialidade com médico disponível neste dia."
                onSelect={(id, name) =>
                  setSession((prev) => ({ ...prev, specialtyId: id, specialtyName: name }))
                }
                onBack={onClose}
                onContinue={() => {
                  const item = walkInSpecialties.find(
                    (specialty) => specialty.id === session.specialtyId,
                  )
                  const mtFlow = item ? resolveWalkInMtFlowMode(item) : null

                  setBookingError(null)
                  setSelectedDoctorId('')
                  setSelectedTime('')
                  setSelectedRh3TurnoId(null)
                  setSelectedRh3Date(selectedDate)

                  if (mtFlow === 'mt_immediate') {
                    if (!item?.rh3EspecialidadId) {
                      setBookingError(
                        'Esta especialidade terceirizada não está vinculada ao catálogo RH3.',
                      )
                      return
                    }
                    setFlowMode('mt_immediate')
                    setRh3EspecialidadId(item.rh3EspecialidadId)
                    setStep('cpf_lookup')
                    return
                  }

                  if (mtFlow === 'mt_scheduled') {
                    if (!item?.rh3EspecialidadId) {
                      setBookingError(
                        'Esta especialidade terceirizada não está vinculada ao catálogo RH3.',
                      )
                      return
                    }
                    setFlowMode('mt_scheduled')
                    setRh3EspecialidadId(item.rh3EspecialidadId)
                    setStep('rh3_schedule_datetime')
                    return
                  }

                  setFlowMode('mp')
                  setRh3EspecialidadId(null)
                  setStep('schedule_datetime')
                }}
              />
            )}

            {step === 'schedule_datetime' && isMpFlow && (
              <WalkInDoctorTimeStep
                specialtyId={session.specialtyId}
                specialtyName={session.specialtyName}
                selectedDate={selectedDate}
                selectedDoctorId={selectedDoctorId}
                selectedTime={selectedTime}
                onSelectDoctor={(doctorId, doctorName) => {
                  setSelectedDoctorId(doctorId)
                  setSelectedDoctorName(doctorName ?? '')
                }}
                onSelectTime={setSelectedTime}
                onBack={() => setStep('specialty')}
                onContinue={() => setStep('cpf_lookup')}
              />
            )}

            {step === 'rh3_schedule_datetime' && rh3EspecialidadId != null && isMtScheduledFlow ? (
              <ScheduleRh3DateTimeStep
                specialtyName={session.specialtyName}
                rh3EspecialidadId={rh3EspecialidadId}
                selectedDate={selectedRh3Date}
                selectedTurnoId={selectedRh3TurnoId}
                selectedTime={selectedTime}
                selectedProfessionalName={selectedDoctorName}
                onSelectDate={(date) => {
                  setSelectedRh3Date(date)
                  setSelectedTime('')
                  setSelectedRh3TurnoId(null)
                  setSelectedDoctorName('')
                }}
                onSelectSlot={(slot: Rh3ScheduleSlot) => {
                  setSelectedRh3TurnoId(slot.idTurno)
                  setSelectedTime(slot.hour)
                  setSelectedDoctorName(slot.professionalName ?? '')
                }}
                onBack={() => setStep('specialty')}
                onContinue={() => setStep('cpf_lookup')}
                continueLabel="Continuar"
              />
            ) : null}

            {step === 'cpf_lookup' && (
              <CpfLookupStep
                cpf={registration.cpf}
                lookupByCpf={lookupByCpf}
                onChangeCpf={(cpf) => setRegistration((prev) => ({ ...prev, cpf }))}
                onFound={(found, meta) => {
                  setRegistration(found)
                  setExistingPatientId(meta?.patientId)
                  setSession((prev) => ({
                    ...prev,
                    ageGroup: inferAgeGroupFromBirthDate(found.birthDate) ?? prev.ageGroup,
                  }))
                  setStep('confirm_registration')
                }}
                onFoundPendingFirstVisit={(payload) => {
                  setRegistration(payload.patient)
                  setExistingPatientId(payload.patientId)
                  setSession((prev) => ({
                    ...prev,
                    specialtyId: payload.specialtyId || prev.specialtyId,
                    specialtyName: payload.specialtyName || prev.specialtyName,
                    ageGroup:
                      inferAgeGroupFromBirthDate(payload.patient.birthDate) ?? prev.ageGroup,
                  }))
                  setStep('confirm_registration')
                }}
                onNotFound={(cpf) => {
                  setRegistration({
                    ...emptyPatientRegistration(),
                    cpf,
                  })
                  setSession((prev) => ({ ...prev, ageGroup: null }))
                  setStep('age_group')
                }}
                onBack={() => setStep(stepBeforeCpf())}
              />
            )}

            {step === 'confirm_registration' && (
              <PatientRegistrationConfirmStep
                embedded
                data={registration}
                ageGroup={session.ageGroup ?? inferAgeGroupFromBirthDate(registration.birthDate) ?? 'adult'}
                onChange={setRegistration}
                onSubmit={() => {
                  setConsentBackStep('confirm_registration')
                  setStep('registration_consent')
                }}
                onBack={() => setStep('cpf_lookup')}
                onOpenPhotoCapture={() => setPhotoCaptureOpen(true)}
                continueLabel="Continuar"
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
                onSubmit={() =>
                  setStep(isMpFlow ? 'photo' : 'registration_consent')
                }
                onBack={() => setStep('contacts')}
                requiredTerritory={territoryPolicy.requiredTerritory}
                contractAllowsOtherMunicipalities={territoryPolicy.allowsOtherMunicipalities}
                entidadeTipo={territoryPolicy.policy?.tipoEntidade}
                territoryScope="patient_registration"
                policyLoadWarning={territoryPolicy.loadError}
                isPolicyLoading={territoryPolicy.isLoading}
              />
            )}

            {step === 'photo' && isMpFlow && (
              <PatientPhotoStep
                photoDataUrl={registration.photoDataUrl}
                description="Foto para identificação no Terminal. Após confirmar, o paciente entra na fila da triagem — sem abrir sala de espera virtual aqui."
                onOpenCapture={() => setPhotoCaptureOpen(true)}
                onContinue={() => {
                  setConsentBackStep('photo')
                  setStep('registration_consent')
                }}
                onBack={() =>
                  setStep(
                    session.ageGroup && registration.fullName
                      ? 'confirm_registration'
                      : 'address',
                  )
                }
                isSubmitting={isSubmitting}
                continueLabel="Continuar"
                submittingLabel="Continuando…"
              />
            )}

            {step === 'registration_consent' && (
              <PatientRegistrationConsentStep
                embedded
                data={registration}
                ageGroup={session.ageGroup ?? inferAgeGroupFromBirthDate(registration.birthDate) ?? 'adult'}
                operator={registrationOperator}
                onChange={setRegistration}
                onSubmit={(nextRegistration) => void finishReception(nextRegistration)}
                onBack={() => setStep(consentBackStep)}
                continueLabel="Continuar"
                continueLoading={isSubmitting}
              />
            )}

            {step === 'mt_waiting_room' && mtDeeplinkUrl && !mtWaitingRoomLocked ? (
              <WalkInRh3WaitingRoomStep
                registration={registration}
                specialtyName={session.specialtyName}
                scheduledTimeLabel={mtScheduledTimeLabel || undefined}
                mode={isMtImmediateFlow ? 'immediate' : 'scheduled'}
                loading={mtWaitingRoomAccessLoading}
                accessError={mtWaitingRoomAccessError}
                onAccessWaitingRoom={handleAccessMtWaitingRoom}
                onCancel={handleCloseAfterSuccess}
              />
            ) : null}

            {step === 'success' && completedAppointment && (
              <AgendaWalkInReceptionSuccess
                appointment={completedAppointment}
                onClose={handleCloseAfterSuccess}
              />
            )}
          </div>
        </aside>
      </div>

      <FaceCaptureModal
        open={photoCaptureOpen}
        onClose={() => setPhotoCaptureOpen(false)}
        onCapture={(photoDataUrl) => {
          setRegistration((prev) => ({ ...prev, photoDataUrl }))
          setPhotoCaptureOpen(false)
        }}
      />

      <ConsultationLockOverlay
        active={mtWaitingRoomLocked}
        skipFeedback
        patientCpf={registration.cpf}
        stackZIndex={MT_WAITING_ROOM_LOCK_Z_INDEX}
        onComplete={handleMtWaitingRoomComplete}
      />
    </>,
    document.body,
  )
}
