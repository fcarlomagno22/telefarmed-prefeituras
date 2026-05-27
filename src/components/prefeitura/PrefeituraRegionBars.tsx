import { useMemo } from 'react'
import type { PrefeituraRegionVolume } from '../../utils/prefeituraDashboardFilters'
import { formatPrefeituraNumber } from './prefeituraDashboardUi'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from './prefeituraChartAnimation'

type PrefeituraRegionBarsProps = {
  regions: PrefeituraRegionVolume[]
  animationKey: string
}

export function PrefeituraRegionBars({ regions, animationKey }: PrefeituraRegionBarsProps) {
  const animate = usePrefeituraChartAnimation(180, animationKey)

  const sorted = useMemo(
    () => [...regions].sort((a, b) => b.value - a.value),
    [regions],
  )

  const total = sorted.reduce((sum, r) => sum + r.value, 0)
  const max = Math.max(...sorted.map((r) => r.value), 1)
  const leader = sorted[0]

  if (sorted.length === 0 || total === 0) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-gray-500">
        Nenhum volume regional no recorte
      </p>
    )
  }

  const leaderSharePercent = Math.round((leader.value / total) * 100)

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div
        className="flex shrink-0 items-center justify-between gap-2 rounded-xl border border-gray-100 bg-slate-50/90 px-3 py-2"
        style={{
          opacity: animate ? 1 : 0,
          transition: `opacity 0.4s ${PREF_CHART_EASE}`,
        }}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Volume no recorte
          </p>
          <p className="text-lg font-bold tabular-nums leading-tight text-gray-900">
            {formatPrefeituraNumber(total)}
          </p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[10px] font-semibold text-gray-500">Maior RA</p>
          <p className="truncate text-xs font-bold text-[var(--brand-primary)]">
            {leader.label.replace('RA ', '')} · {leaderSharePercent}%
          </p>
        </div>
      </div>

      <ul
        className="grid min-h-0 flex-1 gap-1.5"
        style={{ gridTemplateRows: `repeat(${sorted.length}, minmax(0, 1fr))` }}
      >
        {sorted.map((region, index) => {
          const widthPercent = max > 0 ? (region.value / max) * 100 : 0
          const sharePercent = total > 0 ? Math.round((region.value / total) * 100) : 0

          return (
            <li key={region.key} className="flex min-h-0 flex-col justify-center gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-semibold text-gray-800">
                  {region.label}
                </span>
                <span className="shrink-0 text-[10px] font-bold tabular-nums text-gray-600">
                  {sharePercent}%
                </span>
              </div>
              <div className="relative min-h-[1.35rem] flex-1 overflow-hidden rounded-lg bg-gray-100">
                <div
                  key={`${animationKey}-${region.key}`}
                  className="absolute inset-y-0 left-0 rounded-lg"
                  style={{
                    width: animate ? `${widthPercent}%` : '0%',
                    background: `linear-gradient(90deg, ${region.gradientFrom}, ${region.gradientTo})`,
                    transition: `width 0.85s ${PREF_CHART_EASE} ${index * 0.08}s`,
                  }}
                />
                <span
                  className="relative z-10 flex h-full min-h-[1.35rem] items-center px-2 text-[10px] font-bold tabular-nums text-white drop-shadow-sm"
                  style={{
                    opacity: animate ? 1 : 0,
                    transition: `opacity 0.4s ${PREF_CHART_EASE} ${0.25 + index * 0.08}s`,
                  }}
                >
                  {formatPrefeituraNumber(region.value)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="shrink-0 text-center text-[10px] font-medium text-gray-400">
        {sorted.length} região{sorted.length === 1 ? '' : 'ões'} no recorte
      </p>
    </div>
  )
}
