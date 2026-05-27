import { Filter, Search, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { unitStation } from '../../data/unitDashboardMock'
import {
  auditLogsFilterOptions,
  auditLogsPageOne,
  auditLogsPagination,
  auditLogsSummary,
  type AuditLogEntry,
} from '../../data/auditLogsMock'
import {
  exportAuditLogsExcel,
  exportAuditLogsPdf,
  labelFromFilterOptions,
  type AuditLogsExportContext,
} from '../../utils/auditLogs/auditLogsExport'
import {
  auditCriticalityOptions,
  type AuditLogsAdvancedFilters,
} from '../../utils/auditLogsAdvancedFilters'
import { filterAuditLogEntries } from '../../utils/auditLogs/filterAuditLogEntries'
import { getLoggedOperatorName } from '../../utils/sessionUser'
import { CustomSelect } from '../ui/CustomSelect'
import { Toast, type ToastVariant } from '../ui/Toast'
import { AuditLogsAdvancedFiltersMegamenu } from './AuditLogsAdvancedFiltersMegamenu'
import { AuditLogsExportMenu, type AuditLogsExportFormat } from './AuditLogsExportMenu'
import { AuditLogSeverityIcon, actionToneStyles } from './auditLogStyles'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const actionStyle = actionToneStyles[entry.actionTone]

  return (
    <tr className="text-sm text-gray-700 hover:bg-gray-50/80">
      <td className="w-10 px-3 py-3.5 align-middle sm:px-4">
        <AuditLogSeverityIcon severity={entry.severity} />
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 align-middle tabular-nums">
        <span className="block text-xs font-medium text-gray-900">{entry.dateTime}</span>
      </td>
      <td className="min-w-[8.5rem] px-3 py-3.5 text-center align-middle">
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-gray-900">{entry.userName}</span>
            <span className="mt-0.5 block text-xs text-gray-500">{entry.userRole}</span>
          </span>
        </div>
      </td>
      <td className="min-w-[9rem] px-3 py-3.5 text-center align-middle">
        <span className={`block font-semibold ${actionStyle.labelClass}`}>{entry.actionLabel}</span>
        <span className="mt-0.5 block text-xs font-medium uppercase tracking-wide text-gray-400">
          {entry.httpMethod}
        </span>
      </td>
      <td className="min-w-[8rem] px-3 py-3.5 text-center align-middle">
        <span className="block font-medium text-gray-900">{entry.moduleName}</span>
        <span className="mt-0.5 block text-xs text-gray-500">{entry.pagePath}</span>
      </td>
      <td className="min-w-[9rem] px-3 py-3.5 text-center align-middle">
        <span className="block text-gray-800">{entry.resourceLabel}</span>
        <span className="mt-0.5 block text-xs text-gray-500">{entry.resourceId}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-center align-middle">
        <span
          className={`text-xs font-semibold ${
            entry.serverResponseTone === 'success' ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {entry.serverResponse}
        </span>
      </td>
      <td className="min-w-[8rem] px-3 py-3.5 text-center align-middle">
        <span className="block font-medium text-gray-900">{entry.ipAddress}</span>
        <span className="mt-0.5 block text-xs text-gray-500">{entry.deviceInfo}</span>
      </td>
    </tr>
  )
}

type AuditLogsMainPanelProps = {
  advancedOpen: boolean
  onAdvancedOpenChange: (open: boolean) => void
  advancedFilters: AuditLogsAdvancedFilters
  onAdvancedFiltersChange: (filters: AuditLogsAdvancedFilters) => void
}

export function AuditLogsMainPanel({
  advancedOpen,
  onAdvancedOpenChange,
  advancedFilters,
  onAdvancedFiltersChange,
}: AuditLogsMainPanelProps) {
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const isCriticalView = advancedFilters.criticality === 'critical'
  const pageSize = auditLogsPagination.pageSize

  const filteredEntries = useMemo(
    () => filterAuditLogEntries(auditLogsPageOne, advancedFilters, search),
    [advancedFilters, search],
  )

  const total = useMemo(() => {
    if (filteredEntries.length === 0) return 0
    if (isCriticalView && !search.trim()) return auditLogsSummary.criticalEvents
    if (advancedFilters.criticality !== 'all') return filteredEntries.length
    return auditLogsPagination.total
  }, [advancedFilters.criticality, filteredEntries.length, isCriticalView, search])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const showingFrom = filteredEntries.length === 0 ? 0 : 1
  const showingTo = filteredEntries.length
  const exportResultCount = filteredEntries.length

  useEffect(() => {
    setCurrentPage(1)
  }, [search, userFilter, actionFilter, moduleFilter, periodFilter, advancedFilters])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const criticalityLabel = auditCriticalityOptions.find(
    (option) => option.value === advancedFilters.criticality,
  )?.label

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const filterSummaryLines = useMemo(() => {
    const lines: string[] = []
    const user = labelFromFilterOptions(auditLogsFilterOptions.users, userFilter)
    if (user && user !== 'Todos os usuários') lines.push(`Usuário: ${user}`)
    const action = labelFromFilterOptions(auditLogsFilterOptions.actions, actionFilter)
    if (action && action !== 'Todas as ações') lines.push(`Ação: ${action}`)
    const module = labelFromFilterOptions(auditLogsFilterOptions.modules, moduleFilter)
    if (module && module !== 'Todos os módulos') lines.push(`Módulo: ${module}`)
    const period = labelFromFilterOptions(auditLogsFilterOptions.periods, periodFilter)
    if (period && period !== 'Período') lines.push(`Período: ${period}`)
    const query = search.trim()
    if (query) lines.push(`Busca: “${query}”`)
    if (advancedFilters.criticality !== 'all' && criticalityLabel) {
      lines.push(`Criticidade: ${criticalityLabel}`)
    }
    return lines
  }, [
    actionFilter,
    advancedFilters.criticality,
    criticalityLabel,
    moduleFilter,
    periodFilter,
    search,
    userFilter,
  ])

  function buildExportContext(): AuditLogsExportContext {
    return {
      entries: filteredEntries,
      filterSummaryLines,
      operatorName: getLoggedOperatorName(),
      unitLabel: unitStation.unitName,
    }
  }

  async function handleExport(format: AuditLogsExportFormat) {
    if (exportResultCount === 0) {
      showToast('Nenhum evento encontrado para exportar.', 'error')
      return
    }

    showToast('Exportação iniciada', 'warning')

    try {
      const context = buildExportContext()
      if (format === 'pdf') {
        await exportAuditLogsPdf(context)
      } else {
        exportAuditLogsExcel(context)
      }
      showToast('Relatório gerado', 'success')
    } catch {
      showToast('Não foi possível gerar o relatório. Tente novamente.', 'error')
    }
  }

  const selectClass = 'py-2 text-sm'

  return (
    <>
    <section className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <header className="shrink-0 border-b border-gray-200 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
              {isCriticalView ? 'Eventos críticos' : 'Todos os eventos'}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {isCriticalView
                ? 'Apenas eventos classificados como críticos nas últimas 24 horas.'
                : 'Registro completo de ações realizadas no sistema.'}
            </p>
          </div>
          <AuditLogsExportMenu resultCount={exportResultCount} onSelect={handleExport} />
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuário, ação, página..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:shrink-0 xl:gap-2">
            <CustomSelect
              value={userFilter}
              onChange={setUserFilter}
              options={[...auditLogsFilterOptions.users]}
              className={selectClass}
            />
            <CustomSelect
              value={actionFilter}
              onChange={setActionFilter}
              options={[...auditLogsFilterOptions.actions]}
              className={selectClass}
            />
            <CustomSelect
              value={moduleFilter}
              onChange={setModuleFilter}
              options={[...auditLogsFilterOptions.modules]}
              className={selectClass}
            />
            <CustomSelect
              value={periodFilter}
              onChange={setPeriodFilter}
              options={[...auditLogsFilterOptions.periods]}
              className={selectClass}
            />
          </div>

          <button
            id="audit-advanced-filters-trigger"
            type="button"
            aria-expanded={advancedOpen}
            aria-controls="audit-advanced-filters-megamenu"
            onClick={() => onAdvancedOpenChange(!advancedOpen)}
            className={[
              'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
              advancedOpen || advancedFilters.criticality !== 'all'
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                : 'border-[var(--brand-primary)] bg-white text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]',
            ].join(' ')}
          >
            <Filter className="h-4 w-4" strokeWidth={2} />
            Filtros avançados
          </button>
        </div>

        {advancedFilters.criticality !== 'all' && criticalityLabel ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              Criticidade: {criticalityLabel}
              <button
                type="button"
                onClick={() =>
                  onAdvancedFiltersChange({ ...advancedFilters, criticality: 'all' })
                }
                className="rounded-full p-0.5 text-red-600 transition hover:bg-red-100"
                aria-label="Remover filtro de criticidade"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </span>
          </div>
        ) : null}
      </header>

      <AuditLogsAdvancedFiltersMegamenu
        open={advancedOpen}
        filters={advancedFilters}
        onChange={onAdvancedFiltersChange}
        onApply={() => onAdvancedOpenChange(false)}
        onCancel={() => onAdvancedOpenChange(false)}
        onClear={() => setCurrentPage(1)}
      />

      <div
        data-audit-logs-table-scroll
        className={[
          'min-h-0 flex-1 overflow-y-auto overflow-x-auto',
          '[-ms-overflow-style:none] [scrollbar-width:thin]',
          '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300',
          '[&::-webkit-scrollbar-track]:bg-transparent',
        ].join(' ')}
      >
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-10 px-3 py-3 sm:px-4" aria-label="Status" />
              <th className="px-3 py-3">Data e hora</th>
              <th className="px-3 py-3 text-center">Usuário</th>
              <th className="px-3 py-3 text-center">Ação realizada</th>
              <th className="px-3 py-3 text-center">Página / Módulo</th>
              <th className="px-3 py-3 text-center">Recurso afetado</th>
              <th className="px-3 py-3 text-center">Resposta do servidor</th>
              <th className="px-3 py-3 text-center">IP / Dispositivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                  Nenhum evento encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => <AuditLogRow key={entry.id} entry={entry} />)
            )}
          </tbody>
        </table>
      </div>

      <footer className="shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Mostrando {showingFrom} a {showingTo} de {formatNumber(total)} eventos
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Paginação">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            {[1, 2, 3].map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                  pageNumber === currentPage
                    ? 'bg-[var(--brand-primary)] text-white shadow-[0_2px_8px_rgba(255,107,0,0.35)]'
                    : 'border border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <span className="px-1 text-sm text-gray-400">…</span>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {totalPages}
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </nav>
        </div>
      </footer>
    </section>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={dismissToast}
      />
    </>
  )
}
