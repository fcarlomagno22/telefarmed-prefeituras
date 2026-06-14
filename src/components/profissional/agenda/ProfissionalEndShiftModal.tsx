import { X } from 'lucide-react'
import type { ProfissionalEndShiftSummary } from '../../../types/profissionalAgenda'

type ProfissionalEndShiftModalProps = {
  open: boolean
  summary: ProfissionalEndShiftSummary
  onClose: () => void
  onConfirm: () => void
}

export function ProfissionalEndShiftModal({
  open,
  summary,
  onClose,
  onConfirm,
}: ProfissionalEndShiftModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-shift-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="end-shift-title" className="text-lg font-bold text-gray-900">
            Encerrar plantão
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-600">
          Confira o resumo do turno antes de encerrar. Pacientes ainda na fila permanecerão
          registrados para a operação.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center">
            <dt className="text-xs font-semibold text-gray-500">Atendidos</dt>
            <dd className="mt-1 text-lg font-bold text-gray-900">{summary.atendidos}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center">
            <dt className="text-xs font-semibold text-gray-500">Não compareceu</dt>
            <dd className="mt-1 text-lg font-bold text-gray-900">{summary.naoCompareceu}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center">
            <dt className="text-xs font-semibold text-gray-500">Desistiu</dt>
            <dd className="mt-1 text-lg font-bold text-gray-900">{summary.desistiu}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center">
            <dt className="text-xs font-semibold text-gray-500">Tempo médio</dt>
            <dd className="mt-1 text-lg font-bold text-gray-900">
              {summary.tempoMedioMin > 0 ? `${summary.tempoMedioMin} min` : '—'}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-center text-xs text-gray-500">
          Duração do plantão:{' '}
          <strong className="text-gray-700">{summary.duracaoPlantaoMin} min</strong>
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Voltar à fila
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
          >
            Confirmar encerramento
          </button>
        </div>
      </div>
    </div>
  )
}
