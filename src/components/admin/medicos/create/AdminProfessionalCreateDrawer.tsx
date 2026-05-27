import { Stethoscope, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminDoctor } from '../../../../data/adminMedicosMock'
import { draftToAdminDoctor } from './adminProfessionalCreateMapper'
import { AdminProfessionalAddressStep } from './AdminProfessionalAddressStep'
import { AdminProfessionalCreateFlowStepper } from './AdminProfessionalCreateFlowStepper'
import { AdminProfessionalCreateSuccess } from './AdminProfessionalCreateSuccess'
import { AdminProfessionalPhotoStep } from './AdminProfessionalPhotoStep'
import { AdminProfessionalProfileStep } from './AdminProfessionalProfileStep'
import {
  emptyAdminProfessionalCreateDraft,
  isAddressStepReady,
  isPhotoStepReady,
  isProfileStepReady,
  type AdminProfessionalCreateDraft,
  type AdminProfessionalCreateStep,
} from './adminProfessionalCreateTypes'

type AdminProfessionalCreateDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onCompleted: (doctor: AdminDoctor) => void
}

export function AdminProfessionalCreateDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
  onCompleted,
}: AdminProfessionalCreateDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<AdminProfessionalCreateStep>('profile')
  const [draft, setDraft] = useState<AdminProfessionalCreateDraft>(() =>
    emptyAdminProfessionalCreateDraft(),
  )

  const resetFlow = useCallback(() => {
    setStep('profile')
    setDraft(emptyAdminProfessionalCreateDraft())
  }, [])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    resetFlow()
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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

  function handleCloseAfterSuccess() {
    onClose()
  }

  function completeRegistration() {
    const doctor = draftToAdminDoctor(draft)
    onCompleted(doctor)
    setStep('success')
  }

  if (!isActive) return null

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          tabIndex={panelVisible ? 0 : -1}
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-label="Fechar cadastro de profissional"
          onClick={step === 'success' ? handleCloseAfterSuccess : onClose}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-professional-create-title"
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
                <Stethoscope className="h-6 w-6" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="admin-professional-create-title"
                  className="text-lg font-bold text-gray-900 sm:text-xl"
                >
                  Cadastrar profissional
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Preencha os dados, endereço, foto e senha de acesso do profissional.
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
                <AdminProfessionalCreateFlowStepper step={step} />
              </div>
            ) : null}
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-6 sm:py-5">
            {step === 'profile' ? (
              <AdminProfessionalProfileStep
                draft={draft}
                onChange={setDraft}
                onBack={onClose}
                onSubmit={() => {
                  if (!isProfileStepReady(draft)) return
                  setStep('address')
                }}
              />
            ) : null}

            {step === 'address' ? (
              <AdminProfessionalAddressStep
                draft={draft}
                onChange={setDraft}
                onBack={() => setStep('profile')}
                onSubmit={() => {
                  if (!isAddressStepReady(draft)) return
                  setStep('photo')
                }}
              />
            ) : null}

            {step === 'photo' ? (
              <AdminProfessionalPhotoStep
                draft={draft}
                onChange={setDraft}
                onBack={() => setStep('address')}
                onContinue={() => {
                  if (!isPhotoStepReady(draft)) return
                  completeRegistration()
                }}
              />
            ) : null}

            {step === 'success' ? (
              <AdminProfessionalCreateSuccess draft={draft} onClose={handleCloseAfterSuccess} />
            ) : null}
          </div>
        </aside>
      </div>

    </>,
    document.body,
  )
}
