import {
  Bell,
  Download,
  FileText,
  LayoutGrid,
  Search,
  Users,
} from 'lucide-react'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { useEntidadeCopy } from '../../../hooks/useEntidadeCopy'
import { resolveSatisfacaoReportTitle } from '../../../utils/entidadeTerritoryPolicy'
import { createPortal } from 'react-dom'
import {
  PREFEITURA_RELATORIOS_DISPONIVEIS,
  prefeituraRelatorioCategoryCards,
  type PrefeituraRelatorioCategoryCard,
} from '../../../data/prefeituraRelatoriosHub'
import { getDefaultPrefeituraConsultasPeriod } from '../../../utils/consultasPeriod'
import { buildPrefeituraRelatorioGenerateUrl, buildPrefeituraRelatoriosCompiledUrl } from '../../../config/prefeituraRoutes'
import {
  SUPPORTED_PREFEITURA_RELATORIO_IDS,
  type PrefeituraRelatorioId,
} from '../../../types/prefeituraRelatorios'
import { CompactDateRangePicker } from '../../ui/CompactDateRangePicker'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  KpiStatCards,
  kpiStatStylePresets,
  type KpiStatCardItem,
} from '../../ui/KpiStatCards'
import { Toast, type ToastVariant } from '../../ui/Toast'

const [skyPreset, orangePreset, violetPreset, emeraldPreset] = kpiStatStylePresets

const relatoriosKpiCards: KpiStatCardItem[] = [
  {
    label: 'Relatórios disponíveis',
    value: String(PREFEITURA_RELATORIOS_DISPONIVEIS),
    suffix: 'Indicadores no catálogo',
    icon: LayoutGrid,
    ...orangePreset,
  },
  {
    label: 'Perfis de gestão',
    value: '6',
    suffix: 'Níveis de acesso',
    icon: Users,
    ...skyPreset,
  },
  {
    label: 'Exportações no mês',
    value: '124',
    suffix: '↑ 12% vs mês anterior',
    icon: Download,
    ...violetPreset,
  },
  {
    label: 'Alertas acionados',
    value: '5',
    suffix: '↓ 20% vs mês anterior',
    icon: Bell,
    ...emeraldPreset,
  },
]

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function reportSelectionKey(categoryId: string, reportId: string) {
  return `${categoryId}:${reportId}`
}

const defaultRelatoriosHubPeriod = getDefaultPrefeituraConsultasPeriod()

