import { useMemo } from 'react'
import type { PrefeituraSpecialtyStat } from '../../data/prefeituraSpecialtyStats'
import { formatPrefeituraNumber } from './prefeituraDashboardUi'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from './prefeituraChartAnimation'

const TOP_COUNT = 8

function shortenLabel(label: string) {
  return label
    .replace(' e Traumatologia', ' e Traum.')
    .replace('Pediátrica', 'Ped.')
    .replace('Orientação Nutricional', 'Nutrição')
    .replace('Ginecologia e Obstetrícia', 'Gineco-Obst.')
}

type PrefeituraSpecialtyBreakdownProps = {
  stats: PrefeituraSpecialtyStat[]
  total: number
  animationKey: string
}

export function PrefeituraSpecialtyBreakdown({
  stats,
  total,
  animationKey,
}: PrefeituraSpecialtyBreakdownProps) {
  const animate = usePrefeituraChartAnimation(160, animationKey)

  const top = useMemo(
    () => [...stats].sort((a, b) => b.count - a.count).slice(0, TOP_COUNT),
    [stats],
  )

  const maxCount = Math.max(...top.map((item) => item.count), 1)
  const topSum = top.reduce((sum, item) => sum + item.count, 0)
  const topSharePercent = total > 0 ? Math.round((topSum / total) * 100) : 0
  const remainingCount = Math.max(0, stats.filter((s) => s.count > 0).length - top.length)

  if (total === 0 || top.length === 0) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-gray-500">
        Nenhuma consulta no recorte selecionado
      </p>
    )
  }

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
            Total no período
          </p>
          <p className="text-lg font-bold tabular-nums leading-tight text-gray-900">
            {formatPrefeituraNumber(total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold text-gray-500">Top {top.length}</p>
          <p className="text-sm font-bold tabular-nums text-[var(--brand-primary)]">
            {topSharePercent}%
          </p>
        </div>
      </div>

      <ul
        className="grid min-h-0 flex-1 gap-1"
        style={{ gridTemplateRows: `repeat(${top.length}, minmax(0, 1fr))` }}
      >
        {top.map((item, index) => {
          const widthPercent = Math.max(10, (item.count / maxCount) * 100)
          const sharePercent = total > 0 ? Math.round((item.count / total) * 100) : 0

          return (
            <li key={item.key} className="flex min-h-0 items-center gap-2">
              <span
                className="w-[32%] min-w-0 truncate text-[11px] font-semibold leading-tight text-gray-800"
                title={item.label}
              >
                {shortenLabel(item.label)}
              </span>
              <div className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  key={`${animationKey}-${item.key}`}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: animate ? `${widthPercent}%` : '0%',
                    background: `linear-gradient(90deg, ${item.color}aa, ${item.color})`,
                    opacity: item.available ? 1 : 0.45,
                    transition: `width 0.75s ${PREF_CHART_EASE} ${index * 0.04}s`,
                  }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-[10px] font-bold leading-none text-gray-700">
                <span className="block tabular-nums">{formatPrefeituraNumber(item.count)}</span>
                <span className="text-[9px] font-semibold text-gray-400">{sharePercent}%</span>
              </span>
            </li>
          )
        })}
      </ul>

      {remainingCount > 0 ? (
        <p className="shrink-0 text-center text-[10px] font-medium text-gray-400">
          +{remainingCount} especialidades fora do top {TOP_COUNT}
        </p>
      ) : null}
    </div>
  )
}
