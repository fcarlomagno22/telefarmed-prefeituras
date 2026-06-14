import { useMemo } from 'react'
import type { MonitorTimelineSeries } from '../../../types/prefeituraMonitor'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from '../prefeituraChartAnimation'

const WIDTH = 400
const HEIGHT = 140

type PrefeituraMonitorTimelineChartProps = {
  animationKey: string
  hours: string[]
  series: MonitorTimelineSeries[]
}

export function PrefeituraMonitorTimelineChart({
  animationKey,
  hours,
  series,
}: PrefeituraMonitorTimelineChartProps) {
  const animate = usePrefeituraChartAnimation(120, animationKey)

  const { paths, labels } = useMemo(() => {
    const padding = { top: 14, right: 8, bottom: 24, left: 8 }
    const chartW = WIDTH - padding.left - padding.right
    const chartH = HEIGHT - padding.top - padding.bottom
    const pointCount = hours.length
    const globalMax = Math.max(...series.flatMap((s) => s.values), 1)

    const seriesPaths = series.map((item) => {
      const pts = item.values.map((value, i) => {
        const x = padding.left + (i / Math.max(pointCount - 1, 1)) * chartW
        const y = padding.top + chartH - (value / globalMax) * chartH
        return { x, y }
      })
      const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      return { ...item, line, pts }
    })

    const hourLabels = hours.map((hour, i) => {
      const x = padding.left + (i / Math.max(pointCount - 1, 1)) * chartW
      return { hour, x }
    })

    return { paths: seriesPaths, labels: hourLabels }
  }, [hours, series])

  const ariaSummary = series.map((s) => s.unitName).join(', ')

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-[8.75rem] w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Atendimentos por hora. ${ariaSummary}`}
      >
        {paths.map((item, seriesIndex) => (
          <path
            key={item.unitId}
            d={item.line}
            fill="none"
            stroke={item.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: animate ? 0 : 1,
              opacity: animate ? 1 : 0.35,
              transition: `stroke-dashoffset 1.1s ${PREF_CHART_EASE} ${seriesIndex * 0.08}s, opacity 0.4s ease`,
            }}
          />
        ))}
        {labels.map((label) => (
          <text
            key={label.hour}
            x={label.x}
            y={HEIGHT - 6}
            textAnchor="middle"
            className="fill-gray-400 text-[9px] font-medium"
          >
            {label.hour}
          </text>
        ))}
      </svg>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sumário</p>
        <ul className="mt-1.5 grid grid-flow-col grid-rows-4 gap-x-4 gap-y-1.5">
          {series.map((item) => (
            <li
              key={item.unitId}
              className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-gray-800"
            >
              <span
                className="inline-block h-0.5 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="min-w-0 truncate" title={item.unitName}>
                {item.unitName}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
