import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  FileText,
  Scale,
  Stethoscope,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type {
  AdminPlantaoAuditoriaRow,
  PlantaoDecisaoAnalista,
} from '../../../types/adminProfissionalRepasse'
import {
  computePlantaoRepasse,
  computePlantaoValorReferenciaCentavos,
} from '../../../utils/admin/computePlantaoRepasse'
import {
  formatPlantaoAuditoriaDateTime,
  formatPlantaoHorarioRange,
  formatPlantaoNfDiferenca,
  formatPlantaoRepasseContratoCopy,
  formatPlantaoTurnoSubtitle,
} from '../../../utils/admin/formatPlantaoRepasseAuditoria'
import {
  ensureRepasseRule,
  formatCriteriosPresencaResumo,
  normalizeCriteriosPresenca,
  repasseModalidadeLabel,
  tratamentoInelegivelLabel,
} from '../../../utils/adminEscala/repasseRule'
import { Toast } from '../../ui/Toast'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH,
  ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH,
  adminRepasseElegibilidadeBadgeConfig,
  adminRepasseModalidadeBadgeConfig,
  formatAdminRepasseCurrency,
} from './adminProfissionalRepasseUi'

type AdminProfissionalPlantaoAuditoriaDrawerProps = {
  open: boolean
  closing: boolean
  plantao: AdminPlantaoAuditoriaRow | null
  canEdit: boolean
  isSubmitting?: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSubmitDecisao: (payload: {
    plantaoId: string
    decisao: PlantaoDecisaoAnalista
    observacao?: string
  }) => Promise<unknown>
}

const decisaoLabels: Record<PlantaoDecisaoAnalista, string> = {
  aprovado: 'Aprovado',
  aprovado_parcial: 'Aprovado parcial',
  indeferido: 'Indeferido',
}

function AuditoriaSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Stethoscope
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <Icon className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden />
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  )
}

function MetricTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-gray-500">{hint}</p> : null}
    </article>
  )
}

