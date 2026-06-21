import { AlertTriangle, Ban, CheckCircle2, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'
import { maskCpfForDisplay } from '../../../../utils/lgpdDisplay'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'
import {
  PrefeituraFaturamentoPendenciaActionsMenu,
  type PrefeituraFaturamentoPendenciaMenuAction,
} from './PrefeituraFaturamentoPendenciaActionsMenu'
import {
  formatPendenciaConsultaDate,
  isPendenciaAberta,
  isPendenciaResolvida,
  resolvePendenciaImpactoUi,
  resolvePendenciaSituacaoBadge,
  resolvePendenciaSituacaoHint,
  supportsInlineCnsCorrection,
} from './prefeituraFaturamentoPendenciasUi'

type PrefeituraFaturamentoPendenciaDetailDrawerProps = {
  open: boolean
  closing: boolean
  item: PrefeituraFaturamentoPendencia | null
  actionsMenuOpenId: string | null
  onActionsMenuToggle: (itemId: string) => void
  onActionsMenuClose: () => void
  onMenuAction: (
    item: PrefeituraFaturamentoPendencia,
    action: PrefeituraFaturamentoPendenciaMenuAction,
  ) => void
  onClose: () => void
  onTransitionEnd: () => void
  onSaveCns: (itemId: string, cns: string) => boolean
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-b border-gray-100 py-2.5 text-sm last:border-b-0">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  )
}

export function PrefeituraFaturamentoPendenciaDetailDrawer({
  open,
  closing,
  item,
  actionsMenuOpenId,
  onActionsMenuToggle,
  onActionsMenuClose,
  onMenuAction,
  onClose,
  onTransitionEnd,
  onSaveCns,
}: PrefeituraFaturamentoPendenciaDetailDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [cnsDraft, setCnsDraft] = useState('')
  const [cnsError, setCnsError] = useState<string | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const showCnsField = item ? supportsInlineCnsCorrection(item) : false

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setCnsDraft('')
    setCnsError(null)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
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
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive || !item) return null

  const situacaoBadge = resolvePendenciaSituacaoBadge(item)
  const situacaoHint = resolvePendenciaSituacaoHint(item)
  const impactoUi = resolvePendenciaImpactoUi(item)
  const impactoClassName =
    impactoUi.tone === 'success'
      ? 'border-emerald-100 bg-emerald-50/70'
      : impactoUi.tone === 'warning'
        ? 'border-amber-100 bg-amber-50/70'
        : impactoUi.tone === 'neutral'
          ? 'border-gray-200 bg-gray-50/80'
          : 'border-red-100 bg-red-50/70'
  const impactoIconClassName =
    impactoUi.tone === 'success'
      ? 'text-emerald-600'
      : impactoUi.tone === 'warning'
        ? 'text-amber-600'
        : impactoUi.tone === 'neutral'
          ? 'text-gray-600'
          : 'text-red-600'
  const ImpactoIcon =
    impactoUi.tone === 'success'
      ? CheckCircle2
      : impactoUi.tone === 'neutral'
        ? AlertTriangle
        : impactoUi.tone === 'warning'
          ? AlertTriangle
          : Ban

  function handleSaveCns() {
    const ok = onSaveCns(item!.id, cnsDraft)
    if (!ok) {
      setCnsError('Informe um CNS válido com 15 dígitos.')
      return
    }
    setCnsError(null)
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar detalhes da pendência"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="pendencia-detail-title"
        onTransitionEnd={(event) => {
          if (event.propertyName === 'transform' && closing) onTransitionEnd()
        }}
        className={[
          'absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out',
          panelVisible ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="shrink-0 border-b border-gray-200 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SituationStatusBadge config={situacaoBadge} widthClass="w-[7.75rem]" />
              </div>
              {situacaoHint ? (
                <p className="mt-2 text-xs leading-relaxed text-gray-500">{situacaoHint}</p>
              ) : null}
              <h2 id="pendencia-detail-title" className="mt-3 text-lg font-bold text-gray-900">
                {item.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{item.reason}</p>
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
          <section className={`rounded-2xl border px-4 py-3 ${impactoClassName}`}>
            <div className="flex items-start gap-2">
              <ImpactoIcon className={`mt-0.5 h-4 w-4 shrink-0 ${impactoIconClassName}`} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {impactoUi.title}
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-gray-800">
                  {impactoUi.message}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-bold text-gray-900">Dados da consulta</h3>
            <dl className="mt-2 rounded-2xl border border-gray-200 bg-gray-50/50 px-4">
              <DetailRow label="Paciente" value={item.patientName} />
              <DetailRow
                label="CPF"
                value={item.patientCpf ? maskCpfForDisplay(item.patientCpf) : '—'}
              />
              <DetailRow label="CNS" value={item.patientCns ?? '—'} />
              <DetailRow label="Data" value={formatPendenciaConsultaDate(item.consultaDate)} />
              <DetailRow label="Profissional" value={item.professionalName} />
              <DetailRow label="Especialidade" value={item.specialty} />
              <DetailRow label="Unidade" value={item.unitName} />
              <DetailRow label="CNES" value={item.cnes} />
              <DetailRow label="Consulta" value={item.consultaId} />
              {item.suggestedProcedure ? (
                <DetailRow label="Procedimento" value={item.suggestedProcedure} />
              ) : null}
            </dl>
          </section>

          {isPendenciaAberta(item.status) ? (
            <section className="mt-5">
              <h3 className="text-sm font-bold text-gray-900">Próximo passo</h3>
              <p className="mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
                {item.recommendedAction}
              </p>
            </section>
          ) : isPendenciaResolvida(item.status) ? (
            <section className="mt-5">
              <h3 className="text-sm font-bold text-gray-900">Histórico</h3>
              <p className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-gray-700">
                {item.status === 'validada'
                  ? 'Pendência resolvida. A consulta atende aos requisitos deste item para o fechamento SUS.'
                  : item.status === 'ignorada'
                    ? 'Pendência ignorada com justificativa registrada.'
                    : 'Pendência encerrada sem impedir o fluxo de faturamento.'}
              </p>
            </section>
          ) : null}

          {item.responsibleName ? (
            <section className="mt-5">
              <h3 className="text-sm font-bold text-gray-900">Responsável</h3>
              <p className="mt-2 text-sm text-gray-700">{item.responsibleName}</p>
            </section>
          ) : null}

          {item.ignoreJustification ? (
            <section className="mt-5">
              <h3 className="text-sm font-bold text-gray-900">Justificativa de ignorar</h3>
              <p className="mt-2 text-sm text-gray-700">{item.ignoreJustification}</p>
            </section>
          ) : null}

          {showCnsField ? (
            <section className="mt-5 rounded-2xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-light)]/40 px-4 py-4">
              <h3 className="text-sm font-bold text-gray-900">CNS do paciente</h3>
              <input
                type="text"
                inputMode="numeric"
                value={cnsDraft}
                onChange={(event) => {
                  setCnsDraft(event.target.value.replace(/\D/g, '').slice(0, 15))
                  setCnsError(null)
                }}
                placeholder="000000000000000"
                className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
              />
              {cnsError ? <p className="mt-2 text-xs font-medium text-red-600">{cnsError}</p> : null}
              <button
                type="button"
                onClick={handleSaveCns}
                className="btn-brand-gradient mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              >
                <Save className="h-4 w-4" />
                Salvar correção
              </button>
            </section>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Ações disponíveis</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Corrija, revalide ou registre o andamento desta pendência.
              </p>
            </div>
            <PrefeituraFaturamentoPendenciaActionsMenu
              item={item}
              open={actionsMenuOpenId === item.id}
              align="right"
              onToggle={() => onActionsMenuToggle(item.id)}
              onClose={onActionsMenuClose}
              onAction={(action) => onMenuAction(item, action)}
            />
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
