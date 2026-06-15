import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { BodyMeasurementsReportSummary } from '../types/bodyMeasurementsReport'
import {
  formatBodyMeasurementReportValue,
  getBodyMeasurementTrendDirectionLabel,
} from './bodyMeasurementsReport'
import { buildTrendLineSvgHtml } from './glucoseTrendChart'
import { resolvePdfLogoDataUri } from './pdfBrandLogo'

type BodyMeasurementsPdfMeta = {
  patientName?: string
  logoSrc?: string
  includeTrendCharts?: boolean
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
      .replace(/\u2212/g, '-'),
  )
}

function buildMeasurementsTableHtml(series: BodyMeasurementsReportSummary['allSeries']) {
  if (series.length === 0) {
    return '<p class="muted">Nenhuma medida registrada no periodo selecionado.</p>'
  }

  const rows = series
    .map(
      (entry) => `
        <tr>
          <td>${sanitizePdfText(entry.label)}</td>
          <td class="center">${entry.count}</td>
          <td class="center">${formatBodyMeasurementReportValue(entry.id, entry.start)}</td>
          <td class="center"><strong>${formatBodyMeasurementReportValue(entry.id, entry.end)}</strong></td>
          <td class="center">${sanitizePdfText(entry.deltaLabel)}</td>
        </tr>
      `,
    )
    .join('')

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Medida</th>
          <th class="center">Registros</th>
          <th class="center">Inicio</th>
          <th class="center">Atual</th>
          <th class="center">Variacao</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildHighlightsHtml(report: BodyMeasurementsReportSummary) {
  if (report.highlights.length === 0) {
    return '<p class="muted">Sem variacoes relevantes entre a primeira e a ultima medicao do periodo.</p>'
  }

  return `<ul>${report.highlights.map((item) => `<li>${sanitizePdfText(item)}</li>`).join('')}</ul>`
}

function buildTrendSectionsHtml(
  report: BodyMeasurementsReportSummary,
  includeTrendCharts: boolean,
) {
  if (!includeTrendCharts) return ''

  const candidates = [...report.principal, ...report.complementar]
    .filter((entry) => entry.trend.buckets.length >= 2)
    .slice(0, 3)

  if (candidates.length === 0) {
    return '<p class="muted">Sem dados suficientes para graficos de evolucao.</p>'
  }

  return candidates
    .map((entry) => {
      const trendLabel = getBodyMeasurementTrendDirectionLabel(entry.trend.direction)
      return `
        <div class="trend-block">
          <h3 class="chart-title">${sanitizePdfText(entry.label)}</h3>
          <p class="trend-caption">${sanitizePdfText(trendLabel)} | ${sanitizePdfText(entry.deltaLabel)}</p>
          ${buildTrendLineSvgHtml(entry.trend.buckets, 520, 200, '#d946ef')}
        </div>
      `
    })
    .join('')
}

function buildBodyMeasurementsReportHtml(
  report: BodyMeasurementsReportSummary,
  meta: BodyMeasurementsPdfMeta = {},
) {
  const patientName = meta.patientName?.trim() || 'Paciente'
  const logoSrc = meta.logoSrc ?? ''
  const includeTrendCharts = meta.includeTrendCharts ?? true
  const generatedAt = new Date().toLocaleString('pt-BR')
  const heroValue =
    report.mostChanged !== null
      ? `${report.mostChanged.label}: ${formatBodyMeasurementReportValue(report.mostChanged.id, report.mostChanged.end)}`
      : `${report.trackedMeasurementCount} medidas acompanhadas`

  const waistHipHtml = report.waistHipRatio
    ? `<p class="hero-meta">Relacao cintura/quadril: <strong>${formatBodyMeasurementReportValue('cintura_quadril', report.waistHipRatio.end)}</strong> (${sanitizePdfText(report.waistHipRatio.deltaLabel)})</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatorio de Medidas Corporais</title>
  <style>
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; font-size: 11px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d946ef; padding-bottom: 14px; margin-bottom: 18px; gap: 16px; }
    .brand-logo { height: 46px; width: auto; max-width: 220px; object-fit: contain; display: block; }
    .brand-title { font-size: 22px; font-weight: 800; color: #111827; }
    .doc-meta { text-align: right; color: #6b7280; font-size: 10px; }
    .doc-meta strong { color: #111827; display: block; font-size: 12px; }
    .hero { background: linear-gradient(135deg, #fdf4ff 0%, #ffffff 100%); border: 1px solid #f0abfc; border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; text-align: center; }
    .hero-eyebrow { color: #a21caf; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .hero-value { font-size: 24px; font-weight: 800; color: #111827; margin: 6px 0; }
    .hero-meta { color: #6b7280; font-size: 10px; margin-top: 4px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; text-align: center; }
    .kpi-label { color: #6b7280; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .kpi-value { font-size: 18px; font-weight: 800; margin-top: 4px; color: #111827; }
    .kpi-note { color: #9ca3af; font-size: 9px; margin-top: 2px; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: 800; color: #111827; margin: 0 0 8px; }
    .muted { color: #6b7280; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table th, .data-table td { border-bottom: 1px solid #e5e7eb; padding: 7px 6px; text-align: left; vertical-align: middle; }
    .data-table th { color: #6b7280; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
    .center { text-align: center; }
    .trend-block { margin-bottom: 14px; page-break-inside: avoid; }
    .chart-title { font-size: 11px; font-weight: 800; color: #374151; margin: 0 0 4px; }
    .trend-caption { margin: 0 0 8px; font-size: 10px; color: #6b7280; }
    .trend-line-chart { width: 100%; height: auto; display: block; margin-bottom: 10px; }
    ul { margin: 0; padding-left: 18px; }
    .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 9px; }
    .patient-line { margin-bottom: 12px; color: #374151; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>${logoSrc ? `<img src="${logoSrc}" alt="Telefarmed" class="brand-logo" />` : `<div class="brand-title">Telefarmed</div>`}</div>
    <div class="doc-meta">
      <strong>Medidas Corporais</strong>
      Gerado em ${generatedAt}
    </div>
  </div>

  <p class="patient-line"><strong>Paciente:</strong> ${sanitizePdfText(patientName)} | <strong>Periodo:</strong> ${sanitizePdfText(report.periodLabel)} | <strong>Registros:</strong> ${report.totalReadings}</p>

  <div class="hero">
    <div class="hero-eyebrow">Evolucao corporal</div>
    <div class="hero-value">${sanitizePdfText(heroValue)}</div>
    <div class="hero-meta">${report.trackedMeasurementCount} medidas com dados no periodo · ideal para acompanhamento de emagrecimento e reabilitacao</div>
    ${waistHipHtml}
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Medidas</div>
      <div class="kpi-value">${report.trackedMeasurementCount}</div>
      <div class="kpi-note">com historico</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Principais</div>
      <div class="kpi-value">${report.principal.length}</div>
      <div class="kpi-note">abdomen, quadril...</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Complementares</div>
      <div class="kpi-value">${report.complementar.length}</div>
      <div class="kpi-note">braco, coxa, cintura...</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Destaque</div>
      <div class="kpi-value">${report.mostChanged ? sanitizePdfText(report.mostChanged.shortLabel) : '-'}</div>
      <div class="kpi-note">${report.mostChanged ? sanitizePdfText(report.mostChanged.deltaLabel) : 'Sem mudanca'}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Resumo por medida</h2>
    ${buildMeasurementsTableHtml(report.allSeries)}
  </div>

  <div class="section">
    <h2 class="section-title">Principais mudancas</h2>
    ${buildHighlightsHtml(report)}
  </div>

  <div class="section">
    <h2 class="section-title">Evolucao no periodo</h2>
    ${buildTrendSectionsHtml(report, includeTrendCharts)}
  </div>

  <div class="footer">
    Relatorio de medidas corporais gerado pelo app Telefarmed para apoio a consulta e telemedicina.
    Indicado para acompanhamento de emagrecimento, hipertrofia e reabilitacao. Nao gera alertas automaticos.
  </div>
</body>
</html>`
}

async function createBodyMeasurementsReportPdf(
  report: BodyMeasurementsReportSummary,
  meta: BodyMeasurementsPdfMeta = {},
) {
  let logoSrc = ''
  try {
    logoSrc = await resolvePdfLogoDataUri()
  } catch {
    logoSrc = ''
  }

  const attempts: BodyMeasurementsPdfMeta[] = [
    { ...meta, logoSrc, includeTrendCharts: true },
    { ...meta, logoSrc: '', includeTrendCharts: true },
    { ...meta, logoSrc: '', includeTrendCharts: false },
  ]

  let lastError: unknown = null

  for (const attemptMeta of attempts) {
    try {
      const html = buildBodyMeasurementsReportHtml(report, attemptMeta)
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

export async function shareBodyMeasurementsReportPdf(
  report: BodyMeasurementsReportSummary,
  meta: BodyMeasurementsPdfMeta = {},
) {
  const uri = await createBodyMeasurementsReportPdf(report, meta)
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Compartilhamento indisponivel neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar relatorio de medidas corporais',
  })
}
