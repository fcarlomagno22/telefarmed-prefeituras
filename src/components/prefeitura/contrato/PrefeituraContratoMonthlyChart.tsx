import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { PrefeituraContratoMonthlyRow } from '../../../data/prefeituraContratoMock'
import { formatPrefeituraNumber } from '../prefeituraDashboardUi'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from '../prefeituraChartAnimation'

const CHART_HEIGHT = 236
const BAR_MODE_MAX_MONTHS = 10
const GROUP_GAP = 8
const BAR_GAP = 5
const MAX_X_LABELS = 8

type PrefeituraContratoMonthlyChartProps = {
  rows: PrefeituraContratoMonthlyRow[]
  animationKey?: string
  monthlyPackageLabel?: string
}

function resolveLabelStep(rowCount: number) {
  return Math.max(1, Math.ceil(rowCount / MAX_X_LABELS))
}

function buildYScale(rows: PrefeituraContratoMonthlyRow[]) {
  const max = Math.max(...rows.flatMap((row) => [row.contracted, row.performed]), 1)
  const yMax = Math.ceil(max / 500) * 500 || 3500
  return { yMax, yTicks: [0, yMax / 2, yMax] as number[] }
}

function monthUsagePercent(row: PrefeituraContratoMonthlyRow) {
  return Math.min(100, Math.round((row.performed / row.contracted) * 100))
}

function ContratoChartTooltip({
  row,
  position,
}: {
  row: PrefeituraContratoMonthlyRow
  position: { leftPercent: number; topPercent: number }
}) {
  const usage = monthUsagePercent(row)

  const style: CSSProperties = {
    left: `${position.leftPercent}%`,
    top: `${position.topPercent}%`,
  }

  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+12px)]"
      style={style}
      role="tooltip"
    >
      <div className="min-w-[11rem] rounded-xl border border-gray-200/90 bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <p className="text-[11px] font-bold text-gray-900">{row.label}</p>
        <dl className="mt-2 space-y-1 text-[11px] text-gray-600">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[var(--brand-primary)]" aria-hidden />
              Contratadas
            </dt>
            <dd className="font-bold tabular-nums text-gray-900">
              {formatPrefeituraNumber(row.contracted)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-blue-500" aria-hidden />
              Realizadas
            </dt>
            <dd className="font-bold tabular-nums text-gray-900">
              {formatPrefeituraNumber(row.performed)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-1">
            <dt>Uso do pacote</dt>
            <dd className="font-semibold tabular-nums text-gray-800">{usage}%</dd>
          </div>
          {row.avulsoCount > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-red-600">Avulsas</dt>
              <dd className="font-bold tabular-nums text-red-600">
                {formatPrefeituraNumber(row.avulsoCount)}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  )
}

function ChartLegend({ mode }: { mode: 'bars' | 'lines' }) {
  return (
    <div className="pointer-events-none absolute right-2 top-1 flex flex-wrap items-center justify-end gap-3 text-[11px] font-semibold text-gray-600">
      <span className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2 py-0.5 shadow-sm ring-1 ring-gray-200/80">
        {mode === 'lines' ? (
          <span className="h-0 w-4 border-t-2 border-dashed border-[var(--brand-primary)]" aria-hidden />
        ) : (
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-primary)]" aria-hidden />
        )}
        Contratadas
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2 py-0.5 shadow-sm ring-1 ring-gray-200/80">
        {mode === 'lines' ? (
          <span className="h-0.5 w-4 rounded-full bg-blue-500" aria-hidden />
        ) : (
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" aria-hidden />
        )}
        Realizadas
      </span>
    </div>
  )
}

