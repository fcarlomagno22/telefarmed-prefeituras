import { CalendarClock, CircleDollarSign, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ProfissionalEscalaDisponivel } from '../../../types/profissionalEscalaDisponivel'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import {
  formatProfissionalEscalaCardDate,
  formatProfissionalEscalaDurationLabel,
  formatProfissionalEscalaTimeRange,
} from './profissionalEscalaUi'

type ProfissionalEscalaClaimModalProps = {
  open: boolean
  shift: ProfissionalEscalaDisponivel | null
  onConfirm: () => void
  onCancel: () => void
  tourLockClose?: boolean
}

export function ProfissionalEscalaClaimModal({
  open,
  shift,
  onConfirm,
  onCancel,
  tourLockClose = false,
}: ProfissionalEscalaClaimModalProps) {
  useEffect(() => {
    if (!open || tourLockClose) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel, tourLockClose])

  if (!open || !shift) return null

  const dateParts = formatProfissionalEscalaCardDate(shift.startAt)

  function handleCancel(event?: React.SyntheticEvent) {
    if (tourLockClose) {
      event?.preventDefault()
      event?.stopPropagation()
      return
    }
    onCancel()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return
        handleCancel(event)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prof-escala-claim-title"
        data-tour="escala-claim-modal"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 id="prof-escala-claim-title" className="text-lg font-bold text-gray-900">
              Confirmar plantão
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Revise dia, horário e valor antes de reservar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="rounded-xl border border-gray-100 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {shift.specialty} · {shift.modalityLabel}
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              {dateParts.day} {dateParts.month} ({dateParts.weekday}) ·{' '}
              {formatProfissionalEscalaTimeRange(shift.startAt, shift.endAt)}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              {formatProfissionalEscalaDurationLabel(shift)} · {shift.turnLabel}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">{shift.unitName}</p>
            <p className="mt-0.5 text-xs text-gray-600">{shift.modalityLabel}</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3">
            <CircleDollarSign className="h-5 w-5 text-amber-700" aria-hidden />
            <div>
              <p className="text-[10px] font-semibold uppercase text-amber-800">Valor do plantão</p>
              <p className="text-lg font-bold text-amber-900">
                {formatProfissionalCurrency(shift.amountCents)}
              </p>
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Após confirmar, o plantão entra na sua Agenda e o valor segue para o Financeiro na
            competência correspondente.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Pegar plantão
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
