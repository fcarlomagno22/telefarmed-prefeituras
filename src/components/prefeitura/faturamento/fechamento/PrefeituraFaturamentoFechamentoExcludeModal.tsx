import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PrefeituraFaturamentoFechamentoLoteItem } from '../../../../types/prefeituraFaturamentoFechamento'

type PrefeituraFaturamentoFechamentoExcludeModalProps = {
  open: boolean
  item: PrefeituraFaturamentoFechamentoLoteItem | null
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function PrefeituraFaturamentoFechamentoExcludeModal({
  open,
  item,
  onClose,
  onConfirm,
}: PrefeituraFaturamentoFechamentoExcludeModalProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open, item?.id])

  if (!open || !item) return null

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exclude-lote-title"
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 id="exclude-lote-title" className="text-base font-bold text-gray-900">
                Excluir do lote
              </h2>
              <p className="mt-1 text-sm text-gray-600">{item.consultaId} · {item.patientName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-5 block text-sm font-semibold text-gray-900">
          Motivo da exclusão
        </label>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          placeholder="Ex.: duplicidade identificada, consulta fora da competência..."
          className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-40"
          >
            Excluir do lote
          </button>
        </div>
      </div>
    </div>
  )
}
