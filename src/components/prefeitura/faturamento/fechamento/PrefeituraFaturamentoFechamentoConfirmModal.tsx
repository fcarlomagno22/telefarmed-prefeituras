import { Lock, X } from 'lucide-react'
import type { PrefeituraFaturamentoFechamentoSummary } from '../../../../types/prefeituraFaturamentoFechamento'

type PrefeituraFaturamentoFechamentoConfirmModalProps = {
  open: boolean
  summary: PrefeituraFaturamentoFechamentoSummary
  closing: boolean
  isComplement?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function PrefeituraFaturamentoFechamentoConfirmModal({
  open,
  summary,
  closing,
  isComplement = false,
  onClose,
  onConfirm,
}: PrefeituraFaturamentoFechamentoConfirmModalProps) {
  if (!open) return null

  const title = isComplement ? 'Fechar complemento' : 'Fechar competência'
  const confirmLabel = isComplement ? 'Confirmar complemento' : 'Confirmar fechamento'

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={() => {
          if (!closing) onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fechar-competencia-title"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h2 id="fechar-competencia-title" className="text-base font-bold text-gray-900">
                {title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{summary.competenciaLabel}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={closing}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm leading-relaxed text-gray-700">
          <p>
            Você está prestes a consolidar <strong>{summary.noLote}</strong> consulta(s){' '}
            {isComplement
              ? `no complemento SUS de ${summary.competenciaLabel}.`
              : `no fechamento SUS de ${summary.competenciaLabel}.`}
          </p>
          <p className="mt-2">
            {isComplement
              ? 'O lote principal permanece inalterado. Este complemento será registrado como envio adicional à mesma competência.'
              : 'Após fechar, novas consultas desta competência exigirão fechamento complementar ou reabertura administrativa.'}
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={closing}
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={closing}
            onClick={onConfirm}
            className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
