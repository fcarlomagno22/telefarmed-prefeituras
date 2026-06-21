import { CircleCheck, CircleX, Loader2, ShieldAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraFaturamentoReavaliacaoResult } from '../../../../hooks/usePrefeituraFaturamentoPendenciasPage'
import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'
import type {
  PrefeituraFaturamentoRegraSusCheckId,
  PrefeituraFaturamentoRegraSusCheckStatus,
} from '../../../../types/prefeituraFaturamentoRegraSus'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'
import {
  buildPrefeituraRegraSusChecklist,
  formatRegraSusCompetenciaLabel,
} from './buildPrefeituraRegraSusChecklist'
import {
  formatPendenciaConsultaDate,
  resolvePendenciaSituacaoBadge,
  resolvePendenciaSituacaoHint,
} from './prefeituraFaturamentoPendenciasUi'
import { PrefeituraFaturamentoReavaliacaoLottie } from './PrefeituraFaturamentoReavaliacaoLottie'

type ReavaliacaoPhase = 'idle' | 'reavaliando' | 'sucesso' | 'erro'

type PrefeituraFaturamentoRegraSusDrawerProps = {
  open: boolean
  closing: boolean
  item: PrefeituraFaturamentoPendencia | null
  stacked?: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onCorrigir?: (item: PrefeituraFaturamentoPendencia, checkId: PrefeituraFaturamentoRegraSusCheckId) => void
  onRevalidar?: (item: PrefeituraFaturamentoPendencia) => Promise<PrefeituraFaturamentoReavaliacaoResult>
}

function checkStatusLabelClass(status: PrefeituraFaturamentoRegraSusCheckStatus) {
  if (status === 'ok') return 'text-emerald-700'
  if (status === 'warning') return 'text-amber-700'
  return 'text-red-700'
}

function SectionProgress({
  passed,
  total,
}: {
  passed: number
  total: number
}) {
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${
            percent === 100 ? 'bg-emerald-500' : percent >= 70 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-semibold text-gray-500">
        {passed}/{total}
      </span>
    </div>
  )
}

