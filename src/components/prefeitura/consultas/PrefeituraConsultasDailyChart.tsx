import { useMemo } from 'react'
import type { PrefeituraConsultasDailyPoint } from '../../../data/prefeituraConsultasMock'
import { formatPrefeituraNumber } from '../prefeituraDashboardUi'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from '../prefeituraChartAnimation'

const WIDTH = 280
const HEIGHT = 96

type PrefeituraConsultasDailyChartProps = {
  data: PrefeituraConsultasDailyPoint[]
  periodTotal: number
  animationKey?: string
}

export function PrefeituraConsultasDailyChart({
  data,
  periodTotal,
  animationKey = 'consultas-daily',
}: PrefeituraConsultasDailyChartProps) {
  const animate = usePrefeituraChartAnimation(120, animationKey)

  const { areaPath, linePath, labels, yTicks } = useMemo(() => {
    if (data.length === 0) {
      return { areaPath: '', linePath: '', labels: [], yTicks: [] as number[] }
    }

    const max = Math.max(...data.map((point) => point.value), 1)
    const yMax = Math.ceil(max / 100) * 100 || 800
    const padding = { top: 10, right: 8, bottom: 26, left: 28 }
    const chartW = WIDTH - padding.left - padding.right
    const chartH = HEIGHT - padding.top - padding.bottom
    const baseline = padding.top + chartH

    const pts = data.map((point, index) => {
      const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartW
      const y = padding.top + chartH - (point.value / yMax) * chartH
      return { ...point, x, y }
    })

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = [
      `M ${pts[0].x} ${baseline}`,
      ...pts.map((p) => `L ${p.x} ${p.y}`),
      `L ${pts[pts.length - 1].x} ${baseline}`,
      'Z',
    ].join(' ')

    const hourLabels = pts.map((p) => ({ label: p.label, x: p.x }))
    const ticks = [0, yMax / 2, yMax]

    return { areaPath: area, linePath: line, labels: hourLabels, yTicks: ticks }
  }, [data])

  const clipWidth = animate ? WIDTH : 0

  return (
    <div className="flex flex-col">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-[6rem] w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Gráfico de consultas por dia no período"
      >
        {yTicks.map((tick) => {
          const y =
            10 +
            (HEIGHT - 36) -
            (tick / Math.max(yTicks[yTicks.length - 1], 1)) * (HEIGHT - 36)
          return (
            <g key={tick}>
              <line
                x1={28}
                x2={WIDTH - 8}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text x={4} y={y + 3} className="fill-gray-400 text-[8px] font-medium">
                {tick}
              </text>
            </g>
          )
        })}
        <defs>
          <linearGradient id="pref-consultas-daily-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
          <clipPath id="pref-consultas-daily-clip">
            <rect x={0} y={0} width={clipWidth} height={HEIGHT} />
          </clipPath>
        </defs>
        <g clipPath="url(#pref-consultas-daily-clip)">
          <path d={areaPath} fill="url(#pref-consultas-daily-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {labels.map((label) => (
          <text
            key={label.label}
            x={label.x}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-gray-400 text-[9px] font-medium"
          >
            {label.label}
          </text>
        ))}
      </svg>

      <p
        className="mt-2 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-center text-[11px] font-semibold text-sky-800"
        style={{
          opacity: animate ? 1 : 0.6,
          transition: `opacity 0.45s ${PREF_CHART_EASE}`,
        }}
      >
        Total no período: {formatPrefeituraNumber(periodTotal)}
      </p>
    </div>
  )
}
