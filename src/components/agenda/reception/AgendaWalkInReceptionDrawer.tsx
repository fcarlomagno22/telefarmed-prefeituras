import { UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DayAppointment } from '../../../data/agendaMock'
import { registerCompletedPatient } from '../../../data/patientLookup'
import {
  emptyAttendanceSession,
  emptyPatientRegistration,
  inferAgeGroupFromBirthDate,
  type AttendanceSession,
  type PatientRegistration,
} from '../../../data/unitDashboardMock'
import { createWalkInDayAppointment } from '../../../utils/agenda/createWalkInAppointment'
import { AgeGroupSelectionStep } from '../../dashboard/AgeGroupSelectionStep'
import { CpfLookupStep } from '../../dashboard/CpfLookupStep'
import { FaceCaptureModal } from '../../dashboard/FaceCaptureModal'
import { PatientAddressStep } from '../../dashboard/PatientAddressStep'
import { PatientContactsStep } from '../../dashboard/PatientContactsStep'
import { PatientPhotoStep } from '../../dashboard/PatientPhotoStep'
import { PatientRegistrationConfirmStep } from '../../dashboard/PatientRegistrationConfirmStep'
import { PatientRegistrationForm } from '../../dashboard/PatientRegistrationForm'
import { AgendaWalkInReceptionFlowStepper } from './AgendaWalkInReceptionFlowStepper'
import { AgendaWalkInReceptionSuccess } from './AgendaWalkInReceptionSuccess'
import type { AgendaWalkInReceptionStep } from './agendaWalkInReceptionTypes'
import { WalkInSpecialtyAvailabilityStep } from './WalkInSpecialtyAvailabilityStep'

type AgendaWalkInReceptionDrawerProps = {
  open: boolean
  closing: boolean
  selectedDate: Date
  existingAppointments: DayAppointment[]
  onClose: () => void
  onTransitionEnd: () => void
  onCompleted: (appointment: DayAppointment, registration: PatientRegistration) => void
}

export function AgendaWalkInReceptionDrawer({
  open,
  closing,
  selectedDate,
  existingAppointments,
  onClose,
  onTransitionEnd,
  onCompleted,
}: AgendaWalkInReceptionDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<AgendaWalkInReceptionStep>('specialty')
  const [registration, setRegistration] = useState(emptyPatientRegistration)
  const [session, setSession] = useState(emptyAttendanceSession)
  const [photoCaptureOpen, setPhotoCaptureOpen] = useState(false)
  const [completedAppointment, setCompletedAppointment] = useState<DayAppointment | null>(
    null,
  )

  const resetFlow = useCallback(() => {
    setStep('specialty')
    setRegistration(emptyPatientRegistration())
    setSession(emptyAttendanceSession())
    setPhotoCaptureOpen(false)
    setCompletedAppointment(null)
  }, [])

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

  function finishReception() {
    registerCompletedPatient(registration)
    const appointment = createWalkInDayAppointment(
      registration,
      session,
      existingAppointments,
    )
    setCompletedAppointment(appointment)
    onCompleted(appointment, registration)
    setStep('success')
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
          onClick={step === 'success' ? handleCloseAfterSuccess : onClose}
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
                  Paciente chegou sem horário: verifique a especialidade, complete o cadastro
                  como na triagem e inclua na agenda e na fila de espera.
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
                <AgendaWalkInReceptionFlowStepper step={step} />
              </div>
            ) : null}
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-6 sm:py-5">
            {step === 'specialty' && (
              <WalkInSpecialtyAvailabilityStep
                selectedDate={selectedDate}
                selectedId={session.specialtyId}
                onSelect={(id, name) =>
                  setSession((prev) => ({ ...prev, specialtyId: id, specialtyName: name }))
                }
                onBack={onClose}
                onContinue={() => setStep('cpf_lookup')}
              />
            )}

            {step === 'cpf_lookup' && (
              <CpfLookupStep
                cpf={registration.cpf}
                onChangeCpf={(cpf) => setRegistration((prev) => ({ ...prev, cpf }))}
                onFound={(found) => {
                  setRegistration(found)
                  setSession((prev) => ({
                    ...prev,
                    ageGroup: inferAgeGroupFromBirthDate(found.birthDate) ?? prev.ageGroup,
                  }))
                  setStep('confirm_registration')
                }}
                onFoundPendingFirstVisit={(payload) => {
                  setRegistration(payload.patient)
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
                onBack={() => setStep('specialty')}
              />
            )}

            {step === 'confirm_registration' && (
              <PatientRegistrationConfirmStep
                data={registration}
                onChange={setRegistration}
                onSubmit={() => setStep('photo')}
                onBack={() => setStep('cpf_lookup')}
                onOpenPhotoCapture={() => setPhotoCaptureOpen(true)}
                continueLabel="Continuar para foto"
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
                onSubmit={() => setStep('photo')}
                onBack={() => setStep('contacts')}
              />
            )}

            {step === 'photo' && (
              <PatientPhotoStep
                photoDataUrl={registration.photoDataUrl}
                description="Foto para identificação no Terminal. Após confirmar, o paciente entra na fila da triagem — sem abrir sala de espera virtual aqui."
                onOpenCapture={() => setPhotoCaptureOpen(true)}
                onContinue={finishReception}
                onBack={() =>
                  setStep(
                    session.ageGroup && registration.fullName
                      ? 'confirm_registration'
                      : 'address',
                  )
                }
              />
            )}

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
    </>,
    document.body,
  )
}
