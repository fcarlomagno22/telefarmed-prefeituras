import { AlertTriangle, X } from 'lucide-react'
import { createPortal } from 'react-dom'

type AdminEscalaConflictsModalProps = {
  open: boolean
  conflicts: string[]
  isSaving: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function AdminEscalaConflictsModal({
  open,
  conflicts,
  isSaving,
  onConfirm,
  onCancel,
}: AdminEscalaConflictsModalProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        aria-label="Fechar"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="escala-conflicts-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 id="escala-conflicts-title" className="text-base font-bold text-gray-900">
                Conflitos de escala detectados
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Um ou mais profissionais já possuem plantões sobrepostos no período informado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm text-amber-950">
          {conflicts.map((conflict) => (
            <li key={conflict} className="leading-relaxed">
              {conflict}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Revisar escala
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Salvando…' : 'Salvar mesmo assim'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
