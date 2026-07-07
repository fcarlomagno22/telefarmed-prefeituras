import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CrmPartnersIndicadorRow } from '../../../types/crmPartnersIndicadores'
import { CustomSelect } from '../../ui/CustomSelect'
import { KpiStatCards } from '../../ui/KpiStatCards'
import type { KpiStatCardItem } from '../../ui/KpiStatCards'
import { CrmPartnersIndicadorNfEmitidaBadge } from './CrmPartnersIndicadorNfEmitidaBadge'
import { CrmPartnersIndicadorNfBadge } from './CrmPartnersIndicadorNfBadge'
import { CrmPartnersIndicadorStatusBadge } from './CrmPartnersIndicadorStatusBadge'
import {
  CRM_PARTNERS_INDICADORES_PAGE_SIZE,
  crmPartnersIndicadorStatusFilterOptions,
  crmPartnersIndicadoresTableCellCenterClass,
  crmPartnersIndicadoresTableHeadCenterClass,
  crmPartnersIndicadoresTableHeadClass,
  formatCrmPartnersIndicadoresCurrency,
} from './crmPartnersIndicadoresUi'

const PAGE_SIZE = CRM_PARTNERS_INDICADORES_PAGE_SIZE

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type CrmPartnersIndicadoresMainPanelProps = {
  rows: CrmPartnersIndicadorRow[]
  kpiCards: KpiStatCardItem[]
  onRowClick: (row: CrmPartnersIndicadorRow) => void
}

export function CrmPartnersIndicadoresMainPanel({
  rows,
  kpiCards,
  onRowClick,
}: CrmPartnersIndicadoresMainPanelProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [page, setPage] = useState(1)

  const filteredRows = useMemo(() => {
    const query = normalizeSearch(search.trim())

    return rows.filter((row) => {
      if (statusFilter !== 'todos' && row.status !== statusFilter) return false
      if (!query) return true
      return normalizeSearch(row.cliente).includes(query)
    })
  }, [rows, search, statusFilter])

  const totalFiltered = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, safePage])

  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo = totalFiltered === 0 ? 0 : Math.min(safePage * PAGE_SIZE, totalFiltered)

  return (
    <div className="space-y-4">
      <KpiStatCards
        items={kpiCards}
        className="gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
        animated
      />

      <section className="flex h-full min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Comissões por cliente</h2>
            <p className="mt-1 text-sm text-gray-500">
              Clique em um registro para emitir, anexar a nota fiscal e acompanhar repasses.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar por cliente..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]"
              />
            </label>
            <CustomSelect
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              options={[...crmPartnersIndicadorStatusFilterOptions]}
              className="w-full min-w-[12.5rem] sm:w-[14rem]"
              menuMinWidthPx={220}
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="sticky top-0 z-[1] bg-slate-50/95 backdrop-blur-sm">
              <tr>
                <th className={crmPartnersIndicadoresTableHeadClass}>Cliente</th>
                <th className={crmPartnersIndicadoresTableHeadCenterClass}>Minha comissão</th>
                <th className={crmPartnersIndicadoresTableHeadCenterClass}>Parceiros</th>
                <th className={crmPartnersIndicadoresTableHeadCenterClass}>Valor disponível</th>
                <th className={crmPartnersIndicadoresTableHeadCenterClass}>NF emitida</th>
                <th className={crmPartnersIndicadoresTableHeadCenterClass}>NF anexada</th>
                <th className={crmPartnersIndicadoresTableHeadCenterClass}>Previsão</th>
                <th className={crmPartnersIndicadoresTableHeadCenterClass}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    Nenhum registro encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick(row)}
                    className="cursor-pointer transition hover:bg-orange-50/60"
                  >
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{row.cliente}</td>
                    <td className={crmPartnersIndicadoresTableCellCenterClass}>
                      {formatCrmPartnersIndicadoresCurrency(row.minhaComissao)}
                    </td>
                    <td className={crmPartnersIndicadoresTableCellCenterClass}>
                      {formatCrmPartnersIndicadoresCurrency(row.valorParceiros)}
                    </td>
                    <td className={[crmPartnersIndicadoresTableCellCenterClass, 'font-semibold text-gray-900'].join(' ')}>
                      {formatCrmPartnersIndicadoresCurrency(row.valorDisponivel)}
                    </td>
                    <td className={crmPartnersIndicadoresTableCellCenterClass}>
                      <div className="flex justify-center">
                        <CrmPartnersIndicadorNfEmitidaBadge emitida={row.nfEmitida} />
                      </div>
                    </td>
                    <td className={crmPartnersIndicadoresTableCellCenterClass}>
                      <div className="flex justify-center">
                        <CrmPartnersIndicadorNfBadge status={row.nfStatus} />
                      </div>
                    </td>
                    <td className={crmPartnersIndicadoresTableCellCenterClass}>
                      {row.previsaoPagamento ?? '—'}
                    </td>
                    <td className={crmPartnersIndicadoresTableCellCenterClass}>
                      <div className="flex justify-center">
                        <CrmPartnersIndicadorStatusBadge status={row.status} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-gray-500">
            {totalFiltered === 0
              ? 'Nenhum registro na lista filtrada'
              : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(totalFiltered)} registro${totalFiltered === 1 ? '' : 's'}`}
          </p>
          <nav className="flex items-center gap-1" aria-label="Paginação financeira">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                    pageNumber === safePage
                      ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : 'border border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}
            {totalPages > 3 ? (
              <>
                <span className="px-1 text-sm text-gray-400">…</span>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                    safePage === totalPages
                      ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            ) : null}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </footer>
      </section>
    </div>
  )
}
