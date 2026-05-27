import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { ConsultationDocumentItem } from './ConsultationDocumentsPanel'

type ConsultationDocumentDeleteConfirmModalProps = {
  open: boolean
  documentItem: ConsultationDocumentItem | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConsultationDocumentDeleteConfirmModal({
  open,
  documentItem,
  onCancel,
  onConfirm,
}: ConsultationDocumentDeleteConfirmModalProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }

    window.document.addEventListener('keydown', handleKeyDown)
    return () => window.document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open || !documentItem) return null

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center bg-gray-950/45 px-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="consultation-document-delete-title"
      aria-describedby="consultation-document-delete-description"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.2)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 className="h-6 w-6" strokeWidth={2} />
        </span>

        <h2 id="consultation-document-delete-title" className="mt-4 text-lg font-bold text-gray-900">
          Remover documento?
        </h2>
        <p
          id="consultation-document-delete-description"
          className="mt-3 text-sm leading-relaxed text-gray-600"
        >
          Remover <strong className="font-semibold text-gray-900">“{documentItem.title}”</strong>{' '}
          desta
          consulta? Você poderá gerar um novo documento em seguida.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="btn-danger-gradient w-full rounded-xl px-6 py-3 text-sm font-semibold sm:flex-1"
          >
            Remover
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 sm:flex-1"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
