import { Download, Eye, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { PrefeituraConsultasUnitRow } from '../../../data/prefeituraConsultasMock'
import { prefeituraConsultasTableColumns } from '../../../data/prefeituraConsultasMock'
import type { usePrefeituraConsultasUnitDetailDrawer } from '../../../hooks/usePrefeituraConsultasUnitDetailDrawer'
import {
  exportPrefeituraConsultasUnitsExcel,
  exportPrefeituraConsultasUnitsPdf,
} from '../../../utils/prefeitura/prefeituraConsultasUnitsExport'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { Toast, type ToastVariant } from '../../ui/Toast'
import { prefeituraSlaBadgeConfig } from '../prefeituraDashboardUi'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type PrefeituraConsultasMainPanelProps = {
  rows: PrefeituraConsultasUnitRow[]
  unitFilter: string
  regionFilter: string
  periodStart: string
  periodEnd: string
  unitDetailDrawer: Pick<ReturnType<typeof usePrefeituraConsultasUnitDetailDrawer>, 'openDrawer'>
  /** Em xl, preenche a faixa até o rodapé, alinhado à coluna lateral. */
  fillHeight?: boolean
}

export function PrefeituraConsultasMainPanel({
  rows,
  unitFilter,
  regionFilter,
  periodStart,
  periodEnd,
  unitDetailDrawer,
  fillHeight = false,
}: PrefeituraConsultasMainPanelProps) {
  const [search, setSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = useState('todas')
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const filteredRows = useMemo(() => {
    const query = normalizeSearch(search.trim())

    return rows.filter((row) => {
      if (unitFilter && unitFilter !== 'todas' && row.id !== unitFilter) {
        return false
      }
      if (regionFilter && regionFilter !== 'todas' && row.regionKey !== regionFilter) return false
      if (!query) return true
      const haystack = normalizeSearch(`${row.name} ${row.address} ${row.region}`)
      return haystack.includes(query)
    })
  }, [rows, search, unitFilter, regionFilter])

  const totalFiltered = filteredRows.length

  function handleOpenDetails(row: PrefeituraConsultasUnitRow) {
    unitDetailDrawer.openDrawer({
      unit: row,
      periodStart,
      periodEnd,
      allUnits: rows,
    })
  }

  const handleExport = useCallback(async () => {
    if (rows.length === 0) {
      showToast('Não há unidades para exportar.', 'warning')
      return
    }

    const context = {
      units: rows,
      unitFilter: 'todas',
      regionFilter: 'todas',
      periodStart,
      periodEnd,
      search: '',
    }

    showToast('Exportação iniciada', 'warning')

    try {
      exportPrefeituraConsultasUnitsExcel(context)
      await exportPrefeituraConsultasUnitsPdf(context)
      showToast('Relatórios gerados (Excel e PDF)', 'success')
    } catch {
      showToast('Não foi possível gerar o relatório. Tente novamente.', 'error')
    }
  }, [periodEnd, periodStart, rows, showToast])

  return (
    <section
      className={[
        'flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
        fillHeight ? 'h-full min-h-0' : '',
      ].join(' ')}
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900">Consultas por unidade</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Visão consolidada de todas as consultas realizadas.
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por unidade..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]"
            />
          </label>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Download className="h-4 w-4 text-gray-500" strokeWidth={2} />
              Exportar
            </button>
            <CustomSelect
              value={visibleColumns}
              onChange={setVisibleColumns}
              options={[
                { value: 'todas', label: 'Colunas' },
                ...prefeituraConsultasTableColumns.map((col) => ({
                  value: col.value,
                  label: col.label,
                })),
              ]}
              className="w-[8.5rem]"
              menuMinWidthPx={180}
            />
          </div>
        </div>
      </header>

      <div
        className={[
          'overflow-y-auto overflow-x-auto bg-white',
          '[-ms-overflow-style:none] [scrollbar-width:thin]',
          '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300',
          '[&::-webkit-scrollbar-track]:bg-transparent',
          fillHeight ? 'min-h-0 flex-1' : 'max-h-[28rem] min-h-[12rem] flex-1 shrink-0',
        ].join(' ')}
      >
        <table className="w-full min-w-[58rem] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5 text-left sm:px-5">Unidade</th>
              <th className="px-2 py-2.5 text-center">Região</th>
              <th className="px-2 py-2.5 text-center">Volume total</th>
              <th className="px-2 py-2.5 text-center">Concluídas</th>
              <th className="px-2 py-2.5 text-center">Taxa conclusão</th>
              <th className="px-2 py-2.5 text-center">Canceladas</th>
              <th className="px-2 py-2.5 text-center">Duração média</th>
              <th className="px-2 py-2.5 text-center">Status</th>
              <th className="px-2 py-2.5 text-center sm:px-5">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6">
                  Nenhuma unidade encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : null}
            {filteredRows.map((row) => (
              <tr key={row.id} className="text-gray-800 transition hover:bg-slate-50/80">
                <td className="px-4 py-2.5 sm:px-5">
                  <p className="text-sm font-bold text-gray-900">{row.name}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{row.address}</p>
                </td>
                <td className="px-2 py-2.5 text-center text-xs text-gray-600">{row.region}</td>
                <td className="px-2 py-2.5 text-center text-sm font-bold tabular-nums text-gray-900">
                  {formatNumber(row.volumeTotal)}
                </td>
                <td className="px-2 py-2.5 text-center text-sm font-bold tabular-nums text-gray-900">
                  {formatNumber(row.completed)}
                </td>
                <td className="px-2 py-2.5 text-center text-sm font-semibold tabular-nums text-gray-800">
                  {formatPercent(row.completionRate)}%
                </td>
                <td className="px-2 py-2.5 text-center">
                  <p className="text-sm font-bold tabular-nums text-gray-900">
                    {formatNumber(row.cancelled)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-gray-500">
                    ({formatPercent(row.cancelledRate)}%)
                  </p>
                </td>
                <td className="px-2 py-2.5 text-center text-sm font-semibold text-gray-800">
                  {row.avgDurationMin} min
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex justify-center">
                    <SituationStatusBadge
                      config={prefeituraSlaBadgeConfig[row.status]}
                      widthClass="w-[5.5rem]"
                    />
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center sm:px-5">
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(row)}
                    className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                    aria-label={`Ver detalhes de ${row.name}`}
                  >
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-2 sm:px-5">
        <p className="text-xs text-gray-500">
          {totalFiltered === 0
            ? 'Nenhuma unidade na lista filtrada'
            : `${formatNumber(totalFiltered)} unidades exibidas`}
        </p>
      </footer>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={dismissToast}
      />
    </section>
  )
}
