import type { ReactNode } from 'react'
import { CalendarClock, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminEscalaShift } from '../../../types/adminEscala'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import {
  buildAdminEscalaFillStatusBadge,
  buildAdminEscalaStatusBadge,
  formatAdminEscalaModality,
  formatAdminEscalaPeriod,
  formatAdminEscalaScopeSummary,
  getAdminEscalaDoctorLabel,
} from './adminEscalaUi'
import { AdminEscalaRepasseBadge } from './AdminEscalaRepasseBadge'
import {
  formatCriteriosPresencaResumo,
  formatRepasseRuleSummary,
} from '../../../utils/adminEscala/repasseRule'

type AdminEscalaShiftViewDrawerProps = {
  open: boolean
  closing: boolean
  shift: AdminEscalaShift | null
  onClose: () => void
  onTransitionEnd: () => void
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 text-sm text-gray-900">{children}</div>
    </div>
  )
}

export function AdminEscalaShiftViewDrawer({
  open,
  closing,
  shift,
  onClose,
  onTransitionEnd,
}: AdminEscalaShiftViewDrawerProps) {
  const [entered, setEntered] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive || !shift) return null

  const statusBadge = buildAdminEscalaStatusBadge(shift.status)
  const fillBadge = buildAdminEscalaFillStatusBadge(shift)
  const modeLabel = shift.assignmentMode === 'open' ? 'Aberto (marketplace)' : 'Médico definido'

  return createPortal(
    <div
      className={`fixed inset-0 z-[9996] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar visualização"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-escala-shift-view-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
          panelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm">
                <CalendarClock className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2 id="admin-escala-shift-view-title" className="text-lg font-bold text-gray-900">
                  {shift.specialty}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">{shift.unitName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <span
              className={[
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
                statusBadge.className,
              ].join(' ')}
            >
              {statusBadge.label}
            </span>
            <span
              className={[
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
                fillBadge.className,
              ].join(' ')}
            >
              {fillBadge.label}
            </span>
          </div>

          <DetailField label="Período">{formatAdminEscalaPeriod(shift.startAt, shift.endAt)}</DetailField>
          <DetailField label="Modalidade">{formatAdminEscalaModality(shift.modality)}</DetailField>
          <DetailField label="Modo">{modeLabel}</DetailField>
          <DetailField label="Valor">{formatProfissionalCurrency(shift.amountCents)}</DetailField>
          <DetailField label="Repasse">
            <AdminEscalaRepasseBadge
              repasseRule={shift.repasseRule}
              amountCents={shift.amountCents}
              size="md"
            />
            <p className="mt-2 text-xs font-medium text-gray-700">
              {formatRepasseRuleSummary(shift.repasseRule)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {formatCriteriosPresencaResumo(shift.repasseRule.criteriosPresenca)}
            </p>
          </DetailField>
          <DetailField label="Escopo">{formatAdminEscalaScopeSummary(shift)}</DetailField>

          {shift.assignmentMode === 'assigned' ? (
            <>
              <DetailField label="Médico titular">
                {shift.primaryDoctorId
                  ? getAdminEscalaDoctorLabel(shift.primaryDoctorId)
                  : 'Não definido'}
              </DetailField>
              <DetailField label="Fila de reserva">
                {shift.backupDoctorIds.length > 0
                  ? shift.backupDoctorIds.map((id) => getAdminEscalaDoctorLabel(id)).join(' · ')
                  : 'Nenhum substituto'}
              </DetailField>
            </>
          ) : (
            <DetailField label="Vagas">
              {shift.vacancies} disponíveis de {shift.totalVacancies}
              {shift.claimedCaptures.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {shift.claimedCaptures.map((capture) => (
                    <li key={`${capture.doctorId}-${capture.claimedAt}`}>
                      {capture.doctorName}
                    </li>
                  ))}
                </ul>
              ) : null}
            </DetailField>
          )}

          {shift.fullAddress ? (
            <DetailField label="Endereço">
              <p>{shift.unitName}</p>
              <p className="mt-0.5 text-xs text-gray-600">{shift.fullAddress}</p>
            </DetailField>
          ) : null}

          {shift.notes ? <DetailField label="Observações">{shift.notes}</DetailField> : null}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
