import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ConfigExamCategory } from '../../../types/adminConfiguracoes'
import { configInputClass } from './adminConfiguracoesUi'

type AdminConfigExamCategoryFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialValue: ConfigExamCategory
  onClose: () => void
  onSubmit: (value: ConfigExamCategory) => void
  isSubmitting?: boolean
}

export function AdminConfigExamCategoryFormModal({
  open,
  mode,
  initialValue,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AdminConfigExamCategoryFormModalProps) {
  const [draft, setDraft] = useState(initialValue)

  useEffect(() => {
    if (open) {
      setDraft(initialValue)
    }
  }, [open, initialValue])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const title = mode === 'create' ? 'Nova categoria' : 'Editar categoria'
  const canSubmit = draft.name.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-gray-900/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-config-exam-category-form-title"
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 id="admin-config-exam-category-form-title" className="text-base font-bold text-gray-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Agrupamento exibido na solicitação de exames na consulta.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {mode === 'edit' ? <p className="text-xs text-gray-400">ID: {draft.id}</p> : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-600">Nome</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className={configInputClass}
              autoFocus
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={() => onSubmit({ ...draft, name: draft.name.trim() })}
            className="btn-brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Salvando…' : mode === 'create' ? 'Adicionar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
