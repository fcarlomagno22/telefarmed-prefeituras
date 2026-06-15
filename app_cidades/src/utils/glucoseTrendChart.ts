import { GlucoseTrendBucket } from '../types/glucose'

export type TrendChartPoint = {
  x: number
  y: number
  bucket: GlucoseTrendBucket
}

export type TrendChartGeometry = {
  width: number
  height: number
  plotLeft: number
  plotTop: number
  plotWidth: number
  plotHeight: number
  plotBottom: number
  points: TrendChartPoint[]
  linePath: string
  areaPath: string
  yTicks: { value: number; y: number }[]
  xLabels: { label: string; x: number }[]
}

const PADDING = {
  top: 18,
  right: 14,
  bottom: 30,
  left: 38,
}

const PDF_TREND_PADDING = {
  top: 34,
  right: 14,
  bottom: 30,
  left: 38,
}

type TrendChartPadding = {
  top: number
  right: number
  bottom: number
  left: number
}

function buildYTicks(min: number, max: number, plotTop: number, plotHeight: number) {
  const step = Math.max(10, Math.ceil((max - min) / 4 / 10) * 10)
  const start = Math.floor(min / step) * step
  const ticks: { value: number; y: number }[] = []

  for (let value = start; value <= max + step; value += step) {
    const y = plotTop + plotHeight - ((value - min) / (max - min || 1)) * plotHeight
    ticks.push({ value, y })
  }

  return ticks.slice(0, 5)
}

export function shouldShowTrendXLabel(index: number, total: number) {
  if (total <= 1) return true
  if (total <= 7) return true
  if (total <= 14) return index % 2 === 0 || index === total - 1
  if (total <= 31) return index % 4 === 0 || index === total - 1
  return index % 7 === 0 || index === total - 1
}

export function buildTrendLineGeometry(
  buckets: GlucoseTrendBucket[],
  width: number,
  height: number,
  padding: TrendChartPadding = PADDING,
): TrendChartGeometry | null {
  if (buckets.length === 0) return null

  const values = buckets.map((bucket) => bucket.avg)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const min = Math.max(0, rawMin - 12)
  const max = rawMax + 12
  const range = max - min || 1

  const plotLeft = padding.left
  const plotTop = padding.top
  const plotWidth = Math.max(1, width - padding.left - padding.right)
  const plotHeight = Math.max(1, height - padding.top - padding.bottom)
  const plotBottom = plotTop + plotHeight

  const points: TrendChartPoint[] = buckets.map((bucket, index) => {
    const x =
      buckets.length === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (index / (buckets.length - 1)) * plotWidth
    const y = plotBottom - ((bucket.avg - min) / range) * plotHeight

    return { x, y, bucket }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')

  const areaPath =
    points.length === 1
      ? ''
      : `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${plotBottom} L ${points[0].x.toFixed(1)} ${plotBottom} Z`

  const xLabels = points
    .map((point, index) => ({ point, index }))
    .filter(({ index }) => shouldShowTrendXLabel(index, buckets.length))
    .map(({ point }) => ({
      label: point.bucket.label,
      x: point.x,
    }))

  return {
    width,
    height,
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    plotBottom,
    points,
    linePath,
    areaPath,
    yTicks: buildYTicks(min, max, plotTop, plotHeight),
    xLabels,
  }
}

function buildPdfPointCalloutsSvg(points: TrendChartPoint[], accentColor: string) {
  const stemLength = 18

  return points
    .map((point, index) => {
      const upward = index % 2 === 0
      const endY = point.y + (upward ? -stemLength : stemLength)
      const labelY = endY + (upward ? -5 : 11)

      return `
        <line
          x1="${point.x.toFixed(1)}"
          y1="${point.y.toFixed(1)}"
          x2="${point.x.toFixed(1)}"
          y2="${endY.toFixed(1)}"
          stroke="${accentColor}"
          stroke-width="1.1"
          stroke-dasharray="3 2"
          opacity="0.8"
        />
        <text
          x="${point.x.toFixed(1)}"
          y="${labelY.toFixed(1)}"
          text-anchor="middle"
          fill="#374151"
          font-size="8"
          font-weight="700"
        >${point.bucket.avg}</text>
      `
    })
    .join('')
}

export function buildTrendLineSvgHtml(
  buckets: GlucoseTrendBucket[],
  width = 520,
  height = 220,
  accentColor = '#ef4444',
) {
  const geometry = buildTrendLineGeometry(buckets, width, height, PDF_TREND_PADDING)
  if (!geometry) {
    return '<p class="muted">Sem dados suficientes para tendência no período.</p>'
  }

  const gridLines = geometry.yTicks
    .map(
      (tick) => `
        <line x1="${geometry.plotLeft}" y1="${tick.y.toFixed(1)}" x2="${geometry.plotLeft + geometry.plotWidth}" y2="${tick.y.toFixed(1)}" stroke="#e5e7eb" stroke-width="1" />
        <text x="${geometry.plotLeft - 6}" y="${(tick.y + 3).toFixed(1)}" text-anchor="end" fill="#9ca3af" font-size="8" font-weight="600">${tick.value}</text>
      `,
    )
    .join('')

  const xLabels = geometry.xLabels
    .map(
      (label) =>
        `<text x="${label.x.toFixed(1)}" y="${geometry.height - 8}" text-anchor="middle" fill="#9ca3af" font-size="8" font-weight="600">${label.label}</text>`,
    )
    .join('')

  const callouts = buildPdfPointCalloutsSvg(geometry.points, accentColor)

  const dots = geometry.points
    .map(
      (point) =>
        `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.5" fill="#fff" stroke="${accentColor}" stroke-width="2" />`,
    )
    .join('')

  return `
    <svg class="trend-line-chart" viewBox="0 0 ${geometry.width} ${geometry.height}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fca5a5" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#fca5a5" stop-opacity="0.03" />
        </linearGradient>
      </defs>
      ${gridLines}
      ${
        geometry.areaPath
          ? `<path d="${geometry.areaPath}" fill="url(#trendAreaGradient)" opacity="0.9" />`
          : ''
      }
      <path d="${geometry.linePath}" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${callouts}
      ${dots}
      ${xLabels}
    </svg>
  `
}
