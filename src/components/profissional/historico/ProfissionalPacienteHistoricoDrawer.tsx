import { History, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ProfissionalPacienteHistoricoPanel } from './ProfissionalPacienteHistoricoPanel'

type ProfissionalPacienteHistoricoDrawerProps = {
  open: boolean
  onClose: () => void
  accessToken: string | null
  pacienteId?: string
  patientName: string
  specialty: string
}

export function ProfissionalPacienteHistoricoDrawer({
  open,
  onClose,
  accessToken,
  pacienteId,
  patientName,
  specialty,
}: ProfissionalPacienteHistoricoDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)
  const panelVisible = open && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setClosing(false)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleClose() {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      setEntered(false)
      onClose()
    }, 280)
  }

  if (!open && !closing) return null

  return createPortal(
    <div className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <button
        type="button"
        tabIndex={panelVisible ? 0 : -1}
        className={`absolute inset-0 bg-gray-950/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fechar consultas anteriores"
        onClick={handleClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prof-historico-drawer-title"
        className={[
          'absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none',
          panelVisible ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-br from-[var(--brand-primary-light)]/50 via-white to-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                <History className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 id="prof-historico-drawer-title" className="text-lg font-bold text-gray-900">
                  Consultas anteriores
                </h2>
                <p className="text-xs text-gray-500">
                  {patientName} · {specialty}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ProfissionalPacienteHistoricoPanel
            accessToken={accessToken}
            pacienteId={pacienteId}
            patientName={patientName}
            specialty={specialty}
          />
        </div>
      </aside>
    </div>,
    document.body,
  )
}
