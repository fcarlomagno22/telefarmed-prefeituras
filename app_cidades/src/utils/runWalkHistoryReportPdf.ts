import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import type { RunWalkActivitySummary } from '../data/runWalkActivitySummaryStorage'
import type { WeeklyCalendarDay } from '../types/runWalk'
import type {
  RunWalkHistoryAdvancedFilters,
  RunWalkHistoryDateRange,
  RunWalkHistoryHeatmapCell,
  RunWalkHistoryHighlight,
  RunWalkHistoryPeriod,
  RunWalkHistoryPeriodSummary,
  RunWalkHistorySort,
  RunWalkHistoryTrendPoint,
} from '../types/runWalkHistory'
import { formatActivityLocationLabel } from './runWalkActivityLocation'
import {
  formatCaloriesBurned,
  formatElapsedActivityTime,
  formatPaceMinPerKm,
} from './runWalkActivityStats'
import { resolvePdfLogoDataUri } from './pdfBrandLogo'
import {
  buildHistoryBarChartSvgHtml,
  buildHistoryDistanceTrendSvgHtml,
  buildHistoryHeatmapSvgHtml,
} from './runWalkHistoryReportCharts'
import {
  formatActivityDateLabel,
  formatDeltaLabel,
  formatHistoryPeriodLabel,
} from './runWalkHistoryStats'

