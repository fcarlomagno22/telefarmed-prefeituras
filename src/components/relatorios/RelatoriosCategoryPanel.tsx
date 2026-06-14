import { ArrowLeft, Filter, Loader2, RotateCcw, Search, Table2 } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ReportCategoryConfig } from '../../config/reportsCategories'
import { useRelatoriosCategoryPage } from '../../hooks/useRelatoriosCategoryPage'
import { useUbtUnitStation } from '../../hooks/useUbtUnitStation'
import type { RelatoriosPortal } from '../../types/relatorios'
import { formatCellValue } from '../../utils/relatoriosFilters'
import { mapRelatorioKpisToStatCards } from '../../utils/relatoriosKpiCards'
import { exportRelatoriosPdf } from '../../utils/relatorios/relatoriosExport'
import { CustomSelect } from '../ui/CustomSelect'
import { CompactDateRangePicker } from '../ui/CompactDateRangePicker'
import { Toast, type ToastVariant } from '../ui/Toast'
import { ExportFormatMenu, type ExportFormat } from '../ui/ExportFormatMenu'
import { KpiStatCards } from '../ui/KpiStatCards'

type RelatoriosCategoryPanelProps = {
  category: ReportCategoryConfig
  portal?: RelatoriosPortal
  backPath: string
  unitLabel?: string
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function columnAlignClass(index: number) {
  return index === 0 ? 'text-left' : 'text-center'
}

function formatPeriodLabel(start: string, end: string) {
  if (!start && !end) return 'Todo o período'
  if (start && end) {
    const fmt = (iso: string) => {
      const [y, m, d] = iso.split('-')
      return `${d}/${m}/${y}`
    }
    return `${fmt(start)} a ${fmt(end)}`
  }
  return start || end
}

export function RelatoriosCategoryPanel({
  category,
  portal = 'ubt',
  backPath,
  unitLabel,
}: RelatoriosCategoryPanelProps) {
  const { unitName } = useUbtUnitStation()
  const resolvedUnitLabel = unitLabel ?? unitName
  const {
    meta,
    draftFilters,
    rows,
    pagination,
    kpis,
    isLoadingMeta,
    isLoadingData,
    loadError,
    updateDraft,
    applyFilters,
    clearFilters,
    setPage,
    exportCsv,
    fetchAllRows,
  } = useRelatoriosCategoryPage(portal, category.id)

  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const columns = meta?.columns ?? []
  const kpiCards = useMemo(() => mapRelatorioKpisToStatCards(kpis), [kpis])

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  function handleApplyFilters() {
    applyFilters()
    showToast('Filtros aplicados', 'success')
  }

  function handleClearFilters() {
    clearFilters()
    showToast('Filtros limpos', 'success')
  }

  async function handleExport(format: ExportFormat) {
    if (pagination.total === 0) {
      showToast('Nenhum registro encontrado para exportar.', 'error')
      return
    }

    try {
      if (format === 'excel') {
        await exportCsv()
        showToast('Relatório gerado', 'success')
        return
      }

      const allRows = await fetchAllRows()
      exportRelatoriosPdf({
        category,
        columns,
        rows: allRows,
        periodLabel: formatPeriodLabel(draftFilters.periodStart, draftFilters.periodEnd),
        unitLabel: resolvedUnitLabel,
      })
      showToast('Relatório gerado', 'success')
    } catch {
      showToast('Não foi possível gerar o relatório. Tente novamente.', 'error')
    }
  }

  const selectClass = 'py-2.5'
  const isLoading = isLoadingMeta || isLoadingData

  return (
    <>
      <div className="flex shrink-0 flex-col gap-4">
        <Link
          to={backPath}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Voltar aos relatórios
        </Link>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <section className="shrink-0 rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <header className="flex items-center gap-2 border-b border-gray-200 px-5 py-4 sm:px-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
              <Filter className="h-4 w-4" strokeWidth={2} />
            </span>
            <h2 className="text-base font-bold text-gray-900">Filtros de busca</h2>
          </header>

          <div className="px-5 py-5 sm:px-6">
            {isLoadingMeta ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando filtros...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {meta?.showPeriod ? (
                  <FilterField label="Período">
                    <CompactDateRangePicker
                      start={draftFilters.periodStart}
                      end={draftFilters.periodEnd}
                      onStartChange={(value) => updateDraft('periodStart', value)}
                      onEndChange={(value) => updateDraft('periodEnd', value)}
                    />
                  </FilterField>
                ) : null}

                {meta?.showUnit ? (
                  <FilterField label="Unidade">
                    <CustomSelect
                      value={draftFilters.unit}
                      onChange={(value) => updateDraft('unit', value)}
                      options={meta.unitOptions}
                      className={selectClass}
                    />
                  </FilterField>
                ) : null}

                {meta?.showOperator ? (
                  <FilterField label="Operador">
                    <CustomSelect
                      value={draftFilters.operator}
                      onChange={(value) => updateDraft('operator', value)}
                      options={meta.operatorOptions}
                      className={selectClass}
                    />
                  </FilterField>
                ) : null}

                {meta?.showStation ? (
                  <FilterField label="Computador">
                    <CustomSelect
                      value={draftFilters.station}
                      onChange={(value) => updateDraft('station', value)}
                      options={meta.stationOptions}
                      className={selectClass}
                    />
                  </FilterField>
                ) : null}

                {meta?.showSpecialty ? (
                  <FilterField label="Especialidade">
                    <CustomSelect
                      value={draftFilters.specialty}
                      onChange={(value) => updateDraft('specialty', value)}
                      options={meta.specialtyOptions}
                      className={selectClass}
                    />
                  </FilterField>
                ) : null}

                {meta?.showStatus ? (
                  <FilterField label="Status">
                    <CustomSelect
                      value={draftFilters.status}
                      onChange={(value) => updateDraft('status', value)}
                      options={meta.statusOptions}
                      className={selectClass}
                    />
                  </FilterField>
                ) : null}

                <div className="col-span-1 sm:col-span-2 xl:col-span-4">
                  <FilterField label="Busca geral">
                    <label className="relative block">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        value={draftFilters.generalSearch}
                        onChange={(e) => updateDraft('generalSearch', e.target.value)}
                        placeholder="Paciente, protocolo, médico, bairro..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                      />
                    </label>
                  </FilterField>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col items-end gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                disabled={isLoadingMeta}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={2} />
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={isLoadingMeta}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] disabled:opacity-50"
              >
                <Search className="h-4 w-4" strokeWidth={2} />
                Aplicar filtros
              </button>
            </div>
          </div>
        </section>

        <KpiStatCards items={kpiCards} />

        <section className="flex min-h-[24rem] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                <Table2 className="h-4 w-4" strokeWidth={2} />
              </span>
              <h2 className="text-base font-bold text-gray-900">Resultados</h2>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ExportFormatMenu
                resultCount={pagination.total}
                itemSingular="registro"
                itemPlural="registros"
                onSelect={(format) => void handleExport(format)}
              />
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">
                  {formatNumber(pagination.total)}
                </span>{' '}
                registro{pagination.total === 1 ? '' : 's'}
              </span>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
                <tr>
                  {columns.map((col, colIndex) => (
                    <th
                      key={col.key}
                      className={[
                        'border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500',
                        columnAlignClass(colIndex),
                      ].join(' ')}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(columns.length, 1)}
                      className="px-4 py-16 text-center text-sm text-gray-500"
                    >
                      {isLoading
                        ? 'Carregando resultados...'
                        : 'Nenhum registro encontrado. Ajuste os filtros e clique em Aplicar filtros.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rowIndex) => (
                    <tr
                      key={`${rowIndex}-${String(row.id ?? rowIndex)}`}
                      className="border-b border-gray-50 transition hover:bg-orange-50/30"
                    >
                      {columns.map((col, colIndex) => (
                        <td
                          key={col.key}
                          className={['px-4 py-3 text-gray-700', columnAlignClass(colIndex)].join(
                            ' ',
                          )}
                        >
                          {formatCellValue(col.key, row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > 0 ? (
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-3 sm:px-6">
              <p className="text-xs text-gray-500">
                Exibindo{' '}
                {pagination.total === 0
                  ? 0
                  : (pagination.page - 1) * pagination.pageSize + 1}
                –
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
                {formatNumber(pagination.total)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => setPage(pagination.page - 1)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition enabled:hover:bg-gray-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-xs text-gray-500">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  onClick={() => setPage(pagination.page + 1)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition enabled:hover:bg-gray-50 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </footer>
          ) : null}
        </section>
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
