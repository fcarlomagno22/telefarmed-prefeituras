import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { usePrefeituraFaturamentoPendenciasPage } from '../../../../hooks/usePrefeituraFaturamentoPendenciasPage'
import type { PrefeituraFaturamentoCorrecaoPayload } from '../../../../types/prefeituraFaturamentoCorrecao'
import type { PrefeituraFaturamentoPendencia } from '../../../../types/prefeituraFaturamentoPendencias'
import type { PrefeituraFaturamentoRegraSusCheckId } from '../../../../types/prefeituraFaturamentoRegraSus'
import { maskCpfForDisplay } from '../../../../utils/lgpdDisplay'
import { CustomSelect } from '../../../ui/CustomSelect'
import { ExportFormatMenu } from '../../../ui/ExportFormatMenu'
import { KpiStatCards, type KpiStatCardItem } from '../../../ui/KpiStatCards'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'
import { Toast, type ToastVariant } from '../../../ui/Toast'
import {
  PrefeituraFaturamentoPendenciaActionsMenu,
  type PrefeituraFaturamentoPendenciaMenuAction,
} from './PrefeituraFaturamentoPendenciaActionsMenu'
import { PrefeituraFaturamentoConsultaDrawer } from './PrefeituraFaturamentoConsultaDrawer'
import { PrefeituraFaturamentoCorrecaoDrawer } from './PrefeituraFaturamentoCorrecaoDrawer'
import { PrefeituraFaturamentoPendenciaDetailDrawer } from './PrefeituraFaturamentoPendenciaDetailDrawer'
import { PrefeituraFaturamentoPendenciaIgnoreModal } from './PrefeituraFaturamentoPendenciaIgnoreModal'
import { PrefeituraFaturamentoPendenciasCategoryTabs } from './PrefeituraFaturamentoPendenciasCategoryTabs'
import { PrefeituraFaturamentoRegraSusDrawer } from './PrefeituraFaturamentoRegraSusDrawer'
import {
  formatPendenciaConsultaDate,
  prefeituraFaturamentoPendenciaAcaoLabel,
  resolvePendenciaSituacaoBadge,
  resolvePendenciaSituacaoHint,
} from './prefeituraFaturamentoPendenciasUi'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function buildKpiCards(summary: ReturnType<typeof usePrefeituraFaturamentoPendenciasPage>['summary']): KpiStatCardItem[] {
  return [
    {
      label: 'Pendências abertas',
      value: formatNumber(summary.abertas),
      suffix: 'Consultas com algum problema',
      icon: AlertTriangle,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Impeditivas',
      value: formatNumber(summary.bloqueantes),
      suffix: 'Impedem fechar SUS',
      icon: Ban,
      iconGradient: 'from-rose-500 via-red-500 to-red-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
      iconRing: 'ring-red-100/80',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Avisos',
      value: formatNumber(summary.avisos),
      suffix: 'Não bloqueiam, mas exigem atenção',
      icon: AlertCircle,
      iconGradient: 'from-amber-500 via-yellow-500 to-orange-500',
      iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
      iconRing: 'ring-amber-100/80',
      topBar: 'from-amber-400 to-yellow-500',
    },
    {
      label: 'Corrigidas hoje',
      value: formatNumber(summary.corrigidasHoje),
      suffix: 'Resolvidas na data atual',
      icon: CheckCircle2,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Consultas faturáveis',
      value: formatNumber(summary.faturaveis),
      suffix: `Competência ${summary.competenciaLabel}`,
      icon: CircleCheck,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
  ]
}

export function PrefeituraFaturamentoPendenciasPanel({
  onGoToFechamento,
}: {
  onGoToFechamento?: (competencia: string) => void
} = {}) {
  const page = usePrefeituraFaturamentoPendenciasPage()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [regraSusItem, setRegraSusItem] = useState<PrefeituraFaturamentoPendencia | null>(null)
  const [regraSusClosing, setRegraSusClosing] = useState(false)
  const [correcaoCheckId, setCorrecaoCheckId] = useState<PrefeituraFaturamentoRegraSusCheckId | null>(
    null,
  )
  const [correcaoClosing, setCorrecaoClosing] = useState(false)
  const [consultaItem, setConsultaItem] = useState<PrefeituraFaturamentoPendencia | null>(null)
  const [consultaClosing, setConsultaClosing] = useState(false)
  const [revalidatingIds, setRevalidatingIds] = useState<Set<string>>(() => new Set())
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const kpiCards = useMemo(() => buildKpiCards(page.summary), [page.summary])

  const activeRegraSusItem = useMemo(() => {
    if (!regraSusItem) return null
    return page.items.find((entry) => entry.id === regraSusItem.id) ?? regraSusItem
  }, [page.items, regraSusItem])

  const activeConsultaItem = useMemo(() => {
    if (!consultaItem) return null
    return page.items.find((entry) => entry.id === consultaItem.id) ?? consultaItem
  }, [consultaItem, page.items])

  const showingFrom = page.totalFiltered === 0 ? 0 : (page.page - 1) * page.pageSize + 1
  const showingTo = Math.min(page.page * page.pageSize, page.totalFiltered)

  const openRegraSusDrawer = useCallback(
    (item: PrefeituraFaturamentoPendencia) => {
      setOpenMenuId(null)
      if (page.detailItem) {
        page.closeDetail()
      }
      setRegraSusClosing(false)
      setRegraSusItem(item)
    },
    [page],
  )

  const openConsultaDrawer = useCallback(
    (item: PrefeituraFaturamentoPendencia) => {
      setOpenMenuId(null)
      setConsultaClosing(false)
      setConsultaItem(item)
    },
    [],
  )

  const closeConsultaDrawer = useCallback(() => setConsultaClosing(true), [])

  const finalizeConsultaClose = useCallback(() => {
    setConsultaItem(null)
    setConsultaClosing(false)
  }, [])

  const handlePrimaryAction = useCallback(
    (item: PrefeituraFaturamentoPendencia) => {
      if (item.primaryAction === 'abrir_consulta') {
        openConsultaDrawer(item)
        return
      }

      if (item.primaryAction === 'definir_procedimento') {
        setRegraSusClosing(false)
        setRegraSusItem(item)
        setCorrecaoClosing(false)
        setCorrecaoCheckId('procedimento_sigtap_informado')
        return
      }

      openRegraSusDrawer(item)
    },
    [openConsultaDrawer, openRegraSusDrawer],
  )

  const closeRegraSusDrawer = useCallback(() => setRegraSusClosing(true), [])

  const finalizeRegraSusClose = useCallback(() => {
    setRegraSusItem(null)
    setRegraSusClosing(false)
  }, [])

  const handleRevalidarFromRegraSus = useCallback(
    async (item: PrefeituraFaturamentoPendencia) => {
      return page.reavaliarElegibilidade(item.id)
    },
    [page],
  )

  const openCorrecaoDrawer = useCallback((checkId: PrefeituraFaturamentoRegraSusCheckId) => {
    setCorrecaoClosing(false)
    setCorrecaoCheckId(checkId)
  }, [])

  const closeCorrecaoDrawer = useCallback(() => setCorrecaoClosing(true), [])

  const finalizeCorrecaoClose = useCallback(() => {
    setCorrecaoCheckId(null)
    setCorrecaoClosing(false)
  }, [])

  const handleSaveCorrecao = useCallback(
    async (
      item: PrefeituraFaturamentoPendencia,
      _checkId: PrefeituraFaturamentoRegraSusCheckId,
      payload: PrefeituraFaturamentoCorrecaoPayload,
    ) => {
      await page.saveCorrecaoAndRevalidate(item.id, payload)
      showToast('Correção salva. Revalidando elegibilidade…')
    },
    [page, showToast],
  )

  const handleRequestClinicalCorrection = useCallback(
    async (item: PrefeituraFaturamentoPendencia) => {
      await page.requestClinicalCorrection(item.id)
      showToast('Solicitação enviada ao profissional responsável.')
    },
    [page, showToast],
  )

  const handleRevalidarCompetencia = useCallback(async () => {
    await page.revalidarCompetencia()
    showToast('Revalidação da competência concluída.')
  }, [page, showToast])

  const handleExport = useCallback(() => {
    const header = [
      'id',
      'competencia',
      'titulo',
      'paciente',
      'consulta',
      'profissional',
      'unidade',
      'gravidade',
      'status',
    ].join(',')

    const rows = page.filteredItems.map((item) =>
      [
        item.id,
        item.competencia,
        item.title,
        item.patientName,
        item.consultaId,
        item.professionalName,
        item.unitName,
        item.gravidade,
        item.status,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    )

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `pendencias-sus-${page.filters.competencia}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    showToast(`Exportadas ${formatNumber(page.totalFiltered)} pendência(s).`)
  }, [page.filteredItems, page.filters.competencia, page.totalFiltered, showToast])

  const handleSaveCns = useCallback(
    async (itemId: string, cns: string) => {
      const ok = await page.saveCnsCorrection(itemId, cns)
      if (ok) showToast('CNS salvo. Pendência marcada como corrigida.')
      return ok
    },
    [page, showToast],
  )

  const handleRevalidarPendencia = useCallback(
    async (item: PrefeituraFaturamentoPendencia) => {
      setRevalidatingIds((current) => new Set(current).add(item.id))

      try {
        const result = await page.reavaliarElegibilidade(item.id)

        if (result.ok) {
          showToast(
            result.message ?? 'Pendência resolvida. A consulta está elegível para o fechamento SUS.',
            'success',
          )
          return
        }

        showToast(
          result.errorReason ?? 'A pendência permanece aberta após a revalidação.',
          'info',
        )
      } finally {
        setRevalidatingIds((current) => {
          const next = new Set(current)
          next.delete(item.id)
          return next
        })
      }
    },
    [page, showToast],
  )

  const handleMenuAction = useCallback(
    (item: PrefeituraFaturamentoPendencia, action: PrefeituraFaturamentoPendenciaMenuAction) => {
      if (action === 'primary') {
        handlePrimaryAction(item)
        return
      }
      if (action === 'revisar_regra_sus') {
        openRegraSusDrawer(item)
        return
      }
      if (action === 'view_consulta') {
        openConsultaDrawer(item)
        return
      }
      if (action === 'revalidar') {
        void handleRevalidarPendencia(item)
        return
      }
      if (action === 'ignore') {
        page.setIgnoreItem(item)
      }
    },
    [handlePrimaryAction, handleRevalidarPendencia, openConsultaDrawer, openRegraSusDrawer, page, showToast],
  )

  const renderPendenciaSituacao = useCallback(
    (item: PrefeituraFaturamentoPendencia) => {
      const hint = resolvePendenciaSituacaoHint(item)
      return (
        <div>
          <SituationStatusBadge
            config={resolvePendenciaSituacaoBadge(item, revalidatingIds.has(item.id))}
            widthClass="w-[7.75rem]"
          />
          {hint ? <p className="mt-1 max-w-[11rem] text-[11px] leading-snug text-gray-500">{hint}</p> : null}
        </div>
      )
    },
    [revalidatingIds],
  )

  const renderActionsMenu = useCallback(
    (item: PrefeituraFaturamentoPendencia, align: 'left' | 'center' | 'right' = 'center') => (
      <PrefeituraFaturamentoPendenciaActionsMenu
        item={item}
        open={openMenuId === item.id}
        align={align}
        onToggle={() => setOpenMenuId((current) => (current === item.id ? null : item.id))}
        onClose={() => setOpenMenuId(null)}
        onAction={(action) => handleMenuAction(item, action)}
      />
    ),
    [handleMenuAction, openMenuId],
  )

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-gray-200 bg-amber-50/60 px-5 py-4 sm:px-6">
          <p className="text-sm font-medium leading-relaxed text-amber-950">
            Corrija os dados que impedem consultas realizadas de entrar no fechamento SUS da
            competência.
          </p>
        </div>

        <div className="shrink-0 border-b border-gray-200 px-5 py-4 sm:px-6">
          <KpiStatCards
            items={kpiCards}
            layout="responsive"
            className="sm:grid-cols-2 xl:grid-cols-5"
            variant="centered"
            animated
            updateKey={page.filters.competencia}
          />
        </div>

        <div className="shrink-0 border-b border-gray-200 bg-gray-50/60 px-5 py-3 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
              <CustomSelect
                size="compact"
                value={page.filters.competencia}
                onChange={(value) => page.updateFilters({ competencia: value })}
                options={page.filterOptions.competencias}
              />
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
              <CustomSelect
                size="compact"
                value={page.filters.specialty}
                onChange={(value) => page.updateFilters({ specialty: value })}
                options={page.filterOptions.specialties}
              />
              <CustomSelect
                size="compact"
                value={page.filters.category}
                onChange={(value) => page.updateFilters({ category: value })}
                options={page.filterOptions.categories}
              />
              <CustomSelect
                size="compact"
                value={page.filters.gravidade}
                onChange={(value) => page.updateFilters({ gravidade: value })}
                options={page.filterOptions.gravidades}
              />
              <CustomSelect
                size="compact"
                value={page.filters.status}
                onChange={(value) => page.updateFilters({ status: value })}
                options={page.filterOptions.statuses}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1 sm:min-w-[14rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={page.filters.search}
                  onChange={(event) => page.updateFilters({ search: event.target.value })}
                  placeholder="Buscar paciente, CPF, CNS ou ID..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>
              <ExportFormatMenu
                resultCount={page.totalFiltered}
                itemSingular="pendência"
                itemPlural="pendências"
                triggerLabel="Exportar pendências"
                onSelect={() => handleExport()}
              />
            </div>
          </div>
        </div>

        <PrefeituraFaturamentoPendenciasCategoryTabs
          activeTab={page.categoryTab}
          onTabChange={page.setCategoryTab}
        />

        <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
          {page.paginatedItems.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center">
              <CircleCheck className="h-10 w-10 text-emerald-500" />
              {page.summary.faturaveis > 0 && page.summary.abertas === 0 ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-gray-900">
                    Nenhuma pendência — {formatNumber(page.summary.faturaveis)}{' '}
                    {page.summary.faturaveis === 1 ? 'consulta pronta' : 'consultas prontas'} para
                    fechamento
                  </p>
                  <p className="mt-1 max-w-md text-sm text-gray-600">
                    Esta aba só lista problemas a corrigir. Consultas já validadas aparecem na aba{' '}
                    <strong>Fechamento</strong>, no lote da competência {page.summary.competenciaLabel}.
                  </p>
                  {onGoToFechamento ? (
                    <button
                      type="button"
                      onClick={() => onGoToFechamento?.(page.filters.competencia)}
                      className="btn-brand-gradient mt-5 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold"
                    >
                      Ver lote de fechamento
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-4 text-sm font-semibold text-gray-900">
                    Nenhuma pendência com os filtros atuais
                  </p>
                  <p className="mt-1 max-w-md text-sm text-gray-600">
                    Ajuste competência, categoria ou status para localizar itens a corrigir.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 lg:flex">
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-3">Situação</th>
                      <th className="px-3 py-3">Pendência</th>
                      <th className="px-3 py-3">Paciente</th>
                      <th className="px-3 py-3">Consulta</th>
                      <th className="px-3 py-3">Profissional</th>
                      <th className="px-3 py-3">Impacto</th>
                      <th className="w-14 px-3 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {page.paginatedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer bg-white transition hover:bg-gray-50/80"
                        onClick={() => page.openDetail(item)}
                      >
                        <td className="px-3 py-3">{renderPendenciaSituacao(item)}</td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{item.consultaId}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">{item.patientName}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {item.patientCpf ? maskCpfForDisplay(item.patientCpf) : 'CPF ausente'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                          {formatPendenciaConsultaDate(item.consultaDate)}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">{item.professionalName}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{item.specialty}</p>
                        </td>
                        <td className="max-w-[12rem] px-3 py-3 text-xs leading-relaxed text-gray-600">
                          {item.impact}
                        </td>
                        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                          {renderActionsMenu(item)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto lg:hidden">
                {page.paginatedItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>{renderPendenciaSituacao(item)}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => page.openDetail(item)}
                      className="mt-3 w-full text-left"
                    >
                      <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-sm font-medium text-gray-800">{item.patientName}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.patientCpf ? maskCpfForDisplay(item.patientCpf) : 'CPF ausente'}
                      </p>
                      <p className="mt-2 text-xs text-gray-600">
                        Consulta {formatPendenciaConsultaDate(item.consultaDate)} ·{' '}
                        {item.professionalName}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-gray-600">{item.impact}</p>
                    </button>

                    <div className="mt-4 flex justify-end">{renderActionsMenu(item, 'right')}</div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-gray-600">
            Mostrando {showingFrom}–{showingTo} de {formatNumber(page.totalFiltered)} pendências
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRevalidarCompetencia}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Revalidar todas da competência
            </button>

            <nav className="flex items-center gap-1" aria-label="Paginação">
              <button
                type="button"
                disabled={page.page <= 1}
                onClick={() => page.setPage(page.page - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-sm font-medium text-gray-700">
                {page.page} / {page.totalPages}
              </span>
              <button
                type="button"
                disabled={page.page >= page.totalPages}
                onClick={() => page.setPage(page.page + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </footer>
      </div>

      <PrefeituraFaturamentoPendenciaDetailDrawer
        open={page.detailItem !== null}
        closing={page.detailClosing}
        item={page.detailItem}
        actionsMenuOpenId={openMenuId}
        onActionsMenuToggle={(itemId) =>
          setOpenMenuId((current) => (current === itemId ? null : itemId))
        }
        onActionsMenuClose={() => setOpenMenuId(null)}
        onMenuAction={handleMenuAction}
        onClose={page.closeDetail}
        onTransitionEnd={page.finalizeDetailClose}
        onSaveCns={handleSaveCns}
      />

      <PrefeituraFaturamentoRegraSusDrawer
        open={activeRegraSusItem !== null}
        closing={regraSusClosing}
        stacked={correcaoCheckId !== null}
        item={activeRegraSusItem}
        onClose={closeRegraSusDrawer}
        onTransitionEnd={finalizeRegraSusClose}
        onCorrigir={(_item, checkId) => openCorrecaoDrawer(checkId)}
        onRevalidar={handleRevalidarFromRegraSus}
      />

      <PrefeituraFaturamentoCorrecaoDrawer
        open={correcaoCheckId !== null && activeRegraSusItem !== null}
        closing={correcaoClosing}
        item={activeRegraSusItem}
        checkId={correcaoCheckId}
        onClose={closeCorrecaoDrawer}
        onTransitionEnd={finalizeCorrecaoClose}
        onSave={handleSaveCorrecao}
        onRequestClinical={handleRequestClinicalCorrection}
      />

      <PrefeituraFaturamentoConsultaDrawer
        open={activeConsultaItem !== null}
        closing={consultaClosing}
        item={activeConsultaItem}
        onClose={closeConsultaDrawer}
        onTransitionEnd={finalizeConsultaClose}
      />

      <PrefeituraFaturamentoPendenciaIgnoreModal
        open={page.ignoreItem !== null}
        item={page.ignoreItem}
        onClose={() => page.setIgnoreItem(null)}
        onConfirm={(justification) => {
          if (!page.ignoreItem) return
          page.confirmIgnore(page.ignoreItem.id, justification)
          showToast('Pendência ignorada com justificativa registrada.')
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
