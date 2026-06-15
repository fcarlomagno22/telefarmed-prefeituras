import * as FileSystem from 'expo-file-system/legacy'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { HeartRateReportSummary } from '../types/heartRate'
import {
  formatHeartRateDateTime,
  formatHeartRateTime,
  formatHeartRateValue,
  getHeartRateContextLabel,
  getHeartRateZone,
  HEART_RATE_HIGH_PEAK_BPM,
  HEART_RATE_NORMAL_MAX_BPM,
} from './heartRate'
import {
  getHeartRateTrendDirectionLabel,
  mapHeartRateTrendToChartBuckets,
} from './heartRateReport'
import { buildTrendLineSvgHtml } from './glucoseTrendChart'
import { resolvePdfLogoDataUri } from './pdfBrandLogo'
import { formatStepsCount } from '../data/mockStepsHistory'
import { formatDistanceKmLabel } from '../data/mockStepsHistory'

type HeartRatePdfMeta = {
  patientName?: string
  logoSrc?: string
  includeTrendChart?: boolean
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizePdfText(value: string) {
  return escapeHtml(
    value
      .replace(/\u2013/g, '-')
      .replace(/\u2014/g, '-')
      .replace(/\u00b7/g, ' | ')
      .replace(/\u2265/g, '>=')
      .replace(/\u2264/g, '<='),
  )
}

function buildZoneMarkHtml(zone: { label: string; color: string }) {
  return `
    <span class="zone-mark">
      <span class="zone-mark-text" style="color:${zone.color}">${zone.label}</span>
      <span class="zone-mark-line" style="background:${zone.color}"></span>
    </span>
  `
}

function buildTrendSectionHtml(report: HeartRateReportSummary, includeTrendChart: boolean) {
  if (!includeTrendChart || report.trend.buckets.length === 0) {
    return '<p class="muted">Sem dados suficientes para tendencia no periodo.</p>'
  }

  return buildTrendLineSvgHtml(mapHeartRateTrendToChartBuckets(report.trend.buckets), 520, 220, '#ef4444')
}

function buildPeaksHtml(report: HeartRateReportSummary) {
  const elevated = report.peaksAboveNormal.readings
    .slice(0, 12)
    .map(
      (reading) =>
        `<li>${sanitizePdfText(formatHeartRateDateTime(reading.recordedAt))} | <strong>${formatHeartRateValue(reading.bpm)}</strong> | ${sanitizePdfText(getHeartRateContextLabel(reading.context))}</li>`,
    )
    .join('')
  const high = report.highPeaks.readings
    .slice(0, 8)
    .map(
      (reading) =>
        `<li>${sanitizePdfText(formatHeartRateDateTime(reading.recordedAt))} | <strong>${formatHeartRateValue(reading.bpm)}</strong></li>`,
    )
    .join('')

  return `
    <div class="alert-grid">
      <div class="alert-card elevated">
        <div class="alert-count">${report.peaksAboveNormal.count}</div>
        <div class="alert-title">Acima de ${report.peaksAboveNormal.threshold} bpm</div>
        <div class="alert-sub">${report.peaksAboveNormal.pct}% das leituras</div>
        ${elevated ? `<ul>${elevated}</ul>` : '<p class="muted">Nenhum pico acima do normal no periodo.</p>'}
      </div>
      <div class="alert-card high">
        <div class="alert-count">${report.highPeaks.count}</div>
        <div class="alert-title">Picos acima de ${HEART_RATE_HIGH_PEAK_BPM} bpm</div>
        ${high ? `<ul>${high}</ul>` : '<p class="muted">Nenhum pico muito elevado no periodo.</p>'}
      </div>
    </div>
  `
}

function buildEffortHtml(report: HeartRateReportSummary) {
  if (!report.effort.available) {
    return `<p class="muted">${sanitizePdfText(report.effort.summary)}</p>`
  }

  return `
    <p class="effort-summary">${sanitizePdfText(report.effort.summary)}</p>
    <div class="effort-grid">
      <div class="effort-card">
        <div class="effort-label">Repouso</div>
        <div class="effort-value">${report.effort.avgRestingBpm > 0 ? `${report.effort.avgRestingBpm} bpm` : '-'}</div>
      </div>
      <div class="effort-card">
        <div class="effort-label">Esforco</div>
        <div class="effort-value">${report.effort.avgWorkoutBpm > 0 ? `${report.effort.avgWorkoutBpm} bpm` : '-'}</div>
      </div>
      <div class="effort-card">
        <div class="effort-label">Dias ativos</div>
        <div class="effort-value">${report.effort.activeDayCount}</div>
      </div>
      <div class="effort-card">
        <div class="effort-label">Passos / distancia</div>
        <div class="effort-value">${report.effort.avgStepsOnActiveDays > 0 ? `${formatStepsCount(report.effort.avgStepsOnActiveDays)} | ${formatDistanceKmLabel(report.effort.avgDistanceKmOnActiveDays)}` : '-'}</div>
      </div>
    </div>
  `
}

function buildReadingsTableHtml(report: HeartRateReportSummary) {
  if (report.readings.length === 0) {
    return '<p class="muted">Nenhuma leitura registrada no periodo selecionado.</p>'
  }

  const rows = report.readings
    .slice(0, 30)
    .map((reading) => {
      const zone = getHeartRateZone(reading.bpm)
      return `
        <tr>
          <td>${sanitizePdfText(formatHeartRateDateTime(reading.recordedAt))}</td>
          <td class="center"><strong>${formatHeartRateValue(reading.bpm)}</strong></td>
          <td class="center">${sanitizePdfText(getHeartRateContextLabel(reading.context))}</td>
          <td class="center">${sanitizePdfText(formatHeartRateTime(reading.recordedAt))}</td>
          <td class="center">${buildZoneMarkHtml(zone)}</td>
        </tr>
      `
    })
    .join('')

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Data / hora</th>
          <th class="center">Valor</th>
          <th class="center">Contexto</th>
          <th class="center">Horario</th>
          <th class="center">Zona</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildHeartRateReportHtml(report: HeartRateReportSummary, meta: HeartRatePdfMeta = {}) {
  const patientName = meta.patientName?.trim() || 'Paciente'
  const logoSrc = meta.logoSrc ?? ''
  const includeTrendChart = meta.includeTrendChart ?? true
  const generatedAt = new Date().toLocaleString('pt-BR')
  const trendLabel = getHeartRateTrendDirectionLabel(report.trend.direction)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatorio de Frequencia Cardiaca</title>
  <style>
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; font-size: 11px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ef4444; padding-bottom: 14px; margin-bottom: 18px; gap: 16px; }
    .brand-logo { height: 46px; width: auto; max-width: 220px; object-fit: contain; display: block; }
    .brand-title { font-size: 22px; font-weight: 800; color: #111827; }
    .doc-meta { text-align: right; color: #6b7280; font-size: 10px; }
    .doc-meta strong { color: #111827; display: block; font-size: 12px; }
    .hero { background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%); border: 1px solid #fecaca; border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; }
    .hero-eyebrow { color: #dc2626; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .hero-value { font-size: 28px; font-weight: 800; color: #111827; margin: 6px 0; }
    .hero-meta { color: #6b7280; font-size: 10px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; text-align: center; }
    .kpi-label { color: #6b7280; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .kpi-value { font-size: 18px; font-weight: 800; margin-top: 4px; color: #111827; }
    .kpi-note { color: #9ca3af; font-size: 9px; margin-top: 2px; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: 800; color: #111827; margin: 0 0 8px; }
    .muted { color: #6b7280; }
    .trend-caption { margin: 0 0 8px; font-size: 10px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; page-break-inside: auto; }
    .data-table th, .data-table td { border-bottom: 1px solid #e5e7eb; padding: 7px 6px; text-align: left; vertical-align: middle; }
    .data-table th { color: #6b7280; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
    .center { text-align: center; }
    .zone-mark { display: inline-block; text-align: center; }
    .zone-mark-text { font-size: 10px; font-weight: 800; display: block; }
    .zone-mark-line { width: 22px; height: 2px; border-radius: 999px; margin: 2px auto 0; }
    .trend-line-chart { width: 100%; height: auto; display: block; margin-bottom: 10px; }
    .alert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .alert-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
    .alert-card.elevated { border-color: #fcd34d; background: #fffbeb; }
    .alert-card.high { border-color: #fecaca; background: #fef2f2; }
    .alert-count { font-size: 22px; font-weight: 800; color: #111827; }
    .alert-title { font-size: 11px; font-weight: 700; margin-top: 4px; }
    .alert-sub { color: #6b7280; font-size: 9px; margin-bottom: 6px; }
    .alert-card ul { margin: 0; padding-left: 16px; font-size: 9px; }
    .effort-summary { margin: 0 0 10px; }
    .effort-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .effort-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px; text-align: center; }
    .effort-label { color: #6b7280; font-size: 8px; font-weight: 700; text-transform: uppercase; }
    .effort-value { font-size: 13px; font-weight: 800; margin-top: 4px; }
    .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 9px; }
    .patient-line { margin-bottom: 12px; color: #374151; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>${logoSrc ? `<img src="${logoSrc}" alt="Telefarmed" class="brand-logo" />` : `<div class="brand-title">Telefarmed</div>`}</div>
    <div class="doc-meta">
      <strong>Frequencia Cardiaca</strong>
      Gerado em ${generatedAt}
    </div>
  </div>

  <p class="patient-line"><strong>Paciente:</strong> ${sanitizePdfText(patientName)} | <strong>Periodo:</strong> ${sanitizePdfText(report.periodLabel)} | <strong>Leituras:</strong> ${report.totalReadings}</p>

  <div class="hero">
    <div class="hero-eyebrow">Media em repouso</div>
    <div class="hero-value">${report.restingAvg > 0 ? `${report.restingAvg} bpm` : 'Sem leituras de repouso'}</div>
    <div class="hero-meta">Referencia geral em repouso: ate ${HEART_RATE_NORMAL_MAX_BPM} bpm. Tendencia: ${sanitizePdfText(trendLabel)}${report.trend.changePct !== 0 ? ` (${report.trend.changePct > 0 ? '+' : ''}${report.trend.changePct}%)` : ''}.</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Media geral</div>
      <div class="kpi-value">${report.overall.avg > 0 ? `${report.overall.avg} bpm` : '-'}</div>
      <div class="kpi-note">${report.overall.min > 0 ? `${report.overall.min} - ${report.overall.max} bpm` : 'Sem faixa'}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Esforco</div>
      <div class="kpi-value">${report.workout.avg > 0 ? `${report.workout.avg} bpm` : '-'}</div>
      <div class="kpi-note">${report.workout.count} leituras</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Acima de ${HEART_RATE_NORMAL_MAX_BPM}</div>
      <div class="kpi-value">${report.peaksAboveNormal.count}</div>
      <div class="kpi-note">${report.peaksAboveNormal.pct}% das leituras</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Bradicardia</div>
      <div class="kpi-value">${report.bradycardia.count}</div>
      <div class="kpi-note">Abaixo de 60 bpm</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Picos acima do normal</h2>
    ${buildPeaksHtml(report)}
  </div>

  <div class="section">
    <h2 class="section-title">Relacao com esforco</h2>
    ${buildEffortHtml(report)}
  </div>

  <div class="section">
    <h2 class="section-title">Tendencia no periodo</h2>
    <p class="trend-caption">${sanitizePdfText(trendLabel)}${report.trend.changePct !== 0 ? ` | variacao ${report.trend.changePct > 0 ? '+' : ''}${report.trend.changePct}%` : ''}</p>
    ${buildTrendSectionHtml(report, includeTrendChart)}
  </div>

  <div class="section">
    <h2 class="section-title">Historico detalhado</h2>
    ${buildReadingsTableHtml(report)}
  </div>

  <div class="footer">
    Relatorio de frequencia cardiaca gerado pelo app Telefarmed para apoio a consulta e telemedicina.
    Picos durante esforco sao esperados. Betabloqueadores podem reduzir a FC em repouso e no esforco.
    Este relatorio nao substitui avaliacao medica, especialmente em cardiopatias.
  </div>
</body>
</html>`
}

async function createHeartRateReportPdf(
  report: HeartRateReportSummary,
  meta: HeartRatePdfMeta = {},
) {
  let logoSrc = ''
  try {
    logoSrc = await resolvePdfLogoDataUri()
  } catch {
    logoSrc = ''
  }

  const attempts: HeartRatePdfMeta[] = [
    { ...meta, logoSrc, includeTrendChart: true },
    { ...meta, logoSrc: '', includeTrendChart: true },
    { ...meta, logoSrc: '', includeTrendChart: false },
  ]

  let lastError: unknown = null

  for (const attemptMeta of attempts) {
    try {
      const html = buildHeartRateReportHtml(report, attemptMeta)
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 595,
        height: 842,
      })
      return uri
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) throw lastError
  throw new Error('Nao foi possivel gerar o PDF do relatorio.')
}

export async function shareHeartRateReportPdf(
  report: HeartRateReportSummary,
  meta: HeartRatePdfMeta = {},
) {
  const uri = await createHeartRateReportPdf(report, meta)
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Compartilhamento indisponivel neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar relatorio de frequencia cardiaca',
  })
}
