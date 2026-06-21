import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'

type PrefeituraFaturamentoPendenciaIgnoreModalProps = {
  open: boolean
  item: PrefeituraFaturamentoPendencia | null
  onClose: () => void
  onConfirm: (justification: string) => void
}

export function PrefeituraFaturamentoPendenciaIgnoreModal({
  open,
  item,
  onClose,
  onConfirm,
}: PrefeituraFaturamentoPendenciaIgnoreModalProps) {
  const [justification, setJustification] = useState('')

  useEffect(() => {
    if (!open) {
      setJustification('')
      return
    }
    setJustification('')
  }, [open, item?.id])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open || !item) return null

  const canConfirm = justification.trim().length >= 10

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pendencia-ignore-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-white px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-gray-500 shadow-sm transition hover:border-gray-200 hover:bg-white hover:text-gray-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm ring-1 ring-amber-100">
            <AlertTriangle className="h-6 w-6" strokeWidth={2} />
          </span>

          <h2 id="pendencia-ignore-title" className="mt-4 pr-10 text-xl font-bold text-gray-900">
            Ignorar esta pendência?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Essa ação ficará registrada no log. Apenas avisos podem ser ignorados sem bloquear o
            fechamento.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">{item.title}</p>
            <p className="mt-1 text-gray-600">{item.patientName}</p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-gray-800">Motivo</span>
            <textarea
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              rows={4}
              placeholder="Descreva por que esta pendência pode ser ignorada..."
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
            <span className="mt-1 block text-xs text-gray-500">Mínimo de 10 caracteres.</span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => onConfirm(justification)}
              className="btn-brand-gradient inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar ignorar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
