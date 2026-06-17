import type { WeeklyCalendarDay } from '../types/runWalk'
import type { RunWalkHistoryHeatmapCell, RunWalkHistoryTrendPoint } from '../types/runWalkHistory'
import { buildHistoryTrendGeometry } from './runWalkHistoryStats'
import { getWeeklyChartDaySummary } from './runWalkWeeklyChart'

const PDF_CHART_WIDTH = 520

type PdfPadding = {
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

function shouldShowCompactXLabel(index: number, total: number) {
  if (total <= 7) return true
  if (total <= 14) return index % 2 === 0 || index === total - 1
  if (total <= 31) return index % 4 === 0 || index === total - 1
  return index % 7 === 0 || index === total - 1
}

function buildPdfCalloutSvg(
  x: number,
  y: number,
  label: string,
  index: number,
  accentColor: string,
  upward = index % 2 === 0,
) {
  const stemLength = 16
  const endY = y + (upward ? -stemLength : stemLength)
  const textY = endY + (upward ? -5 : 11)

  return `
    <line
      x1="${x.toFixed(1)}"
      y1="${y.toFixed(1)}"
      x2="${x.toFixed(1)}"
      y2="${endY.toFixed(1)}"
      stroke="${accentColor}"
      stroke-width="1.1"
      stroke-dasharray="3 2"
      opacity="0.85"
    />
    <text
      x="${x.toFixed(1)}"
      y="${textY.toFixed(1)}"
      text-anchor="middle"
      fill="#374151"
      font-size="7.5"
      font-weight="700"
    >${escapeSvgText(label)}</text>
  `
}

type BarChartBar = {
  day: WeeklyCalendarDay
  x: number
  y: number
  width: number
  height: number
  baseHeight: number
  overflowHeight: number
  hasOverflow: boolean
  centerX: number
  topY: number
}

function buildHistoryBarChartGeometry(
  days: WeeklyCalendarDay[],
  targetMinutesPerDay: number,
  width: number,
  height: number,
  padding: PdfPadding,
) {
  const plotLeft = padding.left
  const plotTop = padding.top
  const plotWidth = Math.max(1, width - padding.left - padding.right)
  const plotHeight = Math.max(1, height - padding.top - padding.bottom)
  const plotBottom = plotTop + plotHeight
  const barCount = Math.max(days.length, 1)
  const barGap = barCount > 14 ? 2 : barCount > 7 ? 4 : 6
  const barWidth = (plotWidth - barGap * (barCount - 1)) / barCount

  const maxValue = Math.max(
    targetMinutesPerDay,
    ...days.map((day) => day.activeMinutes),
    1,
  )

  const bars: BarChartBar[] = days.map((day, index) => {
    const displayMinutes = day.activeMinutes
    const totalRatio = displayMinutes / maxValue
    const targetRatio = targetMinutesPerDay / maxValue
    const barHeight = Math.max(displayMinutes > 0 ? 4 : 2, totalRatio * plotHeight)
    const baseHeight = Math.min(barHeight, targetRatio * plotHeight)
    const overflowHeight = Math.max(0, barHeight - baseHeight)
    const x = plotLeft + index * (barWidth + barGap)
    const y = plotBottom - barHeight

    return {
      day,
      x,
      y,
      width: barWidth,
      height: barHeight,
      baseHeight,
      overflowHeight,
      hasOverflow: overflowHeight > 1,
      centerX: x + barWidth / 2,
      topY: y,
    }
  })

  const targetLineY = plotBottom - (targetMinutesPerDay / maxValue) * plotHeight

  return {
    width,
    height,
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    plotBottom,
    bars,
    targetLineY,
    showTargetLine: maxValue > targetMinutesPerDay * 1.02,
  }
}

export function buildHistoryBarChartSvgHtml(
  days: WeeklyCalendarDay[],
  targetMinutesPerDay: number,
  width = PDF_CHART_WIDTH,
  height = 250,
) {
  if (days.length === 0) {
    return '<p class="muted">Sem atividade registrada no período.</p>'
  }

  const padding: PdfPadding = { top: 42, right: 12, bottom: 34, left: 8 }
  const geometry = buildHistoryBarChartGeometry(days, targetMinutesPerDay, width, height, padding)

  const gridLine = `
    <line
      x1="${geometry.plotLeft}"
      y1="${geometry.plotBottom.toFixed(1)}"
      x2="${geometry.plotLeft + geometry.plotWidth}"
      y2="${geometry.plotBottom.toFixed(1)}"
      stroke="#e5e7eb"
      stroke-width="1"
    />
  `

  const targetLine = geometry.showTargetLine
    ? `
      <line
        x1="${geometry.plotLeft}"
        y1="${geometry.targetLineY.toFixed(1)}"
        x2="${geometry.plotLeft + geometry.plotWidth}"
        y2="${geometry.targetLineY.toFixed(1)}"
        stroke="#f59e0b"
        stroke-width="1"
        stroke-dasharray="4 3"
        opacity="0.75"
      />
      <text
        x="${geometry.plotLeft + geometry.plotWidth - 2}"
        y="${(geometry.targetLineY - 4).toFixed(1)}"
        text-anchor="end"
        fill="#b45309"
        font-size="7"
        font-weight="700"
      >Meta ${targetMinutesPerDay} min</text>
    `
    : ''

  const barsSvg = geometry.bars
    .map((bar) => {
      const radius = Math.min(4, bar.width / 2)
      const baseColor = bar.day.isToday ? '#10b981' : '#3b82f6'
      const overflowColor = '#f59e0b'

      if (bar.hasOverflow) {
        const overflowY = bar.y
        const baseY = bar.y + bar.overflowHeight

        return `
          <rect x="${bar.x.toFixed(1)}" y="${overflowY.toFixed(1)}" width="${bar.width.toFixed(1)}" height="${bar.overflowHeight.toFixed(1)}" rx="${radius}" fill="${overflowColor}" opacity="0.95" />
          <rect x="${bar.x.toFixed(1)}" y="${baseY.toFixed(1)}" width="${bar.width.toFixed(1)}" height="${bar.baseHeight.toFixed(1)}" rx="${radius}" fill="${baseColor}" opacity="0.95" />
        `
      }

      if (bar.height <= 0.5) return ''

      return `
        <rect
          x="${bar.x.toFixed(1)}"
          y="${bar.y.toFixed(1)}"
          width="${bar.width.toFixed(1)}"
          height="${bar.height.toFixed(1)}"
          rx="${radius}"
          fill="${baseColor}"
          opacity="${bar.day.activeMinutes > 0 ? 0.95 : 0.25}"
        />
      `
    })
    .join('')

  const xLabels = geometry.bars
    .map((bar, index) => ({ bar, index }))
    .filter(({ index }) => shouldShowCompactXLabel(index, days.length))
    .map(
      ({ bar }) => `
        <text
          x="${bar.centerX.toFixed(1)}"
          y="${(geometry.plotBottom + 12).toFixed(1)}"
          text-anchor="middle"
          fill="#9ca3af"
          font-size="7"
          font-weight="600"
        >${escapeSvgText(bar.day.dateShort ?? bar.day.weekdayShort)}</text>
      `,
    )
    .join('')

  const callouts = geometry.bars
    .map((bar, index) => {
      if (bar.day.activeMinutes <= 0) return ''

      const accent = bar.day.isToday ? '#059669' : '#2563eb'
      const summary = getWeeklyChartDaySummary(bar.day)
      const workoutCount = bar.day.activities.filter((activity) => activity.type !== 'rest').length
      const label =
        workoutCount > 0 ? `${summary} · ${workoutCount} treino${workoutCount === 1 ? '' : 's'}` : summary

      return buildPdfCalloutSvg(bar.centerX, bar.topY, label, index, accent)
    })
    .join('')

  return `
    <svg class="report-chart" viewBox="0 0 ${geometry.width} ${geometry.height}" preserveAspectRatio="xMidYMid meet">
      ${gridLine}
      ${targetLine}
      ${barsSvg}
      ${callouts}
      ${xLabels}
    </svg>
    <div class="chart-legend">
      <span class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span>Ativo</span>
      <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Hoje</span>
      <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Meta superada</span>
    </div>
  `
}

export function buildHistoryDistanceTrendSvgHtml(
  points: RunWalkHistoryTrendPoint[],
  width = PDF_CHART_WIDTH,
  height = 240,
) {
  if (points.length === 0) {
    return '<p class="muted">Sem treinos suficientes para a linha de evolução.</p>'
  }

  const geometry = buildHistoryTrendGeometry(points, width, height)
  if (!geometry) {
    return '<p class="muted">Sem treinos suficientes para a linha de evolução.</p>'
  }

  const plotBottom = geometry.plotTop + geometry.plotHeight
  const accentColor = '#10b981'

  const gridLines = geometry.yTicks
    .map(
      (tick) => `
        <line
          x1="${geometry.plotLeft}"
          y1="${tick.y.toFixed(1)}"
          x2="${geometry.plotLeft + geometry.plotWidth}"
          y2="${tick.y.toFixed(1)}"
          stroke="#e5e7eb"
          stroke-width="1"
        />
        <text
          x="${geometry.plotLeft - 6}"
          y="${(tick.y + 3).toFixed(1)}"
          text-anchor="end"
          fill="#9ca3af"
          font-size="8"
          font-weight="600"
        >${tick.value.toFixed(1).replace('.', ',')}</text>
      `,
    )
    .join('')

  const xLabels = points
    .map((point, index) => {
      if (!shouldShowCompactXLabel(index, points.length)) return ''

      const x =
        points.length === 1
          ? geometry.plotLeft + geometry.plotWidth / 2
          : geometry.plotLeft + (index / (points.length - 1)) * geometry.plotWidth

      return `
        <text
          x="${x.toFixed(1)}"
          y="${(height - 8).toFixed(1)}"
          text-anchor="middle"
          fill="#9ca3af"
          font-size="8"
          font-weight="600"
        >${escapeSvgText(point.label)}</text>
      `
    })
    .join('')

  const callouts = geometry.points
    .map((point, index) => {
      const trendPoint = points[index]
      if (!trendPoint) return ''

      const label = `${trendPoint.value.toFixed(1).replace('.', ',')} km`
      return buildPdfCalloutSvg(point.x, point.y, label, index, accentColor)
    })
    .join('')

  const dots = geometry.points
    .map(
      (point) =>
        `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.5" fill="#fff" stroke="${accentColor}" stroke-width="2" />`,
    )
    .join('')

  return `
    <svg class="report-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="runWalkTrendArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6ee7b7" stop-opacity="0.42" />
          <stop offset="100%" stop-color="#6ee7b7" stop-opacity="0.03" />
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${geometry.areaPath}" fill="url(#runWalkTrendArea)" opacity="0.95" />
      <path d="${geometry.linePath}" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${callouts}
      ${dots}
      ${xLabels}
      <text x="${geometry.plotLeft}" y="${(plotBottom + 22).toFixed(1)}" fill="#6b7280" font-size="8" font-weight="600">Distância por treino (km)</text>
    </svg>
  `
}

function buildHeatmapGeometry(cells: RunWalkHistoryHeatmapCell[], width: number, height: number) {
  const padding = { top: 36, right: 8, bottom: 8, left: 8 }
  const cols = 7
  const gap = 4
  const gridWidth = width - padding.left - padding.right
  const cellSize = (gridWidth - gap * (cols - 1)) / cols

  const firstWeekday = cells.length > 0 ? new Date(`${cells[0].dateIso}T12:00:00`).getDay() : 0
  const padded: Array<RunWalkHistoryHeatmapCell | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...cells,
  ]

  const weeks: Array<Array<RunWalkHistoryHeatmapCell | null>> = []
  for (let index = 0; index < padded.length; index += cols) {
    const week = padded.slice(index, index + cols)
    while (week.length < cols) week.push(null)
    weeks.push(week)
  }

  const gridHeight = weeks.length * cellSize + (weeks.length - 1) * gap
  const totalHeight = Math.max(height, padding.top + gridHeight + padding.bottom)

  const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return {
    width,
    height: totalHeight,
    padding,
    cols,
    gap,
    cellSize,
    weeks,
    weekdayLabels,
  }
}