export type RunWalkHistoryReportPayload = {
  patientName?: string
  period: RunWalkHistoryPeriod
  customRange: RunWalkHistoryDateRange | null
  sort: RunWalkHistorySort
  filters: RunWalkHistoryAdvancedFilters
  summary: RunWalkHistoryPeriodSummary
  highlights: RunWalkHistoryHighlight[]
  activities: RunWalkActivitySummary[]
  targetActiveMinutes: number
  targetDistanceKm: number
  targetMinutesPerDay: number
  chartSectionTitle: string
  chartDays: WeeklyCalendarDay[]
  trendPoints: RunWalkHistoryTrendPoint[]
  heatmapCells: RunWalkHistoryHeatmapCell[]
  heatmapLabel: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitize(value: string) {
  return escapeHtml(
    value
      .replace(/\u2013/g, '-')
      .replace(/\u2014/g, '-')
      .replace(/\u00b7/g, ' | ')
      .replace(/\u2212/g, '-'),
  )
}

function buildHighlightsHtml(highlights: RunWalkHistoryHighlight[]) {
  if (highlights.length === 0) {
    return '<p class="muted">Nenhum destaque disponível no período.</p>'
  }

  return `<div class="highlights">${highlights
    .map(
      (item) => `
        <div class="highlight-card" style="border-color:${sanitize(item.accent)}33">
          <div class="highlight-title" style="color:${sanitize(item.accent)}">${sanitize(item.title)}</div>
          <div class="highlight-value">${sanitize(item.value)}</div>
          <div class="highlight-sub">${sanitize(item.subtitle)}</div>
        </div>
      `,
    )
    .join('')}</div>`
}

function buildActivitiesHtml(activities: RunWalkActivitySummary[]) {
  if (activities.length === 0) {
    return '<p class="muted">Nenhum treino encontrado com os filtros aplicados.</p>'
  }

  const rows = activities
    .slice(0, 40)
    .map(
      (activity) => `
        <tr>
          <td>${sanitize(formatActivityDateLabel(activity.completedAt))}</td>
          <td>${sanitize(formatActivityLocationLabel(activity.locationCity, activity.locationState))}</td>
          <td class="center"><strong>${activity.distanceKm.toFixed(1).replace('.', ',')} km</strong></td>
          <td class="center">${sanitize(formatElapsedActivityTime(activity.elapsedSeconds))}</td>
          <td class="center">${sanitize(formatPaceMinPerKm(activity.paceMinPerKm))}</td>
        </tr>
      `,
    )
    .join('')

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Local</th>
          <th class="center">Distância</th>
          <th class="center">Tempo</th>
          <th class="center">Ritmo</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${activities.length > 40 ? `<p class="muted">+ ${activities.length - 40} treinos no histórico completo.</p>` : ''}
  `
}

function buildHistoryReportHtml(payload: RunWalkHistoryReportPayload, logoSrc: string) {
  const patientName = payload.patientName?.trim() || 'Participante'
  const generatedAt = new Date().toLocaleString('pt-BR')
  const periodLabel = formatHistoryPeriodLabel(payload.period, payload.customRange)
  const minDistanceLabel =
    payload.filters.minDistanceKm > 0
      ? `${payload.filters.minDistanceKm} km+`
      : 'Qualquer distância'

  const sortLabels: Record<RunWalkHistorySort, string> = {
    recent: 'Mais recente',
    distance: 'Maior distância',
    duration: 'Mais longo',
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório Corrida e Caminhada</title>
  <style>
    @page { margin: 16mm 12mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; font-size: 11px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 14px; margin-bottom: 18px; gap: 16px; }
    .brand-logo { height: 46px; width: auto; max-width: 220px; object-fit: contain; display: block; }
    .brand-title { font-size: 22px; font-weight: 800; color: #111827; }
    .doc-meta { text-align: right; color: #6b7280; font-size: 10px; }
    .doc-meta strong { color: #111827; display: block; font-size: 12px; }
    .hero { background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%); border: 1px solid #6ee7b7; border-radius: 16px; padding: 18px; margin-bottom: 16px; text-align: center; }
    .hero-eyebrow { color: #059669; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .hero-value { font-size: 34px; font-weight: 900; color: #111827; margin: 6px 0; }
    .hero-meta { color: #6b7280; font-size: 10px; }
    .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .filter-chip { border: 1px solid #d1d5db; border-radius: 999px; padding: 6px 10px; font-size: 10px; color: #374151; background: #f9fafb; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; text-align: center; background: #fff; }
    .kpi-label { color: #6b7280; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .kpi-value { font-size: 18px; font-weight: 900; margin-top: 4px; color: #111827; }
    .kpi-note { color: #9ca3af; font-size: 9px; margin-top: 2px; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: 800; color: #111827; margin: 0 0 8px; }
    .highlights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .highlight-card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; text-align: center; background: #fff; }
    .highlight-title { font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
    .highlight-value { font-size: 18px; font-weight: 900; color: #111827; }
    .highlight-sub { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table th, .data-table td { border: 1px solid #e5e7eb; padding: 7px 8px; text-align: left; }
    .data-table th { background: #f3f4f6; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
    .center { text-align: center; }
    .muted { color: #6b7280; font-size: 10px; }
    .section-charts { page-break-inside: auto; }
    .chart-block { margin-bottom: 14px; page-break-inside: avoid; }
    .chart-caption { margin: 0 0 6px; color: #6b7280; font-size: 10px; text-transform: capitalize; }
    .report-chart {
      width: 100%;
      height: auto;
      display: block;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }
    .heatmap-chart { min-height: 180px; }
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
      color: #6b7280;
      font-size: 9px;
      font-weight: 600;
    }
    .legend-item { display: inline-flex; align-items: center; gap: 5px; }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      display: inline-block;
    }
    .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 9px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${logoSrc ? `<img class="brand-logo" src="${logoSrc}" alt="Telefarmed" />` : '<div class="brand-title">Telefarmed</div>'}
    </div>
    <div class="doc-meta">
      <strong>${sanitize(patientName)}</strong>
      Relatório de Corrida e Caminhada<br />
      Gerado em ${sanitize(generatedAt)}
    </div>
  </div>

  <div class="hero">
    <div class="hero-eyebrow">Resumo do período</div>
    <div class="hero-value">${payload.summary.totalDistanceKm.toFixed(1).replace('.', ',')} km</div>
    <div class="hero-meta">${sanitize(periodLabel)} · ${payload.summary.totalWorkouts} treinos · ${payload.summary.totalActiveMinutes} min ativos</div>
  </div>

  <div class="filters">
    <span class="filter-chip">Período: ${sanitize(periodLabel)}</span>
    <span class="filter-chip">Distância mín.: ${sanitize(minDistanceLabel)}</span>
    <span class="filter-chip">Ordenação: ${sanitize(sortLabels[payload.sort])}</span>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Distância</div>
      <div class="kpi-value">${payload.summary.totalDistanceKm.toFixed(1).replace('.', ',')} km</div>
      <div class="kpi-note">${sanitize(formatDeltaLabel(payload.summary.distanceDeltaPct))}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Tempo ativo</div>
      <div class="kpi-value">${payload.summary.totalActiveMinutes} min</div>
      <div class="kpi-note">${sanitize(formatDeltaLabel(payload.summary.minutesDeltaPct))}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Treinos</div>
      <div class="kpi-value">${payload.summary.totalWorkouts}</div>
      <div class="kpi-note">${sanitize(formatDeltaLabel(payload.summary.workoutsDeltaPct))}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Calorias</div>
      <div class="kpi-value">${sanitize(formatCaloriesBurned(payload.summary.totalCalories))}</div>
      <div class="kpi-note">${sanitize(formatDeltaLabel(payload.summary.caloriesDeltaPct))}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Metas do período</h2>
    <div class="filters">
      <span class="filter-chip">Meta tempo: ${payload.targetActiveMinutes} min</span>
      <span class="filter-chip">Meta distância: ${payload.targetDistanceKm.toFixed(1).replace('.', ',')} km</span>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Destaques pessoais</h2>
    ${buildHighlightsHtml(payload.highlights)}
  </div>

  <div class="section section-charts">
    <h2 class="section-title">Gráficos do período</h2>

    <div class="chart-block">
      <h3 class="section-title" style="font-size:12px;border-left-color:#3b82f6">${sanitize(payload.chartSectionTitle)}</h3>
      <p class="chart-caption">Minutos ativos por dia · valores exibidos nos pontos com atividade</p>
      ${buildHistoryBarChartSvgHtml(payload.chartDays, payload.targetMinutesPerDay)}
    </div>

    <div class="chart-block">
      <h3 class="section-title" style="font-size:12px;border-left-color:#10b981">Evolução da distância</h3>
      <p class="chart-caption">Últimos treinos do período filtrado</p>
      ${buildHistoryDistanceTrendSvgHtml(payload.trendPoints)}
    </div>

    <div class="chart-block">
      <h3 class="section-title" style="font-size:12px;border-left-color:#059669">Heatmap mensal</h3>
      ${buildHistoryHeatmapSvgHtml(payload.heatmapCells, payload.heatmapLabel)}
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Treinos registrados</h2>
    ${buildActivitiesHtml(payload.activities)}
  </div>

  <div class="footer">
    Telefarmed · Relatório gerado automaticamente com base nos filtros selecionados no app.
  </div>
</body>
</html>`
}

export async function createRunWalkHistoryReportPdf(payload: RunWalkHistoryReportPayload) {
  let logoSrc = ''
  try {
    logoSrc = await resolvePdfLogoDataUri()
  } catch {
    logoSrc = ''
  }

  const html = buildHistoryReportHtml(payload, logoSrc)
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: 595,
    height: 842,
  })

  return uri
}

export async function shareRunWalkHistoryReportPdf(payload: RunWalkHistoryReportPayload) {
  const uri = await createRunWalkHistoryReportPdf(payload)
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Compartilhamento indisponível neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar relatório de corrida e caminhada',
  })
}
