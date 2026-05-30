import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminEscalaShift } from '../../../types/adminEscala'
import { AdminEscalaComposeContent } from './AdminEscalaComposeContent'

type AdminEscalaComposeDrawerProps = {
  open: boolean
  closing: boolean
  editingBatch: AdminEscalaShift[] | null
  allShifts: AdminEscalaShift[]
  onClose: () => void
  onTransitionEnd: () => void
  onSaved: (
    shifts: AdminEscalaShift[],
    options?: { replaceBatchId?: string; removeShiftIds?: string[] },
  ) => void
}

export function AdminEscalaComposeDrawer({
  open,
  closing,
  editingBatch,
  allShifts,
  onClose,
  onTransitionEnd,
  onSaved,
}: AdminEscalaComposeDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [composeStep, setComposeStep] = useState<1 | 2>(1)
  const isActive = open || closing
  const isScopeStep = composeStep === 1
  const panelVisible = isActive && entered && !closing
  const isEdit = editingBatch !== null && editingBatch.length > 0

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setComposeStep(1)
      return
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-950/50 backdrop-blur-md transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar montagem de escala"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-escala-compose-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={[
          'absolute inset-x-0 bottom-0 flex w-full flex-col overflow-hidden rounded-t-[1.25rem] bg-[#f8f9fb] shadow-[0_-24px_80px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-out',
          isScopeStep ? 'h-auto max-h-[96dvh]' : 'h-[96dvh] max-h-[96dvh]',
          panelVisible ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200/70 bg-white px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <h2
              id="admin-escala-compose-title"
              className="text-base font-bold tracking-tight text-gray-900 sm:text-lg"
            >
              {isEdit ? 'Editar escala do período' : 'Montar escala do período'}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
              Cobertura, especialidades, programação e equipe — em um único fluxo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 ring-1 ring-gray-200/80 hover:bg-gray-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          className={[
            'flex flex-col overflow-hidden p-3 sm:p-4 lg:p-5',
            isScopeStep ? 'shrink-0' : 'min-h-0 flex-1',
          ].join(' ')}
        >
          <AdminEscalaComposeContent
            key={editingBatch?.[0]?.batchId ?? 'new'}
            editingBatch={editingBatch}
            allShifts={allShifts}
            onActiveStepChange={setComposeStep}
            onSaved={(shifts, options) => {
              onSaved(shifts, options)
              onClose()
            }}
          />
        </div>
      </aside>
    </div>,
    document.body,
  )
}