export function buildHistoryHeatmapSvgHtml(
  cells: RunWalkHistoryHeatmapCell[],
  monthLabel: string,
  width = PDF_CHART_WIDTH,
  height = 220,
) {
  if (cells.length === 0) {
    return '<p class="muted">Sem dados para heatmap mensal.</p>'
  }

  const geometry = buildHeatmapGeometry(cells, width, height)
  const { padding, gap, cellSize, weeks, weekdayLabels } = geometry

  const weekdayHeaders = weekdayLabels
    .map((label, index) => {
      const x = padding.left + index * (cellSize + gap) + cellSize / 2
      return `
        <text x="${x.toFixed(1)}" y="${(padding.top - 10).toFixed(1)}" text-anchor="middle" fill="#9ca3af" font-size="8" font-weight="700">${label}</text>
      `
    })
    .join('')

  let calloutIndex = 0
  const calloutDateKeys = new Set(
    [...cells]
      .filter((cell) => cell.hasActivity)
      .sort((left, right) => right.activeMinutes - left.activeMinutes)
      .slice(0, 12)
      .map((cell) => cell.dateIso),
  )

  const cellsSvg = weeks
    .map((week, weekIndex) =>
      week
        .map((cell, dayIndex) => {
          if (!cell) return ''

          const x = padding.left + dayIndex * (cellSize + gap)
          const y = padding.top + weekIndex * (cellSize + gap)
          const alpha = 0.14 + cell.intensity * 0.72
          const fill = cell.hasActivity
            ? `rgba(16, 185, 129, ${alpha.toFixed(2)})`
            : 'rgba(229, 231, 235, 0.65)'
          const stroke = cell.hasActivity ? 'rgba(5, 150, 105, 0.45)' : 'rgba(209, 213, 219, 0.9)'

          const cellSvg = `
            <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1" />
            <text x="${(x + cellSize / 2).toFixed(1)}" y="${(y + cellSize / 2 + 3).toFixed(1)}" text-anchor="middle" fill="${cell.hasActivity ? '#065f46' : '#9ca3af'}" font-size="7" font-weight="700">${cell.day}</text>
          `

          if (!cell.hasActivity || !calloutDateKeys.has(cell.dateIso)) return cellSvg

          const centerX = x + cellSize / 2
          const topY = y
          const label = `${cell.activeMinutes} min · ${cell.distanceKm.toFixed(1).replace('.', ',')} km`
          const callout = buildPdfCalloutSvg(centerX, topY, label, calloutIndex, '#059669', true)
          calloutIndex += 1

          return cellSvg + callout
        })
        .join(''),
    )
    .join('')

  return `
    <p class="chart-caption">${escapeSvgText(monthLabel)}</p>
    <svg class="report-chart heatmap-chart" viewBox="0 0 ${geometry.width} ${geometry.height}" preserveAspectRatio="xMidYMid meet">
      ${weekdayHeaders}
      ${cellsSvg}
    </svg>
  `
}
