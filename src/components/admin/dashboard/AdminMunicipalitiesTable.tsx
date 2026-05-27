import { Building2, ChevronRight, Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  getAdminMunicipalityStateFilterOptions,
  type AdminMunicipalityRow,
} from '../../../data/adminDashboardMock'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  DashCard,
  DashLinkAction,
  prefeituraSlaBadgeConfig,
} from '../../prefeitura/prefeituraDashboardUi'
import {
  adminHealthDotClass,
  adminHealthLabels,
  formatAdminNumber,
} from './adminDashboardUi'

type AdminMunicipalitiesTableProps = {
  rows: AdminMunicipalityRow[]
  onOpenRow: (row: AdminMunicipalityRow) => void
  onOpenAll?: () => void
}

const contractLabels = {
  active: 'Ativo',
  expiring: 'Vencendo',
  suspended: 'Suspenso',
} as const

export function AdminMunicipalitiesTable({
  rows,
  onOpenRow,
  onOpenAll,
}: AdminMunicipalitiesTableProps) {
  const [stateFilter, setStateFilter] = useState('all')

  const stateOptions = useMemo(() => getAdminMunicipalityStateFilterOptions(rows), [rows])

  const filteredRows = useMemo(() => {
    if (stateFilter === 'all') return rows
    return rows.filter((row) => row.stateKey === stateFilter)
  }, [rows, stateFilter])

  const selectedStateLabel =
    stateOptions.find((option) => option.value === stateFilter)?.label ?? 'Todos os estados'

  return (
    <DashCard
      className="w-full min-w-0 xl:col-span-12"
      title="Municípios contratados"
      subtitle="Semáforo operacional · clique para drill-down"
      bodyClassName="p-0"
      action={
        onOpenAll ? (
          <DashLinkAction onClick={onOpenAll}>
            Ver mapa/lista
            <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
          </DashLinkAction>
        ) : null
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-slate-50/50 px-4 py-3">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-800">{filteredRows.length}</span> de{' '}
          <span className="font-semibold text-gray-800">{rows.length}</span> município
          {rows.length === 1 ? '' : 's'}
          {stateFilter !== 'all' ? (
            <span className="text-gray-400"> · {selectedStateLabel}</span>
          ) : null}
        </p>
        <div className="flex min-w-0 items-center sm:shrink-0">
          <CustomSelect
            value={stateFilter}
            onChange={setStateFilter}
            options={stateOptions}
            className="min-w-[10rem] py-2.5 text-sm sm:min-w-[12rem]"
            menuMinWidthPx={240}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Semáforo</th>
              <th className="px-4 py-3">Município</th>
              <th className="px-4 py-3 text-center">UF</th>
              <th className="px-4 py-3 text-center">Contrato</th>
              <th className="px-4 py-3 text-center">Hoje</th>
              <th className="px-4 py-3 text-center">Pacote</th>
              <th className="px-4 py-3 text-center">Terminais</th>
              <th
                className="px-4 py-3 text-center"
                title="Incidentes da operação Telefarmed em aberto"
              >
                Incidentes
              </th>
              <th className="px-4 py-3 text-center">SLA</th>
              <th className="px-4 py-3 text-center">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-500">
                  {stateFilter === 'all'
                    ? 'Nenhum município contratado'
                    : `Nenhum município em ${selectedStateLabel}`}
                </td>
              </tr>
            ) : null}
            {filteredRows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer text-gray-800 transition hover:bg-slate-50/80"
                onClick={() => onOpenRow(row)}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={[
                        'h-2.5 w-2.5 shrink-0 rounded-full',
                        adminHealthDotClass[row.health],
                      ].join(' ')}
                      aria-hidden
                    />
                    <span className="text-xs font-semibold text-gray-700">
                      {adminHealthLabels[row.health]}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-semibold text-gray-900">
                    <Building2 className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.75} />
                    {row.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-600">{row.state}</td>
                <td className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                  {contractLabels[row.contractStatus]}
                </td>
                <td className="px-4 py-3 text-center text-xs font-bold tabular-nums">
                  {formatAdminNumber(row.consultationsToday)}
                </td>
                <td className="px-4 py-3 text-center text-xs font-bold tabular-nums">
                  {row.packageUsagePercent}%
                </td>
                <td className="px-4 py-3 text-center text-xs tabular-nums">
                  <span className="font-bold text-emerald-700">{row.terminalsOnline}</span>
                  <span className="text-gray-400"> / {row.terminalsTotal}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {row.openNocCount > 0 ? (
                    <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      {row.openNocCount}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <SituationStatusBadge
                      config={prefeituraSlaBadgeConfig[row.sla]}
                      widthClass="w-[5.5rem]"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenRow(row)
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                      aria-label={`Ver detalhes de ${row.name}`}
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashCard>
  )
}
