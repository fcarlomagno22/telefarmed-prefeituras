import * as FileSystem from 'expo-file-system/legacy'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { BodyCompositionReportSummary, AbdomenReading, ImcReading } from '../types/bodyComposition'
import { IMC_REFERENCE_ZONES } from './bmi'
import {
  formatCircumferenceCm,
  formatCompositionDate,
  formatImcValue,
  formatWeightKg,
  getCompositionTrendDirectionLabel,
} from './bodyCompositionReport'
import { buildTrendLineSvgHtml } from './glucoseTrendChart'
import { resolvePdfLogoDataUri } from './pdfBrandLogo'

type BodyCompositionPdfMeta = {
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
      .replace(/\u2265/g, '>=')
      .replace(/\u2264/g, '<='),
  )
}

function buildZoneMarkHtml(label: string, color: string) {
  return `
    <span class="zone-mark">
      <span class="zone-mark-text" style="color:${color}">${sanitizePdfText(label)}</span>
      <span class="zone-mark-line" style="background:${color}"></span>
    </span>
  `
}

function buildTrendSection(title: string, caption: string, buckets: { label: string; avg: number; count: number }[], accent: string) {
  if (buckets.length === 0) {
    return `<p class="muted">${sanitizePdfText(title)}: sem dados no periodo.</p>`
  }

  return `
    <h3 class="chart-title">${sanitizePdfText(title)}</h3>
    <p class="muted trend-caption">${sanitizePdfText(caption)}</p>
    ${buildTrendLineSvgHtml(buckets, 520, 180, accent)}
  `
}

function buildImcZonesHtml() {
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Classificacao OMS</th>
          <th class="center">Faixa IMC</th>
        </tr>
      </thead>
      <tbody>
        ${IMC_REFERENCE_ZONES.map(
          (zone) => `
            <tr>
              <td>${buildZoneMarkHtml(zone.label, zone.color)}</td>
              <td class="center">${sanitizePdfText(zone.rangeLabel)} kg/m2</td>
            </tr>
          `,
        ).join('')}
      </tbody>
    </table>
  `
}

function buildCombinedHistoryHtml(report: BodyCompositionReportSummary) {
  const byDate = new Map<
    string,
    {
      weight?: number
      imc?: ImcReading
      abdomen?: AbdomenReading
    }
  >()

  report.weight.readings.forEach((reading) => {
    const current = byDate.get(reading.date) ?? {}
    const imcReading = report.imc.readings.find((entry) => entry.date === reading.date)
    byDate.set(reading.date, { ...current, weight: reading.valueKg, imc: imcReading })
  })

  report.abdomen.readings.forEach((reading) => {
    const current = byDate.get(reading.date) ?? {}
    byDate.set(reading.date, { ...current, abdomen: reading })
  })

  const dates = [...byDate.keys()].sort((left, right) => right.localeCompare(left))
  if (dates.length === 0) {
    return '<p class="muted">Nenhum dado registrado no periodo selecionado.</p>'
  }

  const rows = dates.slice(0, 30).map((date) => {
    const entry = byDate.get(date)!
    return `
      <tr>
        <td>${sanitizePdfText(formatCompositionDate(date))}</td>
        <td class="center">${entry.weight !== undefined ? `<strong>${formatWeightKg(entry.weight)}</strong>` : '-'}</td>
        <td class="center">${entry.imc ? formatImcValue(entry.imc.value) : '-'}</td>
        <td class="center">${entry.imc ? buildZoneMarkHtml(entry.imc.zoneLabel, entry.imc.zoneColor) : '-'}</td>
        <td class="center">${entry.abdomen ? `<strong>${formatCircumferenceCm(entry.abdomen.valueCm)}</strong>` : '-'}</td>
        <td class="center">${entry.abdomen ? buildZoneMarkHtml(entry.abdomen.zoneLabel, entry.abdomen.zoneColor) : '-'}</td>
      </tr>
    `
  })

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Data</th>
          <th class="center">Peso</th>
          <th class="center">IMC</th>
          <th class="center">Class. IMC</th>
          <th class="center">Abdomen</th>
          <th class="center">Risco metab.</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  `
}

