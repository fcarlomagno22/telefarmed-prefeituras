import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { PrefeituraRedeUnitCadastralProfile } from '../../../data/prefeituraRedeUnitDetail'
import {
  type PrefeituraRedeUnit,
} from '../../../data/prefeituraRedeMock'
import type { usePrefeituraNewUbtDrawer } from '../../../hooks/usePrefeituraNewUbtDrawer'
import type { usePrefeituraRedeUnitActions } from '../../../hooks/usePrefeituraRedeUnitActions'
import {
  exportPrefeituraRedeUnitsExcel,
  exportPrefeituraRedeUnitsPdf,
} from '../../../utils/prefeitura/prefeituraRedeUnitsExport'
import { CustomSelect } from '../../ui/CustomSelect'
import { ExportFormatMenu, type ExportFormat } from '../../ui/ExportFormatMenu'
import { Toast, type ToastVariant } from '../../ui/Toast'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { PrefeituraRedeUnitActionsMenu } from './PrefeituraRedeUnitActionsMenu'
import { prefeituraRedeStatusBadgeConfig } from './prefeituraRedeStatusBadge'

const PAGE_SIZE = 5

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type PrefeituraRedeMainPanelProps = {
  units: PrefeituraRedeUnit[]
  regionFilterOptions?: Array<{ value: string; label: string }>
  statusFilterOptions?: Array<{ value: string; label: string }>
  cadastralProfilesByUnitId?: Record<string, PrefeituraRedeUnitCadastralProfile>
  canInsert?: boolean
  canEdit?: boolean
  canDelete?: boolean
  unitActions: Pick<
    ReturnType<typeof usePrefeituraRedeUnitActions>,
    'openMenuUnitId' | 'toggleMenu' | 'closeMenu' | 'handleUnitAction'
  >
  newUbtDrawer: Pick<ReturnType<typeof usePrefeituraNewUbtDrawer>, 'openDrawer'>
}