export function PrefeituraFaturamentoRegraSusDrawer({
  open,
  closing,
  item,
  stacked = false,
  onClose,
  onTransitionEnd,
  onCorrigir,
  onRevalidar,
}: PrefeituraFaturamentoRegraSusDrawerProps) {
  const closeTimeoutRef = useRef<number | null>(null)
  const successCloseTimeoutRef = useRef<number | null>(null)
  const [reavaliacaoPhase, setReavaliacaoPhase] = useState<ReavaliacaoPhase>('idle')
  const [reavaliacaoMessage, setReavaliacaoMessage] = useState<string | null>(null)
  const [reavaliacaoError, setReavaliacaoError] = useState<string | null>(null)

  const isActive = open || closing
  const panelVisible = open && !closing
  const isReavaliacaoFlow = reavaliacaoPhase !== 'idle'
  const checklist = item ? buildPrefeituraRegraSusChecklist(item) : null

  useEffect(() => {
    if (!open) {
      setReavaliacaoPhase('idle')
      setReavaliacaoMessage(null)
      setReavaliacaoError(null)
    }
  }, [open, item?.id])

  useEffect(() => {
    if (closeTimeoutRef.current != null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (successCloseTimeoutRef.current != null) {
      window.clearTimeout(successCloseTimeoutRef.current)
      successCloseTimeoutRef.current = null
    }
  }, [open, item?.id])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && reavaliacaoPhase !== 'reavaliando') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose, reavaliacaoPhase])

  async function handleReavaliar() {
    if (!item || !onRevalidar || reavaliacaoPhase === 'reavaliando') return

    setReavaliacaoPhase('reavaliando')
    setReavaliacaoMessage(null)
    setReavaliacaoError(null)

    try {
      const result = await onRevalidar(item)

      if (result.ok) {
        setReavaliacaoMessage(
          result.message ??
            'Elegibilidade confirmada. A consulta está apta para seguir no fechamento SUS desta competência.',
        )
        setReavaliacaoPhase('sucesso')
        successCloseTimeoutRef.current = window.setTimeout(() => onClose(), 2600)
        return
      }

      setReavaliacaoError(
        result.errorReason ??
          'A consulta ainda não atende aos requisitos de faturamento SUS.',
      )
      setReavaliacaoPhase('erro')
    } catch {
      setReavaliacaoError('Não foi possível concluir a reavaliação. Tente novamente.')
      setReavaliacaoPhase('erro')
    }
  }

  function handleDismissReavaliacaoError() {
    setReavaliacaoPhase('idle')
    setReavaliacaoError(null)
  }

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

  if (!isActive || !item || !checklist) return null

  const situacaoBadge = resolvePendenciaSituacaoBadge(item)
  const situacaoHint = resolvePendenciaSituacaoHint(item)

  return createPortal(
    <div
      className={`fixed inset-0 z-[10000] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
          stacked ? 'bg-gray-900/25' : 'bg-gray-900/40'
        } ${panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-label="Fechar revisão de regra SUS"
        onClick={() => {
          if (reavaliacaoPhase !== 'reavaliando') onClose()
        }}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={isReavaliacaoFlow ? undefined : 'regra-sus-title'}
        aria-live={isReavaliacaoFlow ? 'polite' : undefined}
        onTransitionEnd={(event) => {
          if (event.propertyName === 'transform' && closing) onTransitionEnd()
        }}
        className={[
          'absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-[-12px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out',
          panelVisible ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {isReavaliacaoFlow ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10 text-center">
            {reavaliacaoPhase === 'reavaliando' ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
                <p className="mt-5 text-base font-bold text-gray-900">Reavaliando elegibilidade</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
                  Conferindo regras SUS/SIGTAP da teleconsulta antes do fechamento da competência.
                </p>
              </>
            ) : null}

            {reavaliacaoPhase === 'sucesso' ? (
              <>
                <PrefeituraFaturamentoReavaliacaoLottie variant="success" />
                <p className="mt-2 text-base font-bold text-emerald-700">Elegibilidade confirmada</p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-700">
                  {reavaliacaoMessage}
                </p>
              </>
            ) : null}

            {reavaliacaoPhase === 'erro' ? (
              <>
                <PrefeituraFaturamentoReavaliacaoLottie variant="error" />
                <p className="mt-2 text-base font-bold text-red-700">Elegibilidade não confirmada</p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-700">
                  {reavaliacaoError}
                </p>
                <button
                  type="button"
                  onClick={handleDismissReavaliacaoError}
                  className="mt-6 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Voltar ao checklist
                </button>
              </>
            ) : null}
          </div>
        ) : (
          <>
            <header className="shrink-0 border-b border-gray-200 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Regra SUS
                    </span>
                    <SituationStatusBadge config={situacaoBadge} widthClass="w-[7.75rem]" />
                  </div>
                  {situacaoHint ? (
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">{situacaoHint}</p>
                  ) : null}
                  <h2 id="regra-sus-title" className="mt-3 text-lg font-bold text-gray-900">
                    Revisar
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Checklist conforme regras de faturamento SUS/SIGTAP para teleconsulta.
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.patientName} · {item.consultaId} ·{' '}
                    {formatPendenciaConsultaDate(item.consultaDate)}
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
                  checklist.faturavel
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-red-200 bg-red-50/60',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  {checklist.faturavel ? (
                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {checklist.faturavel
                        ? 'Consulta apta para faturamento SUS'
                        : 'Consulta com pendências para faturamento SUS'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">
                      {checklist.passedChecks} de {checklist.totalChecks} requisitos atendidos
                      {checklist.failedChecks > 0
                        ? ` · ${checklist.failedChecks} impeditiva(s)`
                        : ''}
                      {checklist.warningChecks > 0 ? ` · ${checklist.warningChecks} aviso(s)` : ''}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Competência {formatRegraSusCompetenciaLabel(item.competencia)}
                      {item.suggestedProcedure ? ` · SIGTAP ${item.suggestedProcedure}` : ''}
                      {item.cnes ? ` · CNES ${item.cnes}` : ''}
                    </p>
                  </div>
                </div>
              </section>

              <div className="mt-5 space-y-5">
                {checklist.sections.map((section) => {
                  const passed = section.items.filter((check) => check.status === 'ok').length

                  return (
                    <section
                      key={section.id}
                      className="rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >
                      <div className="border-b border-gray-100 px-4 py-3">
                        <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
                        <SectionProgress passed={passed} total={section.items.length} />
                      </div>

                      <ul className="divide-y divide-gray-100 px-4">
                        {section.items.map((check) => (
                          <li key={check.id} className="py-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 flex-1 text-sm font-medium text-gray-900">
                                {check.label}
                              </p>
                              <span
                                className={[
                                  'shrink-0 text-xs font-semibold',
                                  checkStatusLabelClass(check.status),
                                ].join(' ')}
                              >
                                {check.statusLabel}
                              </span>
                            </div>
                            <p
                              className={[
                                'mt-1 text-xs leading-relaxed',
                                check.status === 'ok' ? 'text-gray-500' : 'text-gray-600',
                              ].join(' ')}
                            >
                              {check.fieldValue}
                            </p>
                            {check.detail && check.status !== 'ok' ? (
                              <div className="mt-1 flex items-start justify-between gap-3">
                                <p className="min-w-0 flex-1 text-xs leading-relaxed text-red-600">
                                  {check.detail}
                                </p>
                                {check.canCorrect && onCorrigir ? (
                                  <button
                                    type="button"
                                    onClick={() => onCorrigir(item, check.id)}
                                    className="shrink-0 text-xs font-semibold text-[var(--brand-primary)] underline-offset-2 transition hover:underline"
                                  >
                                    Corrigir
                                  </button>
                                ) : null}
                              </div>
                            ) : check.canCorrect && onCorrigir ? (
                              <div className="mt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => onCorrigir(item, check.id)}
                                  className="text-xs font-semibold text-[var(--brand-primary)] underline-offset-2 transition hover:underline"
                                >
                                  Corrigir
                                </button>
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )
                })}
              </div>
            </div>

            <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Fechar
                </button>
                {onRevalidar ? (
                  <button
                    type="button"
                    onClick={handleReavaliar}
                    className="btn-brand-gradient rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    Reavaliar
                  </button>
                ) : null}
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>,
    document.body,
  )
}