function RelatoriosCatalogTable({
  onExport,
  onGenerateReport,
}: {
  onExport: () => void
  onGenerateReport: (payload: {
    reportIds: PrefeituraRelatorioId[]
    unsupportedCount: number
    periodStart: string
    periodEnd: string
    categoryId?: string
  }) => void
}) {
  const copy = useEntidadeCopy()
  const [search, setSearch] = useState('')
  const [periodStart, setPeriodStart] = useState(defaultRelatoriosHubPeriod.start)
  const [periodEnd, setPeriodEnd] = useState(defaultRelatoriosHubPeriod.end)
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [selectedReports, setSelectedReports] = useState<Set<string>>(() => new Set())

  const categoryFilterOptions = useMemo(
    () => [
      { value: 'todas', label: 'Categorias' },
      ...prefeituraRelatorioCategoryCards.map((category) => ({
        value: category.id,
        label: category.title,
      })),
    ],
    [],
  )

  const filteredCategories = useMemo(() => {
    const query = normalizeSearch(search.trim())

    const mapReport = (report: PrefeituraRelatorioCategoryCard['reports'][number]) => {
      if (report.id !== 'satisfacao-cidadao') return report
      const title = resolveSatisfacaoReportTitle(copy.satisfacaoPublico)
      return { ...report, name: title }
    }

    return prefeituraRelatorioCategoryCards
      .filter((category) => categoryFilter === 'todas' || category.id === categoryFilter)
      .map((category) => {
        if (!query) {
          return {
            ...category,
            reports: category.reports.map(mapReport),
          }
        }

        const categoryHaystack = normalizeSearch(`${category.title} ${category.description}`)
        const reports = category.reports.filter((report) => {
          const mapped = mapReport(report)
          const reportHaystack = normalizeSearch(`${mapped.name} ${mapped.description}`)
          return reportHaystack.includes(query) || categoryHaystack.includes(query)
        })

        if (reports.length === 0 && !categoryHaystack.includes(query)) return null

        return {
          ...category,
          reports: reports.length > 0 ? reports : category.reports.map(mapReport),
        }
      })
      .filter((category): category is PrefeituraRelatorioCategoryCard => category !== null)
  }, [categoryFilter, copy.satisfacaoPublico, search])

  const totalReports = useMemo(
    () => filteredCategories.reduce((sum, category) => sum + category.reports.length, 0),
    [filteredCategories],
  )

  const selectedVisibleCount = useMemo(() => {
    let count = 0
    for (const category of filteredCategories) {
      for (const report of category.reports) {
        if (selectedReports.has(reportSelectionKey(category.id, report.id))) count += 1
      }
    }
    return count
  }, [filteredCategories, selectedReports])

  function toggleReport(categoryId: string, reportId: string) {
    const key = reportSelectionKey(categoryId, reportId)
    setSelectedReports((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleCategory(category: PrefeituraRelatorioCategoryCard) {
    const keys = category.reports.map((report) => reportSelectionKey(category.id, report.id))
    const allSelected = keys.every((key) => selectedReports.has(key))

    setSelectedReports((current) => {
      const next = new Set(current)
      for (const key of keys) {
        if (allSelected) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }

  function handleGenerateReportClick() {
    const selectedKeys = [...selectedReports]
    const allReportIds = selectedKeys.map((key) => key.split(':')[1])
    const reportIds = allReportIds.filter((reportId): reportId is PrefeituraRelatorioId =>
      SUPPORTED_PREFEITURA_RELATORIO_IDS.has(reportId as PrefeituraRelatorioId),
    )
    const categoryIds = new Set(selectedKeys.map((key) => key.split(':')[0]))

    onGenerateReport({
      reportIds,
      unsupportedCount: allReportIds.length - reportIds.length,
      periodStart,
      periodEnd,
      categoryId: categoryIds.size === 1 ? [...categoryIds][0] : undefined,
    })
  }

  return (
    <>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <header className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900">Catálogo de relatórios</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Indicadores operacionais, clínicos e contratuais {copy.daRede}.
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <CompactDateRangePicker
            start={periodStart}
            end={periodEnd}
            onStartChange={setPeriodStart}
            onEndChange={setPeriodEnd}
            compact
            className="w-full shrink-0 sm:w-[15.5rem]"
          />
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por relatório ou categoria..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]"
            />
          </label>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Download className="h-4 w-4 text-gray-500" strokeWidth={2} />
              Exportar
            </button>
            <CustomSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryFilterOptions}
              className="w-[10.5rem]"
              menuMinWidthPx={220}
            />
          </div>
        </div>
      </header>

      <div
        className={[
          'max-h-[42rem] min-h-[18rem] flex-1 overflow-x-auto overflow-y-auto bg-white',
          '[-ms-overflow-style:none] [scrollbar-width:thin]',
          '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300',
          '[&::-webkit-scrollbar-track]:bg-transparent',
        ].join(' ')}
      >
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-12 px-3 py-2.5 text-center sm:px-4">
                <span className="sr-only">Selecionar</span>
              </th>
              <th className="w-[16rem] px-2 py-2.5 text-left sm:w-[18rem]">Relatório</th>
              <th className="px-4 py-2.5 text-left sm:px-5">Descrição</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6">
                  Nenhum relatório encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : null}

            {filteredCategories.map((category, categoryIndex) => {
              const categoryKeys = category.reports.map((report) =>
                reportSelectionKey(category.id, report.id),
              )
              const categoryAllSelected =
                categoryKeys.length > 0 && categoryKeys.every((key) => selectedReports.has(key))
              const categoryPartialSelected =
                !categoryAllSelected && categoryKeys.some((key) => selectedReports.has(key))
              const Icon = category.icon

              return (
                <Fragment key={category.id}>
                  <tr
                    onClick={() => toggleCategory(category)}
                    className={[
                      'cursor-pointer bg-gray-50 transition hover:bg-gray-100/80',
                      categoryIndex > 0 ? 'border-t-2 border-gray-200' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-3 text-center sm:px-4">
                      <input
                        type="checkbox"
                        checked={categoryAllSelected}
                        ref={(element) => {
                          if (element) element.indeterminate = categoryPartialSelected
                        }}
                        onChange={() => toggleCategory(category)}
                        onClick={(event) => event.stopPropagation()}
                        className="size-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30"
                        aria-label={`Selecionar todos os relatórios de ${category.title}`}
                      />
                    </td>
                    <td colSpan={2} className="px-2 py-3 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            category.iconClass,
                          ].join(' ')}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Categoria
                          </p>
                          <p className="text-sm font-bold text-gray-900">{category.title}</p>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {category.reports.map((report) => {
                    const selectionKey = reportSelectionKey(category.id, report.id)
                    const checked = selectedReports.has(selectionKey)

                    return (
                      <tr
                        key={selectionKey}
                        onClick={() => toggleReport(category.id, report.id)}
                        className={[
                          'cursor-pointer border-t border-gray-100 text-gray-800 transition hover:bg-slate-50/80',
                          checked ? 'bg-[var(--brand-primary-muted)]/40' : '',
                        ].join(' ')}
                      >
                        <td className="px-3 py-2.5 text-center align-top sm:px-4">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleReport(category.id, report.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="mt-0.5 size-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30"
                            aria-label={`Selecionar ${report.name}`}
                          />
                        </td>
                        <td className="px-2 py-2.5 align-top text-sm font-bold text-gray-900">
                          {report.name}
                        </td>
                        <td className="px-4 py-2.5 align-top text-sm leading-relaxed text-gray-600 sm:px-5">
                          {report.description}
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-2 sm:px-5">
        <p className="text-xs text-gray-500">
          {totalReports === 0
            ? 'Nenhum relatório na lista filtrada'
            : `${formatNumber(totalReports)} relatórios exibidos`}
        </p>
        {selectedVisibleCount > 0 ? (
          <p className="text-xs font-medium text-gray-700">
            {formatNumber(selectedVisibleCount)} selecionados
          </p>
        ) : null}
      </footer>
      </section>

      {selectedReports.size > 0
        ? createPortal(
            <div className="pointer-events-none fixed bottom-[4.5rem] right-6 z-[100] sm:right-8">
              <button
                type="button"
                onClick={handleGenerateReportClick}
                className={[
                  'pointer-events-auto inline-flex items-center gap-2.5 rounded-2xl px-5 py-3.5',
                  'btn-brand-gradient text-sm font-bold text-white',
                  'shadow-[var(--brand-primary-shadow-lg)]',
                  'transition duration-200 hover:scale-[1.02] hover:shadow-[var(--brand-primary-shadow-lg)]',
                  'active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-primary)]',
                ].join(' ')}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <FileText className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span>Gerar Relatório</span>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold tabular-nums">
                  {formatNumber(selectedReports.size)}
                </span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export function PrefeituraRelatoriosHubPanel() {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  return (
    <>
      <div className="space-y-4">
        <KpiStatCards items={relatoriosKpiCards} className="gap-3 sm:gap-4" />

        <RelatoriosCatalogTable
          onExport={() => showToast('Exportação iniciada.', 'success')}
          onGenerateReport={({ reportIds, unsupportedCount, periodStart, periodEnd, categoryId }) => {
            if (reportIds.length === 0) {
              showToast('Os relatórios selecionados ainda não estão disponíveis.', 'warning')
              return
            }

            if (reportIds.length > 1) {
              const url = buildPrefeituraRelatoriosCompiledUrl({
                reportIds,
                periodStart,
                periodEnd,
                categoryId,
              })
              const tab = window.open(url, '_blank')
              if (!tab) {
                showToast('Permita pop-ups neste site para abrir o compilado.', 'warning')
                return
              }

              if (unsupportedCount > 0) {
                showToast(
                  `Compilado aberto com ${formatNumber(reportIds.length)} relatório(s). ${formatNumber(unsupportedCount)} selecionado(s) ainda não disponível(is).`,
                  'warning',
                )
                return
              }

              showToast(
                `Compilado aberto com ${formatNumber(reportIds.length)} relatórios em uma única página.`,
                'success',
              )
              return
            }

            let opened = 0
            for (const reportId of reportIds) {
              const url = buildPrefeituraRelatorioGenerateUrl(reportId, {
                periodStart,
                periodEnd,
              })
              const tab = window.open(url, '_blank')
              if (tab) opened += 1
            }

            if (opened === 0) {
              showToast('Permita pop-ups neste site para abrir os relatórios.', 'warning')
              return
            }

            if (unsupportedCount > 0) {
              showToast(
                `${formatNumber(opened)} relatório(s) aberto(s). ${formatNumber(unsupportedCount)} selecionado(s) ainda não disponível(is).`,
                'warning',
              )
              return
            }

            showToast('Relatório aberto em nova aba.', 'success')
          }}
        />
      </div>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </>
  )
}
