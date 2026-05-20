import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'btn-brand-gradient text-white'

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pb-5 pt-6">
          <h2 id="confirm-dialog-title" className="pr-8 text-base font-bold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
