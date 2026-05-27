import { RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  monitorLiveGridRows,
  monitorRegionFilterOptions,
  monitorStationLegend,
  type MonitorLiveGridRow,
} from '../../../data/prefeituraMonitorMock'
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
}

const REFRESH_MS = 900

export function PrefeituraMonitorLiveGrid({ className = '' }: PrefeituraMonitorLiveGridProps) {
  const [region, setRegion] = useState('todas')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return
    setIsRefreshing(true)
    window.setTimeout(() => {
      setRefreshKey((key) => key + 1)
      setIsRefreshing(false)
    }, REFRESH_MS)
  }, [isRefreshing])

  const rows = useMemo(() => {
    if (region === 'todas') return monitorLiveGridRows
    return monitorLiveGridRows.filter((row) => row.regionKey === region)
  }, [region])

  return (
    <DashCard
      fillHeight
      className={className}
      title="Grade ao vivo"
      subtitle="Visão geral da ocupação e fluxo por unidade básica de teleatendimento."
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      action={
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[11rem]">
            <CustomSelect
              value={region}
              onChange={setRegion}
              options={[...monitorRegionFilterOptions]}
              menuMinWidthPx={180}
            />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar grade ao vivo"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-[var(--brand-primary)] disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[var(--brand-primary)]' : ''}`}
              strokeWidth={2}
            />
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 px-4 py-2.5">
        {monitorStationLegend.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
            <span className={`h-2 w-2 rounded-full ${item.dotClass}`} aria-hidden />
            {item.label}
          </span>
        ))}
      </div>

      <div
        key={refreshKey}
        className={[
          monitorCardTableScrollClass,
          'transition-opacity duration-300',
          isRefreshing ? 'opacity-50' : 'opacity-100',
        ].join(' ')}
      >
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={monitorTableHeadStickyClass}>
            <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Unidade</th>
              <th className="px-4 py-3 text-center">Terminais livres</th>
              <th className="px-4 py-3 text-center">Terminais ocupados</th>
              <th className="px-4 py-3 text-center">Pacientes na fila</th>
              <th className="px-4 py-3 text-center">Em consulta</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  Nenhuma unidade no recorte selecionado
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id} className="text-gray-800 transition hover:bg-slate-50/80">
                <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
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
    </DashCard>
  )
}
