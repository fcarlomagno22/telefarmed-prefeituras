import {
  AlertTriangle,
  Ban,
  CircleCheck,
  CircleX,
  FileDown,
  Info,
  Loader2,
  Lock,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { usePrefeituraFaturamentoFechamentoPage } from '../../../../hooks/usePrefeituraFaturamentoFechamentoPage'
import type { PrefeituraFaturamentoFechamentoLoteItem } from '../../../../types/prefeituraFaturamentoFechamento'
import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'
import { CustomSelect } from '../../../ui/CustomSelect'
import { KpiStatCards, type KpiStatCardItem } from '../../../ui/KpiStatCards'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'
import { Toast, type ToastVariant } from '../../../ui/Toast'
import { PrefeituraFaturamentoConsultaDrawer } from '../pendencias/PrefeituraFaturamentoConsultaDrawer'
import { formatPendenciaConsultaDate } from '../pendencias/prefeituraFaturamentoPendenciasUi'
import { PrefeituraFaturamentoReavaliacaoLottie } from '../pendencias/PrefeituraFaturamentoReavaliacaoLottie'
import { PrefeituraFaturamentoFechamentoConfirmModal } from './PrefeituraFaturamentoFechamentoConfirmModal'
import { PrefeituraFaturamentoFechamentoExcludeModal } from './PrefeituraFaturamentoFechamentoExcludeModal'
import {
  PrefeituraFaturamentoFechamentoLoteActionsMenu,
  type PrefeituraFaturamentoFechamentoLoteMenuAction,
} from './PrefeituraFaturamentoFechamentoLoteActionsMenu'
import { PrefeituraFaturamentoFechamentoLoteTable } from './PrefeituraFaturamentoFechamentoLoteTable'
import {
  formatFechamentoDateTime,
  prefeituraFaturamentoFechamentoStatusBadgeConfig,
} from './prefeituraFaturamentoFechamentoUi'

type PrefeituraFaturamentoFechamentoPanelProps = {
  onGoToPendencias?: () => void
}

type ClosePhase = 'idle' | 'closing' | 'success' | 'error'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function buildKpiCards(
  summary: ReturnType<typeof usePrefeituraFaturamentoFechamentoPage>['summary'],
  isClosed: boolean,
): KpiStatCardItem[] {
  return [
    {
      label: 'Consultas realizadas',
      value: formatNumber(summary.realizadas),
      suffix: summary.competenciaLabel,
      icon: Stethoscope,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Elegíveis no lote',
      value: formatNumber(summary.noLote),
      suffix: isClosed ? 'Consolidadas no fechamento' : `${formatNumber(summary.elegiveis)} pré-selecionadas`,
      icon: ShieldCheck,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Bloqueantes abertas',
      value: formatNumber(summary.bloqueantes),
      suffix: isClosed ? 'Registradas no histórico' : 'Impedem fechar',
      icon: Ban,
      iconGradient: 'from-rose-500 via-red-500 to-red-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
      iconRing: 'ring-red-100/80',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Ignoradas / não faturáveis',
      value: formatNumber(summary.ignoradas),
      suffix: 'Fora do lote',
      icon: AlertTriangle,
      iconGradient: 'from-amber-500 via-yellow-500 to-orange-500',
      iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
      iconRing: 'ring-amber-100/80',
      topBar: 'from-amber-400 to-yellow-500',
    },
  ]
}

function GateItem({
  label,
  detail,
  ok,
}: {
  label: string
  detail: string
  ok: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {ok ? (
        <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      ) : (
        <CircleX className="h-3.5 w-3.5 shrink-0 text-red-600" />
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-gray-900">{label}</p>
        {!ok ? <p className="truncate text-[11px] text-gray-600">{detail}</p> : null}
      </div>
    </div>
  )
}

export function PrefeituraFaturamentoFechamentoPanel({
  onGoToPendencias,
}: PrefeituraFaturamentoFechamentoPanelProps) {
  const page = usePrefeituraFaturamentoFechamentoPage()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [closePhase, setClosePhase] = useState<ClosePhase>('idle')
  const [closeMessage, setCloseMessage] = useState<string | null>(null)
  const [closeError, setCloseError] = useState<string | null>(null)
  const [excludeItem, setExcludeItem] = useState<PrefeituraFaturamentoFechamentoLoteItem | null>(
    null,
  )
  const [consultaItem, setConsultaItem] = useState<PrefeituraFaturamentoPendencia | null>(null)
  const [consultaClosing, setConsultaClosing] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const kpiCards = useMemo(
    () => buildKpiCards(page.summary, page.isClosed),
    [page.isClosed, page.summary],
  )
  const statusBadge = prefeituraFaturamentoFechamentoStatusBadgeConfig[page.operationalStatus]
  const gateOk = page.gateItems.every((item) => item.ok)
  const showViewModeSelector = page.viewModes.length > 1
  const closeActionLabel = page.isComplementMode ? 'Fechar complemento' : 'Fechar competência'
  const closedTitle = page.isComplementMode ? 'Complemento fechado' : 'Competência fechada'
  const closingTitle = page.isComplementMode ? 'Fechando complemento' : 'Fechando competência'

  const openConsultaFromLote = useCallback((loteItem: PrefeituraFaturamentoFechamentoLoteItem) => {
    const pendencia = {
      id: loteItem.id,
      competencia: loteItem.competencia,
      category: 'consulta',
      gravidade: loteItem.faturavel ? 'aviso' : 'bloqueante',
      status: loteItem.faturavel ? 'validada' : 'aberta',
      kind: loteItem.faturavel ? 'consulta_elegivel' : 'consulta_nao_finalizada',
      title: loteItem.faturavel ? 'Consulta elegível' : 'Consulta com pendências',
      patientName: loteItem.patientName,
      patientCpf: loteItem.patientCpf,
      patientCns: loteItem.patientCns,
      patientMunicipality: loteItem.patientMunicipality,
      patientMunicipalityIbge: loteItem.patientMunicipalityIbge,
      professionalCbo: loteItem.professionalCbo,
      professionalCboLabel: loteItem.professionalCboLabel,
      procedureCompatibleWithCbo: loteItem.procedureCompatibleWithCbo,
      professionalConselho: loteItem.professionalConselho,
      consultaId: loteItem.consultaId,
      consultaDate: loteItem.consultaDate,
      consultaStartedAt: loteItem.consultaStartedAt,
      consultaEndedAt: loteItem.consultaEndedAt,
      consultaEncerrada: loteItem.consultaEncerrada,
      professionalName: loteItem.professionalName,
      specialty: loteItem.specialty,
      unitId: loteItem.unitId,
      unitName: loteItem.unitName,
      cnes: loteItem.cnes,
      suggestedProcedure: loteItem.procedureCode,
      suggestedProcedureName: loteItem.procedureName,
      clinicalCid: loteItem.clinicalCid,
      reason: loteItem.faturavel
        ? 'Consulta elegível para o fechamento SUS.'
        : 'Consulta com pendências registradas na validação SUS.',
      impact: loteItem.faturavel
        ? 'Incluída no lote da competência.'
        : 'Revise os dados antes de fechar a competência.',
      recommendedAction: 'Conferir dados antes de fechar.',
      primaryAction: 'revisar_regra_sus',
      responsibleName: null,
      ignoreJustification: null,
      correctedAt: null,
    } satisfies PrefeituraFaturamentoPendencia

    setConsultaClosing(false)
    setConsultaItem(pendencia)
  }, [])

  const handleConfirmClose = useCallback(async () => {
    setClosePhase('closing')
    setCloseMessage(null)
    setCloseError(null)

    try {
      const result = await page.fecharCompetencia()

      if (result.ok) {
        setCloseMessage(result.message ?? 'Competência fechada com sucesso.')
        setClosePhase('success')
        setConfirmOpen(false)
        showToast(result.message ?? 'Competência fechada com sucesso.')
        window.setTimeout(() => setClosePhase('idle'), 2600)
        return
      }

      setCloseError(result.errorReason ?? 'Não foi possível fechar a competência.')
      setClosePhase('error')
      setConfirmOpen(false)
    } catch {
      setCloseError('Não foi possível concluir o fechamento. Tente novamente.')
      setClosePhase('error')
      setConfirmOpen(false)
    }
  }, [page, showToast])

  const handleRevalidarCompetencia = useCallback(async () => {
    if (isRevalidating) return

    setIsRevalidating(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 1200))
      page.revalidarCompetencia()
      showToast('Competência revalidada.')
    } finally {
      setIsRevalidating(false)
    }
  }, [isRevalidating, page, showToast])

  const handleLoteMenuAction = useCallback(
    (item: PrefeituraFaturamentoFechamentoLoteItem, action: PrefeituraFaturamentoFechamentoLoteMenuAction) => {
      if (action === 'view_consulta') {
        openConsultaFromLote(item)
        return
      }
      if (action === 'exclude') {
        setExcludeItem(item)
        return
      }
      if (action === 'restore') {
        page.restoreToLote(item.id)
        showToast('Consulta restaurada no lote.')
      }
    },
    [openConsultaFromLote, page, showToast],
  )

  const renderLoteActionsMenu = useCallback(
    (item: PrefeituraFaturamentoFechamentoLoteItem, align: 'left' | 'center' | 'right' = 'center') => (
      <PrefeituraFaturamentoFechamentoLoteActionsMenu
        item={item}
        isClosed={page.isClosed}
        open={openMenuId === item.id}
        align={align}
        onToggle={() => setOpenMenuId((current) => (current === item.id ? null : item.id))}
        onClose={() => setOpenMenuId(null)}
        onAction={(action) => handleLoteMenuAction(item, action)}
      />
    ),
    [handleLoteMenuAction, openMenuId, page.isClosed],
  )

  if (closePhase === 'closing' || closePhase === 'success' || closePhase === 'error') {
    return (
      <>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10 text-center">
          {closePhase === 'closing' ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-primary)]" />
              <p className="mt-5 text-base font-bold text-gray-900">{closingTitle}</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
                Consolidando o lote SUS/SIGTAP de teleconsultas para {page.summary.competenciaLabel}
                {page.isComplementMode ? ' (complemento).' : '.'}
              </p>
            </>
          ) : null}

          {closePhase === 'success' ? (
            <>
              <PrefeituraFaturamentoReavaliacaoLottie variant="success" />
              <p className="mt-2 text-base font-bold text-emerald-700">{closedTitle}</p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-700">{closeMessage}</p>
              {page.currentRecord.fechamentoId ? (
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  ID {page.currentRecord.fechamentoId}
                </p>
              ) : null}
            </>
          ) : null}

          {closePhase === 'error' ? (
            <>
              <PrefeituraFaturamentoReavaliacaoLottie variant="error" />
              <p className="mt-2 text-base font-bold text-red-700">Fechamento não concluído</p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-700">{closeError}</p>
              <button
                type="button"
                onClick={() => setClosePhase('idle')}
                className="mt-6 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Voltar ao fechamento
              </button>
            </>
          ) : null}
        </div>
        <Toast
          message={toast?.message ?? ''}
          visible={toast !== null}
          variant={toast?.variant ?? 'success'}
          onClose={dismissToast}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={[
            'shrink-0 border-b border-gray-200 px-5 py-4 sm:px-6',
            page.isClosed ? 'bg-sky-50/80' : 'bg-sky-50/60',
          ].join(' ')}
        >
          <p className="text-sm font-medium leading-relaxed text-sky-950">
            {page.isClosed
              ? page.isComplementMode
                ? 'Complemento fechado. Exporte o BPA ou baixe o relatório deste envio adicional.'
                : 'Competência fechada. O lote SUS está consolidado — exporte o BPA ou baixe o relatório de auditoria.'
              : page.isComplementMode
                ? 'Monte o lote complementar com consultas realizadas após o fechamento principal e execute o envio adicional.'
                : 'Valide o lote da competência, confira a consolidação SUS e execute o fechamento para exportação.'}
          </p>
        </div>

        {page.loadError ? (
          <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-6">
            {page.loadError}
          </div>
        ) : null}

        <div className="shrink-0 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <CustomSelect
                size="compact"
                value={page.filters.competencia}
                onChange={(value) => page.updateFilters({ competencia: value })}
                options={page.filterOptions.competencias}
              />
              <SituationStatusBadge config={statusBadge} widthClass="w-[9.5rem]" />
            </div>
            <div className="text-xs leading-relaxed text-gray-500">
              {page.isClosed ? (
                <>
                  Fechado em {formatFechamentoDateTime(page.currentRecord.closedAt)} ·{' '}
                  {page.currentRecord.closedBy ?? '—'}
                  {page.currentRecord.fechamentoId ? ` · ${page.currentRecord.fechamentoId}` : ''}
                </>
              ) : (
                <>
                  Última revalidação: {formatFechamentoDateTime(page.currentRecord.lastRevalidationAt)}
                </>
              )}
            </div>
          </div>

          {showViewModeSelector ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Visão
              </span>
              {page.viewModes.map((mode) => {
                const active = page.currentRecord.id === mode.recordId
                return (
                  <button
                    key={mode.recordId}
                    type="button"
                    onClick={() => page.selectViewMode(mode.recordId)}
                    className={[
                      'rounded-full border px-3 py-1 text-xs font-semibold transition',
                      active
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {mode.label}
                    {mode.isClosed ? ' · fechado' : ''}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        {page.showComplementBanner ? (
          <div className="shrink-0 border-b border-amber-200 bg-amber-50/70 px-5 py-3 sm:px-6">
            <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <PlusCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {formatNumber(page.postClosePendingCount)} consulta(s) nova(s) após o fechamento
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    Há teleconsultas desta competência realizadas depois do lote principal. Inicie um
                    fechamento complementar para incluí-las em envio adicional ao SUS.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => page.verConsultasComplemento()}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                >
                  Ver consultas
                </button>
                <button
                  type="button"
                  disabled={!page.canStartComplement}
                  onClick={() => page.iniciarComplemento()}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-40 btn-brand-gradient"
                >
                  Iniciar fechamento complementar
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {page.isComplementMode && !page.isClosed ? (
          <div className="shrink-0 border-b border-violet-200 bg-violet-50/60 px-5 py-3 sm:px-6">
            <section className="flex items-start gap-3 rounded-xl border border-violet-200 bg-white/70 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
              <p className="text-xs leading-relaxed text-violet-950">
                <strong className="font-bold">Fechamento complementar</strong> — envio adicional para
                a mesma competência. O lote principal permanece inalterado e continua disponível
                somente leitura.
              </p>
            </section>
          </div>
        ) : null}

        <div className="shrink-0 border-b border-gray-200 px-5 py-4 sm:px-6">
          <KpiStatCards
            items={kpiCards}
            layout="responsive"
            className="sm:grid-cols-2 xl:grid-cols-4"
            variant="centered"
            animated
            updateKey={page.filters.competencia}
          />
        </div>

        <div className="shrink-0 border-b border-gray-200 px-5 py-2.5 sm:px-6">
          {page.isClosed ? (
            <section className="rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-3">
              <div className="flex flex-wrap items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-gray-900">
                    {page.isComplementMode ? 'Registro do complemento' : 'Registro de fechamento'}
                  </h3>
                  <dl className="mt-2 grid gap-2 text-xs text-gray-700 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <dt className="font-semibold text-gray-900">Fechado por</dt>
                      <dd>{page.currentRecord.closedBy ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-900">Fechado em</dt>
                      <dd>{formatFechamentoDateTime(page.currentRecord.closedAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-900">Lote SUS</dt>
                      <dd className="font-mono">{page.currentRecord.loteId ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-900">ID do fechamento</dt>
                      <dd className="tabular-nums">{page.currentRecord.fechamentoId ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-900">Exportado em</dt>
                      <dd>{formatFechamentoDateTime(page.currentRecord.exportedAt)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[11px] leading-relaxed text-gray-600">
                    {page.isComplementMode
                      ? 'O complemento está consolidado e não pode ser editado. Exporte o BPA ou baixe o relatório deste envio adicional.'
                      : 'O lote está consolidado e não pode ser editado. Novas consultas desta competência exigem fechamento complementar ou reabertura administrativa. Pendências registradas permanecem no histórico para auditoria.'}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section
              className={[
                'rounded-xl border px-3 py-2.5',
                gateOk ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h3 className="shrink-0 text-xs font-bold text-gray-900">Pré-requisitos para fechar</h3>
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
                  {page.gateItems.map((item) => (
                    <GateItem key={item.id} label={item.label} detail={item.detail} ok={item.ok} />
                  ))}
                </div>
                {page.bloqueantes > 0 && onGoToPendencias ? (
                  <button
                    type="button"
                    onClick={onGoToPendencias}
                    className="shrink-0 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-50"
                  >
                    Ir para Pendências
                  </button>
                ) : null}
              </div>
            </section>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {page.isClosed
                  ? page.isComplementMode
                    ? 'Lote complementar consolidado'
                    : 'Lote consolidado'
                  : page.isComplementMode
                    ? 'Pré-visualização do complemento'
                    : 'Pré-visualização do lote'}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {page.isClosed
                  ? page.isComplementMode
                    ? 'Consultas incluídas no complemento SUS desta competência — somente leitura.'
                    : 'Consultas incluídas no fechamento SUS desta competência — somente leitura.'
                  : page.isComplementMode
                    ? 'Consultas realizadas após o fechamento principal que entrarão no complemento.'
                    : 'Consultas elegíveis que entrarão no fechamento SUS desta competência.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <CustomSelect
                size="compact"
                value={page.filters.unitId}
                onChange={(value) => page.updateFilters({ unitId: value })}
                options={page.filterOptions.units}
              />
              <CustomSelect
                size="compact"
                value={page.filters.professionalName}
                onChange={(value) => page.updateFilters({ professionalName: value })}
                options={page.filterOptions.professionals}
              />
              <label className="relative min-w-0 sm:min-w-[14rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={page.filters.search}
                  onChange={(event) => page.updateFilters({ search: event.target.value })}
                  placeholder="Buscar consulta, paciente ou SIGTAP..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>
            </div>
          </div>

          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 lg:flex">
            <div className="min-h-0 flex-1 overflow-auto">
              <PrefeituraFaturamentoFechamentoLoteTable
                items={page.filteredLote}
                renderActions={(item) => renderLoteActionsMenu(item, 'center')}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto lg:hidden">
            {page.filteredLote.map((item) => (
              <article
                key={item.id}
                className={[
                  'rounded-2xl border p-4 shadow-sm',
                  item.excluded ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-white',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.patientName}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.consultaId}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={[
                        'text-xs font-semibold',
                        item.excluded ? 'text-amber-700' : 'text-emerald-700',
                      ].join(' ')}
                    >
                      {item.excluded ? 'Excluída' : 'No lote'}
                    </span>
                    {renderLoteActionsMenu(item, 'right')}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  {formatPendenciaConsultaDate(item.consultaDate)} · {item.professionalName}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {item.unitName} · SIGTAP {item.procedureCode}
                </p>
              </article>
            ))}
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-gray-600">
            {formatNumber(page.summary.noLote)} consulta(s) no lote ·{' '}
            {page.summary.competenciaLabel}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {!page.isClosed ? (
              <>
                <button
                  type="button"
                  disabled={isRevalidating}
                  onClick={() => void handleRevalidarCompetencia()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={['h-4 w-4', isRevalidating ? 'animate-spin' : ''].join(' ')} />
                  Revalidar competência
                </button>
                <button
                  type="button"
                  disabled={!page.canClose}
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-40 btn-brand-gradient"
                >
                  <Lock className="h-4 w-4" />
                  {closeActionLabel}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void page.exportarBpa()
                    showToast('Arquivo BPA-I gerado para download.')
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar BPA (TXT)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    page.baixarRelatorio()
                    showToast('Relatório de fechamento gerado para download.')
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <FileDown className="h-4 w-4" />
                  Baixar relatório
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  <Package className="h-3.5 w-3.5" />
                  {page.currentRecord.fechamentoId ?? 'Fechamento registrado'}
                </span>
              </>
            )}
          </div>
        </footer>
      </div>

      <PrefeituraFaturamentoFechamentoConfirmModal
        open={confirmOpen}
        summary={page.summary}
        closing={closePhase === 'closing'}
        isComplement={page.isComplementMode}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirmClose()}
      />

      <PrefeituraFaturamentoFechamentoExcludeModal
        open={excludeItem !== null}
        item={excludeItem}
        onClose={() => setExcludeItem(null)}
        onConfirm={(reason) => {
          if (!excludeItem) return
          page.excludeFromLote(excludeItem.id, reason)
          setExcludeItem(null)
          showToast('Consulta excluída do lote.')
        }}
      />

      <PrefeituraFaturamentoConsultaDrawer
        open={consultaItem !== null}
        closing={consultaClosing}
        item={consultaItem}
        onClose={() => setConsultaClosing(true)}
        onTransitionEnd={() => {
          setConsultaItem(null)
          setConsultaClosing(false)
        }}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant ?? 'success'}
        onClose={dismissToast}
      />
    </>
  )
}
