import { UserPlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { PatientRegistrationForm } from '../dashboard/PatientRegistrationForm'
import { Toast } from '../ui/Toast'
import { useUbtPatientRegistration } from '../../hooks/useUbtPatientRegistration'
import { isUbtPacientesApiError } from '../../lib/services/ubt/pacientes'
import { emptyPatientRegistration, inferAgeGroupFromBirthDate, type PatientRegistration } from '../../types/attendance'
import { isRegistrationStepReady } from '../dashboard/registrationStepValidation'

type NetworkUserCreateDrawerProps = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function NetworkUserCreateDrawer({ open, onClose, onCreated }: NetworkUserCreateDrawerProps) {
  const { createPatient } = useUbtPatientRegistration()
  const [registration, setRegistration] = useState<PatientRegistration>(emptyPatientRegistration())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const ageGroup = useMemo(
    () => inferAgeGroupFromBirthDate(registration.birthDate) ?? 'adult',
    [registration.birthDate],
  )

  if (!open) return null

  async function handleSubmit() {
    if (!isRegistrationStepReady(registration, ageGroup, false)) return
    setIsSubmitting(true)
    try {
      await createPatient(registration)
      setRegistration(emptyPatientRegistration())
      onCreated()
      onClose()
    } catch (error) {
      const message = isUbtPacientesApiError(error)
        ? error.message
        : 'Não foi possível cadastrar o paciente.'
      setToast(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10040] flex items-stretch justify-end bg-gray-900/40 backdrop-blur-sm">
        <div className="flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900">Novo paciente</h2>
                <p className="text-xs text-gray-500">Cadastro na rede da unidade</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <PatientRegistrationForm
              embedded
              data={registration}
              ageGroup={ageGroup}
              description="Preencha os dados para cadastrar um novo paciente vinculado à unidade."
              onChange={setRegistration}
              onSubmit={() => void handleSubmit()}
              onBack={onClose}
            />
          </div>

          <footer className="border-t border-gray-200 px-5 py-4">
            <button
              type="button"
              disabled={isSubmitting || !isRegistrationStepReady(registration, ageGroup, false)}
              onClick={() => void handleSubmit()}
              className="btn-brand-gradient w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Cadastrar paciente'}
            </button>
          </footer>
        </div>
      </div>
      <Toast message={toast ?? ''} visible={toast !== null} onClose={() => setToast(null)} />
    </>,
    document.body,
  )
}
