import { useMemo } from 'react'
import { formatPrefeituraNumber } from './prefeituraDashboardUi'
import type { PrefeituraHourlyPoint } from '../../utils/prefeituraDashboardFilters'
import {
  chartStaggerDelay,
  PREF_CHART_EASE,
  usePrefeituraChartAnimation,
} from './prefeituraChartAnimation'

const WIDTH = 400
const HEIGHT = 104

type PrefeituraHourlyChartProps = {
  data: PrefeituraHourlyPoint[]
  animationKey: string
}

export function PrefeituraHourlyChart({ data, animationKey }: PrefeituraHourlyChartProps) {
  const animate = usePrefeituraChartAnimation(120, animationKey)

  const { areaPath, linePath, peak, points } = useMemo(() => {
    if (data.length === 0) {
      return { areaPath: '', linePath: '', peak: { hour: '—', value: 0, x: 0, y: 0 }, points: [] }
    }

    const max = Math.max(...data.map((d) => d.value), 1)
    const padding = { top: 12, right: 12, bottom: 22, left: 12 }
    const chartW = WIDTH - padding.left - padding.right
    const chartH = HEIGHT - padding.top - padding.bottom
    const baseline = padding.top + chartH

    const pts = data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW
      const y = padding.top + chartH - (d.value / max) * chartH
      return { ...d, x, y }
    })

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = [
      `M ${pts[0].x} ${baseline}`,
      ...pts.map((p) => `L ${p.x} ${p.y}`),
      `L ${pts[pts.length - 1].x} ${baseline}`,
      'Z',
    ].join(' ')

    const peakPoint = pts.reduce((best, p) => (p.value > best.value ? p : best), pts[0])

    return {
      areaPath: area,
      linePath: line,
      peak: peakPoint,
      points: pts,
    }
  }, [data])

  const clipWidth = animate ? WIDTH : 0
  const svgIds = useMemo(() => {
    const slug = animationKey.replace(/[^a-z0-9]+/gi, '-')
    return {
      fill: `pref-hourly-fill-${slug}`,
      clip: `pref-hourly-clip-${slug}`,
    }
  }, [animationKey])

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Sem consultas no recorte selecionado
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-0 w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Gráfico de consultas por hora na rede"
      >
        <defs>
          <linearGradient id={svgIds.fill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
          <clipPath id={svgIds.clip}>
            <rect
              key={animationKey}
              x="0"
              y="0"
              height={HEIGHT}
              width={clipWidth}
              style={{ transition: `width 1.1s ${PREF_CHART_EASE}` }}
            />
          </clipPath>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={12}
            x2={WIDTH - 12}
            y1={16 + (HEIGHT - 44) * ratio}
            y2={16 + (HEIGHT - 44) * ratio}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        <g
          key={animationKey}
          clipPath={`url(#${svgIds.clip})`}
          style={{
            opacity: animate ? 1 : 0,
            transition: `opacity 0.35s ${PREF_CHART_EASE}`,
          }}
        >
          <path d={areaPath} fill={`url(#${svgIds.fill})`} />
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={peak.x}
            cy={peak.y}
            r="5"
            fill="#2563eb"
            stroke="white"
            strokeWidth="2"
            style={{
              opacity: animate ? 1 : 0,
              transition: `opacity 0.4s ${PREF_CHART_EASE} 0.7s`,
            }}
          />
        </g>

        {points.map((p, index) => (
          <text
            key={p.hour}
            x={p.x}
            y={HEIGHT - 5}
            textAnchor="middle"
            className="fill-gray-400"
            style={{
              fontSize: 6,
              fontWeight: 600,
              opacity: animate ? 1 : 0,
              transition: `opacity 0.4s ${PREF_CHART_EASE} ${chartStaggerDelay(index, 0.05)}`,
            }}
          >
            {p.hour}
          </text>
        ))}
      </svg>

      <div
        className="pointer-events-none absolute rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1 text-xs font-bold text-gray-800 shadow-md backdrop-blur-sm"
        style={{
          left: `${(peak.x / WIDTH) * 100}%`,
          top: `${Math.max(8, (peak.y / HEIGHT) * 100 - 18)}%`,
          transform: 'translateX(-50%)',
          opacity: animate ? 1 : 0,
          transition: `opacity 0.45s ${PREF_CHART_EASE} 0.8s`,
        }}
      >
        Pico {peak.hour} · {formatPrefeituraNumber(peak.value)}
      </div>
    </div>
  )
}
