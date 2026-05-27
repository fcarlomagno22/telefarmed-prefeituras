import { CalendarPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { registerScheduledFirstVisitPatient } from '../../../data/patientLookup'
import { inferAgeGroupFromBirthDate } from '../../../data/unitDashboardMock'
import {
  emptyAttendanceSession,
  emptyPatientRegistration,
  type PatientRegistration,
} from '../../../data/unitDashboardMock'
import { getDoctorsForSpecialty } from '../../../data/scheduleDoctorsMock'
import { AgeGroupSelectionStep } from '../../dashboard/AgeGroupSelectionStep'
import { CpfLookupStep } from '../../dashboard/CpfLookupStep'
import { PatientAddressStep } from '../../dashboard/PatientAddressStep'
import { PatientContactsStep } from '../../dashboard/PatientContactsStep'
import { PatientRegistrationConfirmStep } from '../../dashboard/PatientRegistrationConfirmStep'
import { PatientRegistrationForm } from '../../dashboard/PatientRegistrationForm'
import { SpecialtySelectionStep } from '../../dashboard/SpecialtySelectionStep'
import { ScheduleAppointmentFlowStepper } from './ScheduleAppointmentFlowStepper'
import { ScheduleAppointmentSuccess } from './ScheduleAppointmentSuccess'
import { ScheduleDateTimeStep } from './ScheduleDateTimeStep'
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
  onScheduled: (registration: PatientRegistration, summary: string) => void
  onRescheduled?: (
    appointmentId: string,
    patch: { time: string; serviceType: string },
    summary: string,
  ) => void
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
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<ScheduleAppointmentStep>('cpf_lookup')
  const [registration, setRegistration] = useState(emptyPatientRegistration)
  const [session, setSession] = useState(emptyAttendanceSession)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isReturningPatient, setIsReturningPatient] = useState(false)

  const resetFlow = useCallback(() => {
    setStep('cpf_lookup')
    setRegistration(emptyPatientRegistration())
    setSession(emptyAttendanceSession())
    setSelectedDate(initialDate)
    setSelectedDoctorId('')
    setSelectedTime('')
    setIsReturningPatient(false)
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
    const doctors = getDoctorsForSpecialty(session.specialtyId)
    if (!selectedDoctorId && doctors[0]) {
      setSelectedDoctorId(doctors[0].id)
    }
    setSelectedTime('')
    setStep('schedule_datetime')
  }

  function confirmSchedule() {
    if (!isReturningPatient) {
      registerScheduledFirstVisitPatient(
        registration,
        session.specialtyId,
        session.specialtyName,
      )
    }

    const isReschedule = initialFlow?.mode === 'reschedule'
    const summary = isReschedule
      ? `Consulta reagendada para ${registration.fullName}`
      : `Consulta agendada para ${registration.fullName}`

    if (
      isReschedule &&
      initialFlow?.rescheduleAppointmentId &&
      onRescheduled
    ) {
      onRescheduled(
        initialFlow.rescheduleAppointmentId,
        {
          time: selectedTime,
          serviceType: session.specialtyName,
        },
        summary,
      )
    } else {
      onScheduled(registration, summary)
    }

    setStep('success')
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
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]">
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
                  'Identifique o paciente, confirme o cadastro e escolha especialidade, médico e horário.'}
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
              onChangeCpf={(cpf) => setRegistration((prev) => ({ ...prev, cpf }))}
              onFound={(found) => {
                setIsReturningPatient(true)
                setRegistration(found)
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
              onChange={setRegistration}
              onSubmit={goToSpecialty}
              onBack={() => setStep('cpf_lookup')}
              onOpenPhotoCapture={() => {}}
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
              onSubmit={goToSpecialty}
              onBack={() => setStep('contacts')}
            />
          )}

          {step === 'specialty' && (
            <SpecialtySelectionStep
              selectedId={session.specialtyId}
              onSelect={(id, name) =>
                setSession((prev) => ({ ...prev, specialtyId: id, specialtyName: name }))
              }
              onBack={() => {
                if (initialFlow?.mode === 'reschedule') {
                  onClose()
                  return
                }
                if (isReturningPatient) {
                  setStep('confirm_registration')
                } else {
                  setStep('address')
                }
              }}
              onContinue={goToScheduleDateTime}
            />
          )}

          {step === 'schedule_datetime' && (
            <ScheduleDateTimeStep
              specialtyId={session.specialtyId}
              specialtyName={session.specialtyName}
              selectedDate={selectedDate}
              selectedDoctorId={selectedDoctorId}
              selectedTime={selectedTime}
              onSelectDate={(date) => {
                setSelectedDate(date)
                setSelectedTime('')
              }}
              onSelectDoctor={setSelectedDoctorId}
              onSelectTime={setSelectedTime}
              onBack={() => setStep('specialty')}
              onContinue={confirmSchedule}
            />
          )}

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