function YAxisGrid({
  yTicks,
  yMax,
  padding,
  svgWidth,
}: {
  yTicks: number[]
  yMax: number
  padding: { top: number; right: number; bottom: number; left: number }
  svgWidth: number
}) {
  const chartH = CHART_HEIGHT - padding.top - padding.bottom

  return (
    <>
      {yTicks.map((tick) => {
        const y = padding.top + chartH - (tick / Math.max(yMax, 1)) * chartH

        return (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={svgWidth - padding.right}
              y1={y}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 6}
              y={y + 4}
              textAnchor="end"
              className="fill-gray-400 text-[10px] font-medium"
            >
              {tick >= 1000 ? `${tick / 1000}k` : tick}
            </text>
          </g>
        )
      })}
    </>
  )
}

function ContratoMonthlyBarChart({
  rows,
  containerWidth,
  animate,
}: {
  rows: PrefeituraContratoMonthlyRow[]
  containerWidth: number
  animate: boolean
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const layout = useMemo(() => {
    const padding = { top: 20, right: 12, bottom: 32, left: 44 }
    const svgWidth = Math.max(containerWidth || 320, 320)
    const chartW = svgWidth - padding.left - padding.right
    const chartH = CHART_HEIGHT - padding.top - padding.bottom
    const baseline = padding.top + chartH
    const { yMax, yTicks } = buildYScale(rows)
    const groupWidth = (chartW - GROUP_GAP * (rows.length - 1)) / rows.length
    const barWidth = Math.max(8, (groupWidth - BAR_GAP) / 2)
    const labelStep = resolveLabelStep(rows.length)
    const scaleY = animate ? 1 : 0

    const bars = rows.map((row, index) => {
      const groupX = padding.left + index * (groupWidth + GROUP_GAP)
      const contractedH = (row.contracted / yMax) * chartH
      const performedH = (row.performed / yMax) * chartH
      const topY = baseline - Math.max(contractedH, performedH)

      return {
        row,
        label: row.label,
        showLabel: index % labelStep === 0 || index === rows.length - 1,
        hit: {
          x: groupX,
          y: topY,
          w: groupWidth,
          h: baseline - topY,
        },
        tooltip: {
          leftPercent: ((groupX + groupWidth / 2) / svgWidth) * 100,
          topPercent: (topY / CHART_HEIGHT) * 100,
        },
        contracted: {
          x: groupX,
          y: baseline - contractedH,
          h: contractedH,
          w: barWidth,
        },
        performed: {
          x: groupX + barWidth + BAR_GAP,
          y: baseline - performedH,
          h: performedH,
          w: barWidth,
        },
        labelX: groupX + groupWidth / 2,
      }
    })

    return { bars, yTicks, yMax, svgWidth, padding, scaleY }
  }, [rows, containerWidth, animate])

  const hoveredBar = hoveredIndex !== null ? layout.bars[hoveredIndex] : null

  return (
    <div
      className="relative h-[240px] w-full"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {hoveredBar ? (
        <ContratoChartTooltip row={hoveredBar.row} position={hoveredBar.tooltip} />
      ) : null}
      <svg
        viewBox={`0 0 ${layout.svgWidth} ${CHART_HEIGHT}`}
        className="block h-full w-full"
        preserveAspectRatio="xMinYMin meet"
        role="img"
        aria-label="Gráfico de barras — consultas contratadas e realizadas por mês"
      >
      <defs>
        <linearGradient id="pref-contrato-contracted-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.95} />
          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity={0.55} />
        </linearGradient>
        <linearGradient id="pref-contrato-performed-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
        </linearGradient>
      </defs>

      <YAxisGrid
        yTicks={layout.yTicks}
        yMax={layout.yMax}
        padding={layout.padding}
        svgWidth={layout.svgWidth}
      />

      {layout.bars.map((group, index) => (
        <g key={group.label}>
          <rect
            x={group.hit.x}
            y={group.hit.y}
            width={group.hit.w}
            height={group.hit.h}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            aria-label={`${group.label}: ${formatPrefeituraNumber(group.row.performed)} realizadas de ${formatPrefeituraNumber(group.row.contracted)} contratadas`}
          />
          <rect
            x={group.contracted.x}
            y={group.contracted.y + group.contracted.h * (1 - layout.scaleY)}
            width={group.contracted.w}
            height={group.contracted.h * layout.scaleY}
            rx={4}
            fill="url(#pref-contrato-contracted-bar)"
            style={{
              transition: `height 0.7s ${PREF_CHART_EASE}, y 0.7s ${PREF_CHART_EASE}`,
            }}
          />
          <rect
            x={group.performed.x}
            y={group.performed.y + group.performed.h * (1 - layout.scaleY)}
            width={group.performed.w}
            height={group.performed.h * layout.scaleY}
            rx={4}
            fill="url(#pref-contrato-performed-bar)"
            style={{
              transition: `height 0.7s ${PREF_CHART_EASE}, y 0.7s ${PREF_CHART_EASE}`,
            }}
          />
          {group.showLabel ? (
            <text
              x={group.labelX}
              y={CHART_HEIGHT - 10}
              textAnchor="middle"
              className="fill-gray-500 text-[10px] font-semibold"
            >
              {group.label}
            </text>
          ) : null}
        </g>
      ))}
      </svg>
    </div>
  )
}

function ContratoMonthlyLineChart({
  rows,
  containerWidth,
  animate,
  gradientSlug,
}: {
  rows: PrefeituraContratoMonthlyRow[]
  containerWidth: number
  animate: boolean
  gradientSlug: string
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const layout = useMemo(() => {
    const padding = { top: 22, right: 12, bottom: 32, left: 44 }
    const svgWidth = Math.max(containerWidth || 320, 320)
    const chartW = svgWidth - padding.left - padding.right
    const chartH = CHART_HEIGHT - padding.top - padding.bottom
    const baseline = padding.top + chartH
    const { yMax, yTicks } = buildYScale(rows)
    const labelStep = resolveLabelStep(rows.length)
    const clipWidth = animate ? svgWidth : 0

    const points = rows.map((row, index) => {
      const x =
        padding.left +
        (index / Math.max(rows.length - 1, 1)) * chartW
      const yContracted = padding.top + chartH - (row.contracted / yMax) * chartH
      const yPerformed = padding.top + chartH - (row.performed / yMax) * chartH

      return {
        row,
        label: row.label,
        index,
        x,
        yContracted,
        yPerformed,
        showLabel: index % labelStep === 0 || index === rows.length - 1,
        tooltip: {
          leftPercent: (x / svgWidth) * 100,
          topPercent: (yPerformed / CHART_HEIGHT) * 100,
        },
      }
    })

    const toPath = (values: Array<{ x: number; y: number }>) =>
      values.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

    const contractedLine = toPath(
      points.map((point) => ({ x: point.x, y: point.yContracted })),
    )
    const performedLine = toPath(
      points.map((point) => ({ x: point.x, y: point.yPerformed })),
    )
    const performedArea = [
      `M ${points[0].x} ${baseline}`,
      ...points.map((point) => `L ${point.x} ${point.yPerformed}`),
      `L ${points[points.length - 1].x} ${baseline}`,
      'Z',
    ].join(' ')

    return {
      points,
      contractedLine,
      performedLine,
      performedArea,
      yTicks,
      yMax,
      svgWidth,
      padding,
      clipWidth,
      fillId: `pref-contrato-performed-fill-${gradientSlug}`,
      clipId: `pref-contrato-lines-clip-${gradientSlug}`,
    }
  }, [rows, containerWidth, animate, gradientSlug])

  const hoveredPoint = hoveredIndex !== null ? layout.points[hoveredIndex] : null

  return (
    <div
      className="relative h-[240px] w-full"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {hoveredPoint ? (
        <ContratoChartTooltip row={hoveredPoint.row} position={hoveredPoint.tooltip} />
      ) : null}
      <svg
        viewBox={`0 0 ${layout.svgWidth} ${CHART_HEIGHT}`}
        className="block h-full w-full"
        preserveAspectRatio="xMinYMin meet"
        role="img"
        aria-label="Gráfico de linhas — evolução mensal de consultas contratadas e realizadas"
      >
      <defs>
        <linearGradient id={layout.fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03} />
        </linearGradient>
        <clipPath id={layout.clipId}>
          <rect x={0} y={0} width={layout.clipWidth} height={CHART_HEIGHT} />
        </clipPath>
      </defs>

      <YAxisGrid
        yTicks={layout.yTicks}
        yMax={layout.yMax}
        padding={layout.padding}
        svgWidth={layout.svgWidth}
      />

      <g clipPath={`url(#${layout.clipId})`}>
        <path d={layout.performedArea} fill={`url(#${layout.fillId})`} />
        <path
          d={layout.contractedLine}
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        <path
          d={layout.performedLine}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {layout.points.map((point) => (
        <g key={point.label}>
          <circle
            cx={point.x}
            cy={point.yPerformed}
            r={12}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredIndex(point.index)}
            aria-hidden
          />
          <circle
            cx={point.x}
            cy={point.yPerformed}
            r={hoveredIndex === point.index ? 5 : 3}
            className={[
              'stroke-white transition-[r]',
              hoveredIndex === point.index ? 'fill-blue-700' : 'fill-blue-500',
            ].join(' ')}
            strokeWidth={1.5}
            pointerEvents="none"
          />
          {hoveredIndex === point.index ? (
            <line
              x1={point.x}
              x2={point.x}
              y1={layout.padding.top}
              y2={CHART_HEIGHT - layout.padding.bottom}
              stroke="#cbd5e1"
              strokeWidth={1}
              strokeDasharray="3 3"
              pointerEvents="none"
            />
          ) : null}
          {point.showLabel ? (
            <text
              x={point.x}
              y={CHART_HEIGHT - 10}
              textAnchor="middle"
              className="fill-gray-500 text-[10px] font-semibold"
              pointerEvents="none"
            >
              {point.label}
            </text>
          ) : null}
        </g>
      ))}
      </svg>
    </div>
  )
}

export function PrefeituraContratoMonthlyChart({
  rows,
  animationKey = 'contrato-monthly',
  monthlyPackageLabel,
}: PrefeituraContratoMonthlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const animate = usePrefeituraChartAnimation(120, animationKey)
  const gradientSlug = useId().replace(/:/g, '')
  const chartMode = rows.length > BAR_MODE_MAX_MONTHS ? 'lines' : 'bars'

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateWidth = () => {
      setContainerWidth(Math.max(0, Math.floor(element.clientWidth)))
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const packageLabel =
    monthlyPackageLabel ??
    `${formatPrefeituraNumber(rows[0]?.contracted ?? 0)} contratadas/mês`

  const footerHint =
    chartMode === 'lines'
      ? 'Evolução em linhas (período longo) · até 8 rótulos de mês no eixo'
      : 'Comparativo em barras por mês'

  return (
    <div className="flex min-h-0 flex-col">
      <div ref={containerRef} className="relative min-h-[240px] w-full overflow-visible">
        {rows.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-gray-500">
            Sem histórico mensal para exibir
          </div>
        ) : chartMode === 'bars' ? (
          <ContratoMonthlyBarChart
            rows={rows}
            containerWidth={containerWidth}
            animate={animate}
          />
        ) : (
          <ContratoMonthlyLineChart
            rows={rows}
            containerWidth={containerWidth}
            animate={animate}
            gradientSlug={gradientSlug}
          />
        )}
        {rows.length > 0 ? <ChartLegend mode={chartMode} /> : null}
      </div>

      <p className="mt-1 shrink-0 text-[10px] leading-snug text-gray-500">
        {rows.length} meses no período · {footerHint} · valores em consultas ({packageLabel})
      </p>
    </div>
  )
}
