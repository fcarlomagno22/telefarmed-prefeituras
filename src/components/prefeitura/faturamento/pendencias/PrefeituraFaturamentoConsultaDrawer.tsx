import { CircleCheck, CircleX, Eye, Info, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'
import {
  buildPrefeituraFaturamentoConsultaView,
  PACIENTE_CNS_NAO_INFORMADO_TOOLTIP,
  type PrefeituraFaturamentoConsultaViewRow,
} from './prefeituraFaturamentoConsultaView'
import {
  formatPendenciaConsultaDate,
  resolvePendenciaSituacaoBadge,
  resolvePendenciaSituacaoHint,
} from './prefeituraFaturamentoPendenciasUi'

type PrefeituraFaturamentoConsultaDrawerProps = {
  open: boolean
  closing: boolean
  item: PrefeituraFaturamentoPendencia | null
  onClose: () => void
  onTransitionEnd: () => void
}

function CnsOptionalInfoTooltip() {
  const tooltipId = useId()

  return (
    <div className="group/cns-info relative shrink-0">
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
        aria-label="Por que o CNS pode não ser obrigatório"
        aria-describedby={tooltipId}
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 w-[17.5rem] rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-left text-[11px] leading-relaxed text-white opacity-0 shadow-lg group-hover/cns-info:opacity-100 group-focus-within/cns-info:opacity-100"
      >
        <p>{PACIENTE_CNS_NAO_INFORMADO_TOOLTIP.portaria}</p>
        <p className="mt-2">{PACIENTE_CNS_NAO_INFORMADO_TOOLTIP.siaSus}</p>
      </div>
    </div>
  )
}

function ViewRow({ label, value, highlight, showCnsOptionalInfo }: PrefeituraFaturamentoConsultaViewRow) {
  const valueClass =
    highlight === 'fail'
      ? 'text-red-700'
      : highlight === 'warn'
        ? 'text-amber-700'
        : highlight === 'ok'
          ? 'text-gray-900'
          : 'text-gray-900'

  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 border-b border-gray-100 py-2.5 text-sm last:border-b-0">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className={`flex items-start justify-between gap-2 font-medium leading-relaxed ${valueClass}`}>
        <span className="min-w-0">{value}</span>
        {showCnsOptionalInfo ? <CnsOptionalInfoTooltip /> : null}
      </dd>
    </div>
  )
}

export function PrefeituraFaturamentoConsultaDrawer({
  open,
  closing,
  item,
  onClose,
  onTransitionEnd,
}: PrefeituraFaturamentoConsultaDrawerProps) {
  const closeTimeoutRef = useRef<number | null>(null)

  const isActive = open || closing
  const panelVisible = open && !closing
  const view = item ? buildPrefeituraFaturamentoConsultaView(item) : null

  useEffect(() => {
    if (closeTimeoutRef.current != null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [open, item?.id])

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
    closeTimeoutRef.current = window.setTimeout(() => onTransitionEnd(), 350)
    return () => {
      if (closeTimeoutRef.current != null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [closing, onTransitionEnd])

  if (!isActive || !item || !view) return null

  const situacaoBadge = resolvePendenciaSituacaoBadge(item)
  const situacaoHint = resolvePendenciaSituacaoHint(item)

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar consulta"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="consulta-drawer-title"
        onTransitionEnd={(event) => {
          if (event.propertyName === 'transform' && closing) onTransitionEnd()
        }}
        className={[
          'absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out',
          panelVisible ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="shrink-0 border-b border-gray-200 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700">
                  <Eye className="h-3.5 w-3.5" />
                  Ver consulta
                </span>
                <SituationStatusBadge config={situacaoBadge} widthClass="w-[7.75rem]" />
              </div>
              {situacaoHint ? (
                <p className="mt-2 text-xs leading-relaxed text-gray-500">{situacaoHint}</p>
              ) : null}
              <h2 id="consulta-drawer-title" className="mt-3 text-lg font-bold text-gray-900">
                {item.consultaId}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {item.patientName} · {item.professionalName}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {formatPendenciaConsultaDate(item.consultaDate)} · {item.unitName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <section
            className={[
              'rounded-2xl border px-4 py-4',
              view.faturavel
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-red-200 bg-red-50/60',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              {view.faturavel ? (
                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">
                  {view.faturavel
                    ? 'Consulta elegível para faturamento SUS'
                    : 'Consulta não elegível para faturamento SUS'}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">
                  {view.passedChecks} de {view.totalChecks} requisitos atendidos
                  {view.failedChecks > 0 ? ` · ${view.failedChecks} impeditiva(s)` : ''}
                  {view.warningChecks > 0 ? ` · ${view.warningChecks} aviso(s)` : ''}
                </p>
                {!view.faturavel && view.blockers.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed text-red-800">
                    {view.blockers.map((blocker) => (
                      <li key={blocker}>· {blocker}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </section>

          <div className="mt-5 space-y-5">
            {view.sections.map((section) => (
              <section
                key={section.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
                </div>
                <dl className="px-4">{section.rows.map((row) => (
                  <ViewRow key={`${section.id}-${row.label}`} {...row} />
                ))}</dl>
              </section>
            ))}
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