export function AdminProfissionalPlantaoAuditoriaDrawer({
  open,
  closing,
  plantao,
  canEdit,
  isSubmitting = false,
  onClose,
  onTransitionEnd,
  onSubmitDecisao,
}: AdminProfissionalPlantaoAuditoriaDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')
  const [pendingDecisao, setPendingDecisao] = useState<PlantaoDecisaoAnalista | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    let frameId: number | null = null
    if (!open) {
      frameId = requestAnimationFrame(() => {
        setEntered(false)
        setObservacao('')
        setPendingDecisao(null)
      })
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId)
      }
    }
    frameId = requestAnimationFrame(() => setEntered(true))
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [open])

  useEffect(() => {
    if (!plantao) return
    setObservacao(plantao.observacaoAnalista ?? '')
  }, [plantao])

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

  const computed = useMemo(
    () => (plantao ? computePlantaoRepasse(plantao) : null),
    [plantao],
  )

  const rule = useMemo(
    () => (plantao ? ensureRepasseRule(plantao.repasseRule) : null),
    [plantao],
  )

  const criterios = useMemo(
    () => (rule ? normalizeCriteriosPresenca(rule.criteriosPresenca) : null),
    [rule],
  )

  const valorReferenciaCentavos = useMemo(
    () => (plantao ? computePlantaoValorReferenciaCentavos(plantao) : 0),
    [plantao],
  )

  const nfDiff = useMemo(
    () =>
      computed && plantao
        ? formatPlantaoNfDiferenca(computed.valorCalculadoCentavos, plantao.valorDeclaradoCentavos)
        : null,
    [computed, plantao],
  )

  if (!isActive || !plantao || !computed || !rule || !criterios) return null

  const online = plantao.percentualOnline ?? 0
  const onlineMin = criterios.minPercentualOnline
  const onlineBarWidth = plantao.percentualOnline != null ? Math.min(100, online) : 0
  const onlineMinPosition = Math.min(100, onlineMin)

  const decisaoAtual = plantao?.decisaoAnalista ?? null
  const actionsDisabled = !canEdit || isSubmitting || Boolean(pendingDecisao)

  async function handleDecisao(tipo: PlantaoDecisaoAnalista) {
    if (!plantao || actionsDisabled) return

    const observacaoTrimmed = observacao.trim()
    if (tipo === 'indeferido' && observacaoTrimmed.length < 3) {
      setToastVariant('error')
      setToastMessage('Informe o parecer ao indeferir o plantão (mínimo 3 caracteres).')
      return
    }

    setPendingDecisao(tipo)
    await onSubmitDecisao({
      plantaoId: plantao.id,
      decisao: tipo,
      observacao: observacaoTrimmed,
    })
    setPendingDecisao(null)
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-gray-900/40 transition-opacity ${
            panelVisible ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Fechar auditoria do plantão"
          onClick={onClose}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-plantao-auditoria-title"
          data-testid="admin-plantao-auditoria-drawer"
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.propertyName === 'transform') onTransitionEnd()
          }}
          className={`absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-gray-200 bg-slate-50 shadow-[-16px_0_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ${
            panelVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <header className="shrink-0 border-b border-gray-200 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                  Auditoria de plantão
                </p>
                <h2
                  id="admin-plantao-auditoria-title"
                  className="mt-1 text-lg font-bold text-gray-900"
                >
                  {plantao.profissionalNome}
                </h2>
                <p className="mt-1 text-xs capitalize leading-relaxed text-gray-600">
                  {formatPlantaoTurnoSubtitle(plantao)}
                </p>
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

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SituationStatusBadge
                config={adminRepasseModalidadeBadgeConfig[rule.modalidade]}
                widthClass={ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH}
              />
              <SituationStatusBadge
                config={adminRepasseElegibilidadeBadgeConfig[computed.elegibilidade]}
                widthClass={ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH}
              />
            </div>

            <p className="mt-3 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2.5 text-xs leading-relaxed text-gray-700">
              {formatPlantaoRepasseContratoCopy(rule)}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
              {formatCriteriosPresencaResumo(rule.criteriosPresenca)}
            </p>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <AuditoriaSection title="1. Regra contratada" icon={FileText}>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="Modalidade" value={repasseModalidadeLabel(rule.modalidade)} />
                <MetricTile
                  label="Valor plantão"
                  value={
                    rule.modalidade === 'por_consulta'
                      ? '—'
                      : formatAdminRepasseCurrency(rule.valorPlantaoCentavos)
                  }
                />
                <MetricTile
                  label="Valor / consulta"
                  value={
                    rule.valorConsultaCentavos > 0
                      ? formatAdminRepasseCurrency(rule.valorConsultaCentavos)
                      : '—'
                  }
                />
                {rule.modalidade === 'hibrido' ? (
                  <MetricTile
                    label="Parte fixa híbrida"
                    value={`${rule.percentualFixoHibrido ?? 30}%`}
                  />
                ) : null}
                <MetricTile label="Mín. online" value={`${criterios.minPercentualOnline}%`} />
                <MetricTile
                  label="Sem demanda"
                  value={criterios.aceitaSemDemandaComprovada ? 'Aceita' : 'Não aceita'}
                />
                <MetricTile
                  label="Mín. consultas"
                  value={String(criterios.minConsultasConcluidas)}
                />
                <MetricTile
                  label="Se inelegível"
                  value={tratamentoInelegivelLabel(criterios.tratamentoInelegivel)}
                />
              </div>
            </AuditoriaSection>

            <AuditoriaSection title="2. Presença" icon={Clock3}>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile
                  label="Previsto"
                  value={formatPlantaoHorarioRange(
                    plantao.horarioPrevistoInicio,
                    plantao.horarioPrevistoFim,
                  )}
                />
                <MetricTile
                  label="Entrada real"
                  value={formatPlantaoAuditoriaDateTime(plantao.enteredAt)}
                />
                <MetricTile
                  label="Saída real"
                  value={formatPlantaoAuditoriaDateTime(plantao.endedAt)}
                />
                <MetricTile
                  label="Encerramento formal"
                  value={plantao.encerramentoFormal ? 'Sim' : 'Não'}
                  hint={
                    criterios.exigeEncerramentoFormal ? 'Exigido pela regra' : 'Não exigido'
                  }
                />
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">Percentual online</span>
                  <span className="tabular-nums text-gray-600">
                    {plantao.percentualOnline != null ? `${online}%` : '—'} / mín. {onlineMin}%
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={[
                      'absolute inset-y-0 left-0 rounded-full transition-all',
                      online >= onlineMin
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : online >= 50
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                          : 'bg-gradient-to-r from-rose-400 to-red-500',
                    ].join(' ')}
                    style={{ width: `${onlineBarWidth}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-0.5 bg-gray-900/40"
                    style={{ left: `${onlineMinPosition}%` }}
                    title={`Mínimo ${onlineMin}%`}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Barra vertical = mínimo exigido pelo slot ({onlineMin}%).
                </p>
              </div>
            </AuditoriaSection>

            <AuditoriaSection title="3. Demanda" icon={Users}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <MetricTile label="Agendados" value={String(plantao.consultasAgendadas)} />
                <MetricTile label="Encaixes" value={String(plantao.encaixes)} />
                <MetricTile label="Atendidos" value={String(plantao.atendidos)} />
                <MetricTile label="No-show" value={String(plantao.naoCompareceu)} />
                <MetricTile label="Desistiu" value={String(plantao.desistiu)} />
              </div>
            </AuditoriaSection>

            <AuditoriaSection title="4. Financeiro" icon={DollarSign}>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile
                  label="Valor contratado (referência)"
                  value={formatAdminRepasseCurrency(valorReferenciaCentavos)}
                  hint="Se todos os critérios integrais forem cumpridos"
                />
                <MetricTile
                  label="Valor calculado"
                  value={formatAdminRepasseCurrency(computed.valorCalculadoCentavos)}
                  hint="computePlantaoRepasse"
                />
                <MetricTile
                  label="Valor NF"
                  value={
                    plantao.valorDeclaradoCentavos != null
                      ? formatAdminRepasseCurrency(plantao.valorDeclaradoCentavos)
                      : '—'
                  }
                />
                <MetricTile
                  label="Diferença NF × calculado"
                  value={nfDiff?.label ?? '—'}
                  hint={nfDiff?.divergente ? 'Divergência relevante' : undefined}
                />
              </div>
              {nfDiff?.divergente ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Valor declarado na NF difere do calculado pela regra do slot.
                </p>
              ) : null}
            </AuditoriaSection>

            <AuditoriaSection title="5. Alertas e motivos" icon={AlertTriangle}>
              {computed.alertas.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  Nenhum alerta automático para este plantão.
                </p>
              ) : (
                <ul className="space-y-2">
                  {computed.alertas.map((alerta) => (
                    <li
                      key={alerta}
                      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                    >
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      {alerta}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Motivos da elegibilidade
                </p>
                <ul className="mt-2 space-y-1.5">
                  {computed.motivos.map((motivo) => (
                    <li key={motivo} className="flex items-start gap-2 text-xs text-gray-700">
                      <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                      {motivo}
                    </li>
                  ))}
                </ul>
              </div>
            </AuditoriaSection>

            <AuditoriaSection title="6. Decisão do analista" icon={ClipboardList}>
              <label className="block">
                <span className="text-xs font-semibold text-gray-700">Observação</span>
                <textarea
                  value={observacao}
                  onChange={(event) => setObservacao(event.target.value)}
                  rows={3}
                  disabled={!canEdit || isSubmitting}
                  placeholder="Registre o parecer da conferência"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[var(--brand-primary)]/40 focus:ring-2 focus:ring-[var(--brand-primary)]/15 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </label>

              {decisaoAtual ? (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                  Decisão registrada: {decisaoLabels[decisaoAtual]}
                  {plantao.decididoEm
                    ? ` · ${formatPlantaoAuditoriaDateTime(plantao.decididoEm)}`
                    : ''}
                </p>
              ) : null}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => void handleDecisao('aprovado')}
                  disabled={actionsDisabled}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {pendingDecisao === 'aprovado' ? 'Salvando…' : 'Aprovar'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDecisao('aprovado_parcial')}
                  disabled={actionsDisabled}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  {pendingDecisao === 'aprovado_parcial' ? 'Salvando…' : 'Aprovar parcial'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDecisao('indeferido')}
                  disabled={actionsDisabled}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <XCircle className="h-4 w-4" aria-hidden />
                  {pendingDecisao === 'indeferido' ? 'Salvando…' : 'Indeferir'}
                </button>
              </div>
              {!canEdit ? (
                <p className="mt-3 text-xs text-gray-500">
                  Competência já aprovada ou sem permissão para alterar decisões.
                </p>
              ) : null}
            </AuditoriaSection>
          </div>

          <footer className="flex shrink-0 justify-end border-t border-gray-200 bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </button>
          </footer>
        </aside>
      </div>

      <Toast
        message={toastMessage ?? ''}
        visible={Boolean(toastMessage)}
        variant={toastVariant}
        onClose={() => setToastMessage(null)}
      />
    </>,
    document.body,
  )
}
