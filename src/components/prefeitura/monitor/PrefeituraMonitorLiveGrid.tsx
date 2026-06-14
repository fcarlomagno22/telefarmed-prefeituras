import { RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  monitorStationLegend,
  type MonitorLiveGridRow,
} from '../../../types/prefeituraMonitor'
import { CustomSelect } from '../../ui/CustomSelect'
import { DashCard } from '../prefeituraDashboardUi'
import { monitorCardTableScrollClass, monitorTableHeadStickyClass } from './monitorTableScroll'

const metricPillClass: Record<'free' | 'busy' | 'queue' | 'consultation', string> = {
  free: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  busy: 'bg-orange-50 text-orange-800 ring-orange-100',
  queue: 'bg-violet-50 text-violet-800 ring-violet-100',
  consultation: 'bg-sky-50 text-sky-800 ring-sky-100',
}

function MetricPill({ value, tone }: { value: number; tone: keyof typeof metricPillClass }) {
  return (
    <span
      className={[
        'inline-flex min-w-[2.25rem] justify-center rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ring-1 ring-inset',
        metricPillClass[tone],
      ].join(' ')}
    >
      {value}
    </span>
  )
}

function UnitStatusCell({ row }: { row: MonitorLiveGridRow }) {
  if (row.status === 'manutencao') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
        Manutenção
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      Ativa
    </span>
  )
}

type PrefeituraMonitorLiveGridProps = {
  className?: string
  rows: MonitorLiveGridRow[]
  region: string
  onRegionChange: (value: string) => void
  regionOptions: Array<{ value: string; label: string }>
  onRefresh: () => void
}

const REFRESH_MS = 900

export function PrefeituraMonitorLiveGrid({
  className = '',
  rows,
  region,
  onRegionChange,
  regionOptions,
  onRefresh,
}: PrefeituraMonitorLiveGridProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return
    setIsRefreshing(true)
    void onRefresh()
    window.setTimeout(() => setIsRefreshing(false), REFRESH_MS)
  }, [isRefreshing, onRefresh])

  const filteredRows = useMemo(() => {
    if (region === 'todas') return rows
    return rows.filter((row) => row.regionKey === region)
  }, [region, rows])

  return (
    <DashCard
      fillHeight
      className={className}
      title="Grade ao vivo"
      subtitle="Status operacional das UBTs em tempo real."
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      action={
        <div className="flex items-center gap-2">
          <div className="w-[8.5rem]">
            <CustomSelect
              value={region}
              onChange={onRegionChange}
              options={regionOptions}
              menuMinWidthPx={160}
            />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[var(--brand-primary)]/30 hover:text-[var(--brand-primary)] disabled:opacity-60"
            aria-label="Atualizar grade ao vivo"
          >
            <RefreshCw
              className={['h-4 w-4', isRefreshing ? 'animate-spin' : ''].join(' ')}
              strokeWidth={2}
            />
          </button>
        </div>
      }
    >
      <div className={monitorCardTableScrollClass}>
        <table className="w-full min-w-[640px] table-fixed text-sm">
          <thead className={monitorTableHeadStickyClass}>
            <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-[28%] px-4 py-3 text-left">Unidade</th>
              <th className="w-[14%] px-4 py-3 text-center">Livres</th>
              <th className="w-[14%] px-4 py-3 text-center">Ocupados</th>
              <th className="w-[14%] px-4 py-3 text-center">Fila</th>
              <th className="w-[16%] px-4 py-3 text-center">Em consulta</th>
              <th className="w-[14%] px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                  Nenhuma UBT no recorte selecionado
                </td>
              </tr>
            ) : null}
            {filteredRows.map((row) => (
              <tr key={row.id} className="text-gray-800 transition hover:bg-slate-50/80">
                <td className="px-4 py-3 text-left font-semibold text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-center">
                  <MetricPill value={row.freeStations} tone="free" />
                </td>
                <td className="px-4 py-3 text-center">
                  <MetricPill value={row.busyStations} tone="busy" />
                </td>
                <td className="px-4 py-3 text-center">
                  <MetricPill value={row.queuePatients} tone="queue" />
                </td>
                <td className="px-4 py-3 text-center">
                  <MetricPill value={row.inConsultation} tone="consultation" />
                </td>
                <td className="px-4 py-3 text-center">
                  <UnitStatusCell row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 px-4 py-3">
        {monitorStationLegend.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className={['h-2 w-2 rounded-full', item.dotClass].join(' ')} aria-hidden />
            {item.label}
          </span>
        ))}
      </div>
    </DashCard>
  )
}
