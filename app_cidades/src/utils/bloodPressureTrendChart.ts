import { BloodPressureTrendBucket } from '../types/bloodPressure'

export type BloodPressureTrendPoint = {
  x: number
  ySystolic: number
  yDiastolic: number
  bucket: BloodPressureTrendBucket
}

export type BloodPressureTrendGeometry = {
  width: number
  height: number
  plotLeft: number
  plotTop: number
  plotWidth: number
  plotHeight: number
  plotBottom: number
  points: BloodPressureTrendPoint[]
  systolicPath: string
  diastolicPath: string
  yTicks: { value: number; y: number }[]
  xLabels: { label: string; x: number }[]
}

const PADDING = {
  top: 18,
  right: 14,
  bottom: 30,
  left: 38,
}

const PDF_PADDING = {
  top: 34,
  right: 14,
  bottom: 30,
  left: 38,
}

type TrendPadding = {
  top: number
  right: number
  bottom: number
  left: number
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeSvgPath(path: string) {
  if (!path || /NaN|Infinity/.test(path)) return ''
  return path
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

export function shouldShowBloodPressureXLabel(index: number, total: number) {
  if (total <= 1) return true
  if (total <= 7) return true
  if (total <= 14) return index % 2 === 0 || index === total - 1
  if (total <= 31) return index % 4 === 0 || index === total - 1
  return index % 7 === 0 || index === total - 1
}

export function buildBloodPressureTrendGeometry(
  buckets: BloodPressureTrendBucket[],
  width: number,
  height: number,
  padding: TrendPadding = PADDING,
): BloodPressureTrendGeometry | null {
  if (buckets.length === 0) return null

  const values = buckets.flatMap((bucket) => [bucket.avgSystolic, bucket.avgDiastolic])
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const min = Math.max(50, rawMin - 10)
  const max = rawMax + 10
  const range = max - min || 1

  const plotLeft = padding.left
  const plotTop = padding.top
  const plotWidth = Math.max(1, width - padding.left - padding.right)
  const plotHeight = Math.max(1, height - padding.top - padding.bottom)
  const plotBottom = plotTop + plotHeight

  const toY = (value: number) => plotBottom - ((value - min) / range) * plotHeight

  const points: BloodPressureTrendPoint[] = buckets.map((bucket, index) => {
    const x =
      buckets.length === 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (index / (buckets.length - 1)) * plotWidth

    return {
      x,
      ySystolic: toY(bucket.avgSystolic),
      yDiastolic: toY(bucket.avgDiastolic),
      bucket,
    }
  })

  const buildPath = (key: 'ySystolic' | 'yDiastolic') =>
    points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point[key].toFixed(1)}`)
      .join(' ')

  const xLabels = points
    .map((point, index) => ({ point, index }))
    .filter(({ index }) => shouldShowBloodPressureXLabel(index, buckets.length))
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
    systolicPath: buildPath('ySystolic'),
    diastolicPath: buildPath('yDiastolic'),
    yTicks: buildYTicks(min, max, plotTop, plotHeight),
    xLabels,
  }
}

export function buildBloodPressureTrendSvgHtml(
  buckets: BloodPressureTrendBucket[],
  width = 520,
  height = 220,
) {
  const geometry = buildBloodPressureTrendGeometry(buckets, width, height, PDF_PADDING)
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
        `<text x="${label.x.toFixed(1)}" y="${geometry.height - 8}" text-anchor="middle" fill="#9ca3af" font-size="8" font-weight="600">${escapeSvgText(label.label)}</text>`,
    )
    .join('')

  const dots = geometry.points
    .map(
      (point) => `
        <circle cx="${point.x.toFixed(1)}" cy="${point.ySystolic.toFixed(1)}" r="3.2" fill="#fff" stroke="#f59e0b" stroke-width="2" />
        <circle cx="${point.x.toFixed(1)}" cy="${point.yDiastolic.toFixed(1)}" r="3.2" fill="#fff" stroke="#38bdf8" stroke-width="2" />
      `,
    )
    .join('')

  const systolicPath = sanitizeSvgPath(geometry.systolicPath)
  const diastolicPath = sanitizeSvgPath(geometry.diastolicPath)

  return `
    <svg xmlns="http://www.w3.org/2000/svg" class="trend-line-chart" viewBox="0 0 ${geometry.width} ${geometry.height}" preserveAspectRatio="xMidYMid meet">
      ${gridLines}
      ${
        diastolicPath
          ? `<path d="${diastolicPath}" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />`
          : ''
      }
      ${
        systolicPath
          ? `<path d="${systolicPath}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`
          : ''
      }
      ${dots}
      ${xLabels}
      <text x="${geometry.plotLeft + 4}" y="${geometry.plotTop + 10}" fill="#d97706" font-size="8" font-weight="700">Sistolica</text>
      <text x="${geometry.plotLeft + 4}" y="${geometry.plotTop + 22}" fill="#0284c7" font-size="8" font-weight="700">Diastolica</text>
    </svg>
  `
}
