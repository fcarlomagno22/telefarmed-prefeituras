import { FileText, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PatientRegistrationConsentTerm } from '../../types/patientRegistrationConsentTerms'

type PatientRegistrationConsentTermDrawerProps = {
  open: boolean
  closing: boolean
  term: PatientRegistrationConsentTerm | null
  onClose: () => void
  onTransitionEnd: () => void
}

export function PatientRegistrationConsentTermDrawer({
  open,
  closing,
  term,
  onClose,
  onTransitionEnd,
}: PatientRegistrationConsentTermDrawerProps) {
  const [entered, setEntered] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive || !term) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[10000] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        tabIndex={panelVisible ? 0 : -1}
        className={`absolute inset-0 bg-gray-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fechar termo"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-registration-consent-term-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/50 to-white px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]">
              <FileText className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="patient-registration-consent-term-title"
                className="text-base font-bold text-gray-900 sm:text-lg"
              >
                {term.title}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Versão {term.version}
                {term.updatedAtLabel ? ` · Atualizado em ${term.updatedAtLabel}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {term.content}
          </div>
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)]"
          >
            Fechar
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