export function PrefeituraRedeMainPanel({
  units,
  regionFilterOptions = [{ value: 'todas', label: 'Todas as regiões' }],
  statusFilterOptions = [{ value: 'todas', label: 'Todos os status' }],
  cadastralProfilesByUnitId,
  canInsert = true,
  canEdit = true,
  canDelete = true,
  unitActions,
  newUbtDrawer,
}: PrefeituraRedeMainPanelProps) {
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('todas')
  const [statusFilter, setStatusFilter] = useState('todas')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const filteredUnits = useMemo(() => {
    const query = normalizeSearch(search.trim())

    return units.filter((unit) => {
      if (regionFilter !== 'todas' && unit.regionKey !== regionFilter) return false
      if (statusFilter !== 'todas' && unit.status !== statusFilter) return false

      if (!query) return true

      const haystack = normalizeSearch(
        `${unit.name} ${unit.cnes} ${unit.region} ${unit.address} ${unit.responsibleName}`,
      )
      return haystack.includes(query)
    })
  }, [search, regionFilter, statusFilter, units])

  const totalFiltered = filteredUnits.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pageUnits = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredUnits.slice(start, start + PAGE_SIZE)
  }, [filteredUnits, safePage])

  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo = totalFiltered === 0 ? 0 : Math.min(safePage * PAGE_SIZE, totalFiltered)

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (totalFiltered === 0) {
        showToast('Não há unidades para exportar no recorte atual.', 'warning')
        return
      }

      const context = {
        units: filteredUnits,
        regionFilter,
        statusFilter,
        search,
        cadastralProfilesByUnitId,
      }

      showToast('Exportação iniciada', 'warning')

      try {
        if (format === 'pdf') {
          await exportPrefeituraRedeUnitsPdf(context)
        } else {
          exportPrefeituraRedeUnitsExcel(context)
        }
        showToast('Relatório gerado', 'success')
      } catch {
        showToast('Não foi possível gerar o relatório. Tente novamente.', 'error')
      }
    },
    [
      cadastralProfilesByUnitId,
      filteredUnits,
      regionFilter,
      search,
      showToast,
      statusFilter,
      totalFiltered,
    ],
  )

  return (
    <section className="flex h-full min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                Unidades Básicas de Teleatendimento
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie as unidades e seus terminais de telemedicina.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <ExportFormatMenu
                resultCount={totalFiltered}
                itemSingular="unidade"
                itemPlural="unidades"
                onSelect={handleExport}
              />
              {canInsert ? (
                <button
                  type="button"
                  onClick={newUbtDrawer.openDrawer}
                  className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Nova UBT
                </button>
              ) : null}
            </div>
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
                placeholder="Buscar por nome da UBT, CNES ou região..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
              />
            </label>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <CustomSelect
                value={regionFilter}
                onChange={(value) => {
                  setRegionFilter(value)
                  setPage(1)
                }}
                options={regionFilterOptions}
                className="w-full min-w-[12.5rem] sm:w-[12.5rem]"
                menuMinWidthPx={220}
              />
              <CustomSelect
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value)
                  setPage(1)
                }}
                options={statusFilterOptions}
                className="w-full min-w-[13rem] sm:w-[13rem]"
                menuMinWidthPx={220}
              />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3.5 text-left sm:px-6">Unidade</th>
                <th className="px-3 py-3.5 text-center">CNES</th>
                <th className="px-3 py-3.5 text-center">Região</th>
                <th className="px-3 py-3.5 text-center">Responsável</th>
                <th className="px-3 py-3.5 text-center">Terminais</th>
                <th className="px-3 py-3.5 text-center">Status</th>
                <th className="px-3 py-3.5 text-center sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pageUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6">
                    Nenhuma UBT encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : null}
              {pageUnits.map((unit) => {
                const stationsLabel =
                  unit.stationsOnline === unit.stationsTotal
                    ? `${unit.stationsTotal} / ${unit.stationsTotal} online`
                    : `${unit.stationsOnline} / ${unit.stationsTotal} online`

                return (
                  <tr
                    key={unit.id}
                    className="text-gray-800 transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-bold text-gray-900">{unit.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{unit.address}</p>
                    </td>
                    <td className="px-3 py-4 text-center font-mono text-xs text-gray-700">
                      {unit.cnes}
                    </td>
                    <td className="px-3 py-4 text-center text-xs text-gray-600">{unit.region}</td>
                    <td className="px-3 py-4 text-center">
                      <p className="text-xs font-semibold text-gray-800">{unit.responsibleName}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{unit.responsiblePhone}</p>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <p className="text-sm font-bold tabular-nums text-gray-900">
                        {unit.stationsTotal}
                      </p>
                      <p
                        className={[
                          'mt-0.5 text-[11px] font-semibold',
                          unit.stationsOnline === unit.stationsTotal
                            ? 'text-emerald-600'
                            : unit.stationsOnline === 0
                              ? 'text-red-500'
                              : 'text-amber-600',
                        ].join(' ')}
                      >
                        {stationsLabel}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center">
                        <SituationStatusBadge
                          config={prefeituraRedeStatusBadgeConfig[unit.status]}
                          widthClass="w-[6.5rem]"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center sm:px-6">
                      <PrefeituraRedeUnitActionsMenu
                        unit={unit}
                        open={unitActions.openMenuUnitId === unit.id}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onToggle={() => unitActions.toggleMenu(unit.id)}
                        onClose={unitActions.closeMenu}
                        onAction={(action) => unitActions.handleUnitAction(unit, action)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-gray-500">
            {totalFiltered === 0
              ? 'Nenhuma unidade na lista filtrada'
              : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(totalFiltered)} unidades`}
          </p>
          <nav className="flex items-center gap-1" aria-label="Paginação da rede">
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

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={dismissToast}
      />
    </section>
  )
}
