import { AlertTriangle, CalendarClock, Clock3, Stethoscope, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ProfissionalEscalaDisponivel } from '../../../types/profissionalEscalaDisponivel'
import {
  formatProfissionalEscalaCardDate,
  formatProfissionalEscalaTimeRange,
  profissionalEscalaPlantaoSubtitle,
} from './profissionalEscalaUi'

type ProfissionalEscalaCancelModalProps = {
  open: boolean
  shift: ProfissionalEscalaDisponivel | null
  onConfirm: () => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function ProfissionalEscalaCancelModal({
  open,
  shift,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: ProfissionalEscalaCancelModalProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open || !shift) return null

  const dateParts = formatProfissionalEscalaCardDate(shift.startAt)

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return
        onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prof-escala-cancel-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      >
        <div className="border-b border-red-100/80 bg-gradient-to-r from-red-50 via-white to-slate-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-800">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Cancelar reserva
              </span>
              <h2 id="prof-escala-cancel-title" className="mt-3 text-xl font-bold text-gray-900">
                Desistir deste plantão?
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                A vaga volta para a escala e sua taxa de aceitação pode ser afetada se houver
                faltas recorrentes.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-white hover:text-gray-700"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-gray-200 bg-slate-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white">
                <span className="text-lg font-bold text-gray-900">{dateParts.day}</span>
                <span className="text-[10px] font-bold uppercase text-[var(--brand-primary)]">
                  {dateParts.month}
                </span>
              </div>
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <Stethoscope className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
                  {shift.specialty}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-700">
                  <Clock3 className="h-4 w-4 text-gray-400" aria-hidden />
                  {formatProfissionalEscalaTimeRange(shift.startAt, shift.endAt)} · {shift.turnLabel}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {profissionalEscalaPlantaoSubtitle(shift)}
                </p>
              </div>
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Só é possível cancelar antes do início do plantão. Após confirmar, ele deixa de aparecer
            na sua Agenda.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Manter reserva
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Cancelando…' : 'Confirmar cancelamento'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
