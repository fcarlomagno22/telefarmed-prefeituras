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
  isSaving?: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSaved: (
    shifts: AdminEscalaShift[],
    options?: { replaceBatchId?: string; removeShiftIds?: string[] },
  ) => void | boolean | Promise<void | boolean>
}

export function AdminEscalaComposeDrawer({
  open,
  closing,
  editingBatch,
  allShifts,
  isSaving = false,
  onClose,
  onTransitionEnd,
  onSaved,
}: AdminEscalaComposeDrawerProps) {
  const [entered, setEntered] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const isEdit = editingBatch !== null && editingBatch.length > 0

  useEffect(() => {
    if (!open) {
      setEntered(false)
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
        className={`absolute inset-0 bg-gray-950/55 backdrop-blur-sm transition-opacity duration-300 ${
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
          'absolute inset-x-2 bottom-2 flex h-[94dvh] max-h-[940px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out sm:inset-x-4 sm:bottom-4 lg:inset-x-8 lg:bottom-6',
          panelVisible ? 'translate-y-0' : 'translate-y-[105%]',
        ].join(' ')}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-8">
          <h2
            id="admin-escala-compose-title"
            className="text-lg font-bold tracking-tight text-gray-900"
          >
            {isEdit ? 'Editar escala' : 'Nova escala'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <AdminEscalaComposeContent
          key={editingBatch?.[0]?.batchId ?? 'new'}
          editingBatch={editingBatch}
          allShifts={allShifts}
          isSaving={isSaving}
          onSaved={async (shifts, options) => {
            const saved = await onSaved(shifts, options)
            if (saved !== false) onClose()
          }}
        />
      </aside>
    </div>,
    document.body,
  )
}
