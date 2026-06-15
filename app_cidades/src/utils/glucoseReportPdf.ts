import * as FileSystem from 'expo-file-system/legacy'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { GlucoseReportSummary } from '../types/glucose'
import {
  formatGlucoseDateTime,
  getGlucoseContextLabel,
  getGlucoseZone,
} from './glucose'
import { getTrendDirectionLabel } from './glucoseReport'
import { buildTrendLineSvgHtml } from './glucoseTrendChart'
import { resolvePdfLogoDataUri } from './pdfBrandLogo'

type GlucosePdfMeta = {
  patientName?: string
  logoSrc?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatPct(value: number) {
  return `${value}%`
}

function buildTrendChartHtml(report: GlucoseReportSummary) {
  return buildTrendLineSvgHtml(report.trend.buckets)
}

function buildContextRow(label: string, stats: GlucoseReportSummary['fasting']) {
  if (!stats) {
    return `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td class="center">—</td>
        <td class="center">—</td>
        <td class="center">—</td>
      </tr>
    `
  }

  return `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td class="center">${stats.count}</td>
      <td class="center"><strong>${stats.avg} mg/dL</strong></td>
      <td class="center">${formatPct(stats.inTargetPct)} na meta</td>
    </tr>
  `
}

function buildAlertsHtml(report: GlucoseReportSummary) {
  const hypo = report.hypoglycemia.readings
    .map(
      (entry) =>
        `<li>${escapeHtml(formatGlucoseDateTime(entry.recordedAt))} · <strong>${entry.amountMg} mg/dL</strong> · ${escapeHtml(getGlucoseContextLabel(entry.context))}</li>`,
    )
    .join('')
  const hyper = report.hyperglycemia.readings
    .map(
      (entry) =>
        `<li>${escapeHtml(formatGlucoseDateTime(entry.recordedAt))} · <strong>${entry.amountMg} mg/dL</strong> · ${escapeHtml(getGlucoseContextLabel(entry.context))}</li>`,
    )
    .join('')

  return `
    <div class="alert-grid">
      <div class="alert-card hypo">
        <div class="alert-count">${report.hypoglycemia.count}</div>
        <div class="alert-title">Hipoglicemias (&lt; 70 mg/dL)</div>
        ${hypo ? `<ul>${hypo}</ul>` : '<p class="muted">Nenhum episódio no período.</p>'}
      </div>
      <div class="alert-card hyper">
        <div class="alert-count">${report.hyperglycemia.count}</div>
        <div class="alert-title">Picos elevados</div>
        ${hyper ? `<ul>${hyper}</ul>` : '<p class="muted">Nenhum pico relevante no período.</p>'}
      </div>
    </div>
  `
}

function buildZoneMarkHtml(zone: { label: string; color: string }) {
  return `
    <span class="zone-mark">
      <span class="zone-mark-text" style="color:${zone.color}">${zone.label}</span>
      <span class="zone-mark-line" style="background:${zone.color}"></span>
    </span>
  `
}

function buildReadingsTableHtml(report: GlucoseReportSummary) {
  if (report.readings.length === 0) {
    return '<p class="muted">Nenhuma medição registrada no período selecionado.</p>'
  }

  const rows = report.readings
    .slice(0, 40)
    .map((entry) => {
      const zone = getGlucoseZone(entry.amountMg, entry.context)
      return `
        <tr>
          <td>${escapeHtml(formatGlucoseDateTime(entry.recordedAt))}</td>
          <td class="center"><strong>${entry.amountMg} mg/dL</strong></td>
          <td class="center">${escapeHtml(getGlucoseContextLabel(entry.context))}</td>
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
          <th class="center">Classificação</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${
      report.readings.length > 40
        ? `<p class="muted footnote">Exibindo 40 de ${report.readings.length} medições.</p>`
        : ''
    }
  `
}

export function buildGlucoseReportHtml(report: GlucoseReportSummary, meta: GlucosePdfMeta = {}) {
  const patientName = meta.patientName?.trim() || 'Paciente'
  const logoSrc = meta.logoSrc?.trim() ?? ''
  const generatedAt = new Date().toLocaleString('pt-BR')
  const trendLabel = getTrendDirectionLabel(report.trend.direction)
  const trendChange =
    report.trend.changePct === 0
      ? 'variação mínima'
      : `${report.trend.changePct > 0 ? '+' : ''}${report.trend.changePct}%`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório de Glicemia</title>
  <style>
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      margin: 0;
      font-size: 11px;
      line-height: 1.45;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #ff6b00;
      padding-bottom: 14px;
      margin-bottom: 18px;
      gap: 16px;
    }
    .brand-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    .brand-logo {
      height: 46px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.4px;
    }
    .doc-meta {
      text-align: right;
      color: #6b7280;
      font-size: 10px;
    }
    .doc-meta strong { color: #111827; display: block; font-size: 12px; }
    .hero {
      background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
      border: 1px solid #fed7aa;
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 16px;
    }
    .hero h1 {
      margin: 0 0 4px;
      font-size: 20px;
      color: #9a3412;
    }
    .hero p { margin: 0; color: #6b7280; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fff;
    }
    .kpi-label {
      color: #6b7280;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-weight: 700;
    }
    .kpi-value {
      margin-top: 6px;
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .kpi-note { margin-top: 4px; color: #6b7280; font-size: 9px; }
    .section {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .section-trend-history {
      page-break-inside: auto;
      margin-bottom: 16px;
    }
    .section-subtitle {
      margin: 10px 0 8px;
      page-break-before: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 8px;
      padding-left: 10px;
      border-left: 4px solid #ff6b00;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      page-break-inside: auto;
    }
    .data-table th, .data-table td {
      border-bottom: 1px solid #e5e7eb;
      padding: 8px 6px;
      text-align: left;
      vertical-align: middle;
    }
    .data-table th.center, .data-table td.center {
      text-align: center;
    }
    .data-table th {
      background: #f9fafb;
      color: #374151;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .center { text-align: center !important; }
    .muted { color: #6b7280; }
    .footnote { margin-top: 6px; font-size: 9px; }
    .alert-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .alert-card {
      border-radius: 12px;
      padding: 12px;
      border: 1px solid #e5e7eb;
    }
    .alert-card.hypo { background: #eff6ff; border-color: #bfdbfe; }
    .alert-card.hyper { background: #fef2f2; border-color: #fecaca; }
    .alert-count {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
    }
    .alert-title {
      font-weight: 700;
      margin: 4px 0 8px;
      color: #374151;
    }
    .alert-card ul {
      margin: 0;
      padding-left: 16px;
    }
    .alert-card li { margin-bottom: 4px; }
    .trend-line-chart {
      width: 100%;
      height: 220px;
      display: block;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }
    .trend-caption {
      margin: -4px 0 6px;
      font-size: 10px;
    }
    .zone-mark {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 52px;
    }
    .zone-mark-text {
      font-size: 10px;
      font-weight: 700;
      line-height: 1.2;
    }
    .zone-mark-line {
      display: block;
      width: 30px;
      height: 2px;
      border-radius: 999px;
      transform: rotate(-3deg);
    }
    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-block">
      ${
        logoSrc
          ? `<img src="${logoSrc}" alt="Telefarmed" class="brand-logo" />`
          : `<div class="brand-title">Telefarmed</div>`
      }
    </div>
    <div class="doc-meta">
      <strong>Relatório de Glicemia</strong>
      Gerado em ${escapeHtml(generatedAt)}
    </div>
  </div>

  <div class="hero">
    <h1>${escapeHtml(patientName)}</h1>
    <p>Período analisado: <strong>${escapeHtml(report.periodLabel)}</strong> · ${report.totalReadings} medições</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Média geral</div>
      <div class="kpi-value">${report.overall.avg || '—'}</div>
      <div class="kpi-note">mg/dL no período</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Faixa</div>
      <div class="kpi-value">${report.overall.min || '—'}–${report.overall.max || '—'}</div>
      <div class="kpi-note">mínimo e máximo</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Dentro da meta</div>
      <div class="kpi-value">${formatPct(report.overall.inTargetPct)}</div>
      <div class="kpi-note">${formatPct(report.overall.outOfTargetPct)} fora da meta</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Tendência</div>
      <div class="kpi-value" style="font-size:16px;">${escapeHtml(trendLabel)}</div>
      <div class="kpi-note">${escapeHtml(trendChange)} vs início do período</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Médias por contexto</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Contexto</th>
          <th class="center">Medições</th>
          <th class="center">Média</th>
          <th class="center">Controle</th>
        </tr>
      </thead>
      <tbody>
        ${buildContextRow('Jejum', report.fasting)}
        ${buildContextRow('Pós-refeição', report.postMeal)}
        ${buildContextRow('Pré-refeição', report.preMeal)}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2 class="section-title">Picos e hipoglicemias</h2>
    ${buildAlertsHtml(report)}
  </div>

  <div class="section-trend-history">
    <h2 class="section-title">Tendência no período</h2>
    <p class="muted trend-caption">Média diária de glicemia (mg/dL)</p>
    ${buildTrendChartHtml(report)}
    <h2 class="section-title section-subtitle">Histórico detalhado</h2>
    ${buildReadingsTableHtml(report)}
  </div>

  <div class="footer">
    Documento gerado pelo app Telefarmed para apoio à consulta médica. Não substitui avaliação clínica presencial.
    Referências adaptadas às faixas por contexto (jejum, pós-refeição e antes de dormir).
  </div>
</body>
</html>`
}

async function createGlucoseReportPdf(report: GlucoseReportSummary, meta: GlucosePdfMeta = {}) {
  const logoSrc = await resolvePdfLogoDataUri()
  const html = buildGlucoseReportHtml(report, { ...meta, logoSrc })
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  })
  return uri
}

function buildPdfFilename(report: GlucoseReportSummary) {
  const stamp = new Date().toISOString().slice(0, 10)
  return `relatorio-glicemia-${stamp}.pdf`
}

export async function shareGlucoseReportPdf(report: GlucoseReportSummary, meta: GlucosePdfMeta = {}) {
  const uri = await createGlucoseReportPdf(report, meta)
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Compartilhamento indisponível neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar relatório de glicemia',
  })
}

export async function saveGlucoseReportPdf(report: GlucoseReportSummary, meta: GlucosePdfMeta = {}) {
  const uri = await createGlucoseReportPdf(report, meta)
  const filename = buildPdfFilename(report)
  const baseDirectory = FileSystem.documentDirectory
  if (!baseDirectory) {
    throw new Error('Armazenamento local indisponível neste dispositivo.')
  }

  const destination = `${baseDirectory}${filename}`
  await FileSystem.copyAsync({ from: uri, to: destination })

  const canShare = await Sharing.isAvailableAsync()
  if (canShare) {
    await Sharing.shareAsync(destination, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Salvar relatório de glicemia',
    })
  }

  return destination
}
