import {
  Building2,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  HandMetal,
  MapPin,
  Stethoscope,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ProfissionalEscalaDisponivel } from '../../../types/profissionalEscalaDisponivel'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import { ProfissionalEscalaRepasseRulesPanel } from './ProfissionalEscalaRepasseRulesPanel'
import {
  formatProfissionalEscalaCardDate,
  formatProfissionalEscalaDurationLabel,
  formatProfissionalEscalaTimeRange,
  profissionalEscalaLocationLabel,
} from './profissionalEscalaUi'

type ProfissionalEscalaClaimModalProps = {
  open: boolean
  shift: ProfissionalEscalaDisponivel | null
  onConfirm: () => void
  onCancel: () => void
  tourLockClose?: boolean
  isSubmitting?: boolean
}

export function ProfissionalEscalaClaimModal({
  open,
  shift,
  onConfirm,
  onCancel,
  tourLockClose = false,
  isSubmitting = false,
}: ProfissionalEscalaClaimModalProps) {
  const [acceptedRules, setAcceptedRules] = useState(false)

  useEffect(() => {
    if (open && tourLockClose) {
      setAcceptedRules(true)
    }
  }, [open, tourLockClose, shift?.id])

  useEffect(() => {
    if (!open) {
      setAcceptedRules(false)
      return
    }
    if (!tourLockClose) {
      setAcceptedRules(false)
    }
  }, [open, shift?.id, tourLockClose])

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
  const location = profissionalEscalaLocationLabel(shift)
  const ModalityIcon = shift.modality === 'tele' ? Video : Building2

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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-[2px]"
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
        className="flex max-h-[min(92vh,40rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-orange-100/80 bg-gradient-to-r from-orange-50 via-white to-slate-50 px-6 py-5 sm:px-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--brand-primary)]/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-primary)] ring-1 ring-orange-100">
                  <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                  {shift.specialty}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                  <ModalityIcon className="h-3 w-3" aria-hidden />
                  {shift.modalityLabel}
                </span>
              </div>
              <h2 id="prof-escala-claim-title" className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                Confirmar plantão
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-600">
                Revise horário, valor e regras de repasse antes de reservar este turno.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl p-2 text-gray-400 transition hover:bg-white hover:text-gray-700"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:divide-x lg:divide-gray-100">
            <aside className="space-y-4 bg-slate-50/60 p-6 sm:p-8 lg:min-h-full">
              <div className="flex items-start gap-4">
                <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <span className="text-2xl font-bold leading-none tabular-nums text-gray-900">
                    {dateParts.day}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                    {dateParts.month}
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold capitalize text-gray-500">
                    {dateParts.weekday}
                  </span>
                </div>
                <div className="min-w-0 pt-1">
                  <p className="flex items-center gap-1.5 text-sm font-bold tabular-nums text-gray-900">
                    <Clock3 className="h-4 w-4 text-gray-400" aria-hidden />
                    {formatProfissionalEscalaTimeRange(shift.startAt, shift.endAt)}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {formatProfissionalEscalaDurationLabel(shift)} · {shift.turnLabel}
                  </p>
                  {shift.vacancies > 0 ? (
                    <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      {shift.vacancies} vaga{shift.vacancies === 1 ? '' : 's'}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  <CircleDollarSign className="h-4 w-4" aria-hidden />
                  Referência de valor
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-amber-950">
                  {formatProfissionalCurrency(shift.amountCents)}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-900/80">
                  Sujeito à modalidade e aos critérios de presença ao lado.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  {shift.modality === 'tele' ? (
                    <Video className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {shift.modality === 'tele' ? 'Atendimento' : 'Local'}
                </p>
                <p className="mt-2 text-sm font-bold text-gray-900">{location.primary}</p>
                {location.secondary ? (
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{location.secondary}</p>
                ) : null}
              </div>

              {shift.notes ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 p-4 text-xs leading-relaxed text-gray-600">
                  <p className="font-semibold text-gray-800">Observações</p>
                  <p className="mt-1">{shift.notes}</p>
                </div>
              ) : null}
            </aside>

            <div className="space-y-4 p-6 sm:p-8">
              <ProfissionalEscalaRepasseRulesPanel repasseRule={shift.repasseRule} horizontal />

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-gray-200 bg-gray-50/80 px-4 py-4 transition has-[:checked]:border-[var(--brand-primary)] has-[:checked]:bg-orange-50/40">
                <input
                  type="checkbox"
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                />
                <span className="text-sm leading-relaxed text-gray-800">
                  Li e compreendi as regras de repasse, os critérios de presença e sei que o
                  pagamento integral depende do cumprimento de todos os requisitos deste plantão.
                </span>
              </label>

              <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Após confirmar, o plantão entra na sua Agenda. O financeiro audita presença e
                consultas antes de liberar o repasse.
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="hidden text-xs text-gray-500 sm:block">
            Reserva vinculada às regras publicadas neste plantão.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting || !acceptedRules}
              className="btn-brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HandMetal className="h-4 w-4" aria-hidden />
              {isSubmitting ? 'Reservando…' : 'Pegar plantão'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
