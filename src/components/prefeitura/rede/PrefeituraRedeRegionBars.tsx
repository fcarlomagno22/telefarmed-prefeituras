import { useMemo } from 'react'
import type { DonutSlice } from '../../credenciais/CredentialDonutChart'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from '../prefeituraChartAnimation'

type PrefeituraRedeRegionBarsProps = {
  slices: DonutSlice[]
}

function formatPercent(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

export function PrefeituraRedeRegionBars({ slices }: PrefeituraRedeRegionBarsProps) {
  const sliceKey = slices.map((s) => `${s.key}:${s.count}`).join('|')
  const animate = usePrefeituraChartAnimation(180, sliceKey)

  const sorted = useMemo(
    () => [...slices].sort((a, b) => b.count - a.count),
    [slices],
  )

  const total = sorted.reduce((sum, slice) => sum + slice.count, 0)
  const max = Math.max(...sorted.map((slice) => slice.count), 1)

  return (
    <ul className="mt-4 space-y-2.5">
      {sorted.map((slice, index) => {
        const widthPercent = max > 0 ? (slice.count / max) * 100 : 0
        const sharePercent = formatPercent(slice.count, total)

        return (
          <li key={slice.key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 font-semibold text-gray-800">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${slice.gradientFrom}, ${slice.gradientTo})`,
                  }}
                  aria-hidden
                />
                <span className="truncate">{slice.label}</span>
              </span>
              <span
                className="shrink-0 font-bold tabular-nums text-gray-600 transition-opacity duration-500"
                style={{
                  opacity: animate ? 1 : 0,
                  transitionDelay: `${0.2 + index * 0.08}s`,
                }}
              >
                {slice.count}{' '}
                <span className="font-medium text-gray-500">({sharePercent}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: animate ? `${Math.max(6, widthPercent)}%` : '0%',
                  background: `linear-gradient(90deg, ${slice.gradientFrom}99, ${slice.gradientTo})`,
                  transition: `width 0.9s ${PREF_CHART_EASE} ${index * 0.1}s`,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