export function buildBodyCompositionReportHtml(
  report: BodyCompositionReportSummary,
  meta: BodyCompositionPdfMeta = {},
) {
  const patientName = meta.patientName?.trim() || 'Paciente'
  const logoSrc = meta.logoSrc?.trim() ?? ''
  const includeTrendCharts = meta.includeTrendCharts !== false
  const generatedAt = sanitizePdfText(new Date().toLocaleString('pt-BR'))
  const imcLabel =
    report.imc.current !== null && report.imc.zone
      ? `${formatImcValue(report.imc.current)} | ${report.imc.zone.label}`
      : 'Informe peso e altura'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatorio de Composicao Corporal</title>
  <style>
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; font-size: 11px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ff6b00; padding-bottom: 14px; margin-bottom: 18px; gap: 16px; }
    .brand-logo { height: 46px; width: auto; max-width: 220px; object-fit: contain; display: block; }
    .brand-title { font-size: 22px; font-weight: 800; color: #111827; }
    .doc-meta { text-align: right; color: #6b7280; font-size: 10px; }
    .doc-meta strong { color: #111827; display: block; font-size: 12px; }
    .hero { background: linear-gradient(135deg, #ecfeff 0%, #ffffff 100%); border: 1px solid #a5f3fc; border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; }
    .hero-eyebrow { color: #0e7490; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .hero-value { font-size: 28px; font-weight: 800; color: #111827; margin: 6px 0; }
    .hero-meta { color: #6b7280; font-size: 10px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; text-align: center; }
    .kpi-label { color: #6b7280; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .kpi-value { font-size: 18px; font-weight: 800; margin-top: 4px; color: #111827; }
    .kpi-note { color: #9ca3af; font-size: 9px; margin-top: 2px; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: 800; color: #111827; margin: 0 0 8px; }
    .chart-title { font-size: 11px; font-weight: 800; color: #374151; margin: 12px 0 4px; }
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
    .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 9px; }
    .patient-line { margin-bottom: 12px; color: #374151; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>${logoSrc ? `<img src="${logoSrc}" alt="Telefarmed" class="brand-logo" />` : `<div class="brand-title">Telefarmed</div>`}</div>
    <div class="doc-meta">
      <strong>Composicao Corporal</strong>
      Gerado em ${generatedAt}
    </div>
  </div>

  <p class="patient-line"><strong>Paciente:</strong> ${sanitizePdfText(patientName)} | <strong>Periodo:</strong> ${sanitizePdfText(report.periodLabel)} | <strong>Altura:</strong> ${sanitizePdfText(report.profile.height)} | <strong>Peso atual:</strong> ${sanitizePdfText(report.profile.weight)}</p>

  <div class="hero">
    <div class="hero-eyebrow">Indice de massa corporal</div>
    <div class="hero-value">${sanitizePdfText(imcLabel)}</div>
    <div class="hero-meta">${report.imc.zone ? sanitizePdfText(`Referencia OMS: ${report.imc.zone.rangeLabel} kg/m2`) : 'Atualize peso e altura no perfil para calcular o IMC.'}</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Evolucao do peso</div>
      <div class="kpi-value">${sanitizePdfText(report.weight.deltaLabel)}</div>
      <div class="kpi-note">${report.weight.startKg !== null && report.weight.endKg !== null ? `${formatWeightKg(report.weight.startKg)} -> ${formatWeightKg(report.weight.endKg)}` : 'Sem medicoes'}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Peso medio</div>
      <div class="kpi-value">${report.weight.readings.length > 0 ? formatWeightKg(report.weight.avg) : '-'}</div>
      <div class="kpi-note">${report.weight.min > 0 ? `${formatWeightKg(report.weight.min)} - ${formatWeightKg(report.weight.max)}` : 'Sem faixa'}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Circunferencia</div>
      <div class="kpi-value">${report.abdomen.readings.length > 0 ? formatCircumferenceCm(report.abdomen.avg) : '-'}</div>
      <div class="kpi-note">Meta ate ${report.abdomen.idealMaxCm} cm</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Risco metabolico</div>
      <div class="kpi-value">${report.abdomen.elevatedRiskCount}</div>
      <div class="kpi-note">${report.abdomen.aboveIdealPct}% acima do ideal</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Classificacao do IMC (OMS)</h2>
    ${buildImcZonesHtml()}
  </div>

  ${
    includeTrendCharts
      ? `
  <div class="section">
    <h2 class="section-title">Evolucao no periodo</h2>
    ${buildTrendSection('Peso corporal', getCompositionTrendDirectionLabel(report.weight.trend.direction), report.weight.trend.buckets, '#64748b')}
    ${buildTrendSection('Indice de massa corporal', getCompositionTrendDirectionLabel(report.imc.trend.direction), report.imc.trend.buckets, '#0891b2')}
    ${buildTrendSection('Circunferencia abdominal', getCompositionTrendDirectionLabel(report.abdomen.trend.direction), report.abdomen.trend.buckets, '#f97316')}
  </div>
      `
      : ''
  }

  <div class="section">
    <h2 class="section-title">Historico detalhado</h2>
    ${buildCombinedHistoryHtml(report)}
  </div>

  <div class="footer">
    Relatorio de composicao corporal gerado pelo app Telefarmed para apoio a consulta e telemedicina.
    IMC calculado com altura atual do perfil. Circunferencia abdominal classificada conforme referencia OMS por sexo.
  </div>
</body>
</html>`
}

async function createBodyCompositionReportPdf(
  report: BodyCompositionReportSummary,
  meta: BodyCompositionPdfMeta = {},
) {
  let logoSrc = ''
  try {
    logoSrc = await resolvePdfLogoDataUri()
  } catch {
    logoSrc = ''
  }

  const attempts: BodyCompositionPdfMeta[] = [
    { ...meta, logoSrc, includeTrendCharts: true },
    { ...meta, logoSrc: '', includeTrendCharts: true },
    { ...meta, logoSrc: '', includeTrendCharts: false },
  ]

  let lastError: unknown = null

  for (const attemptMeta of attempts) {
    try {
      const html = buildBodyCompositionReportHtml(report, attemptMeta)
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

export async function shareBodyCompositionReportPdf(
  report: BodyCompositionReportSummary,
  meta: BodyCompositionPdfMeta = {},
) {
  const uri = await createBodyCompositionReportPdf(report, meta)
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Compartilhamento indisponivel neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar relatorio de composicao corporal',
  })
}

export async function saveBodyCompositionReportPdf(
  report: BodyCompositionReportSummary,
  meta: BodyCompositionPdfMeta = {},
) {
  const uri = await createBodyCompositionReportPdf(report, meta)
  const filename = `relatorio-composicao-${new Date().toISOString().slice(0, 10)}.pdf`
  const baseDirectory = FileSystem.documentDirectory
  if (!baseDirectory) {
    throw new Error('Armazenamento local indisponivel neste dispositivo.')
  }

  const destination = `${baseDirectory}${filename}`
  await FileSystem.copyAsync({ from: uri, to: destination })

  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(destination, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Salvar relatorio de composicao corporal',
    })
  }

  return destination
}
