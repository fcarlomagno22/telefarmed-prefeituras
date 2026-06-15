import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { HydrationReportSummary } from '../types/hydration'
import {
  formatHydrationDateLabel,
  formatHydrationDual,
  formatHydrationGoalLabel,
  getHydrationTrendDirectionLabel,
} from './hydrationReport'
import { buildTrendLineSvgHtml } from './glucoseTrendChart'
import { resolvePdfLogoDataUri } from './pdfBrandLogo'

type HydrationPdfMeta = {
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
      .replace(/\u2212/g, '-'),
  )
}

function buildDaysTableHtml(report: HydrationReportSummary) {
  if (report.days.length === 0) {
    return '<p class="muted">Nenhum registro de hidratacao no periodo selecionado.</p>'
  }

  const rows = report.days
    .slice(0, 31)
    .map((day) => {
      const belowGoal = day.totalMl < report.goalMl
      return `
        <tr>
          <td>${sanitizePdfText(formatHydrationDateLabel(day.date))}</td>
          <td class="center"><strong>${sanitizePdfText(formatHydrationDual(day.totalMl))}</strong></td>
          <td class="center">${belowGoal ? 'Abaixo da meta' : 'Na meta'}</td>
        </tr>
      `
    })
    .join('')

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Dia</th>
          <th class="center">Ingestao</th>
          <th class="center">Meta ${sanitizePdfText(formatHydrationGoalLabel(report.goalMl))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildBelowGoalHtml(report: HydrationReportSummary) {
  if (report.belowGoalDays.length === 0) {
    return '<p class="muted">Nenhum dia abaixo da meta no periodo.</p>'
  }

  return `<ul>${report.belowGoalDays
    .slice(0, 12)
    .map(
      (day) =>
        `<li>${sanitizePdfText(formatHydrationDateLabel(day.date))} | <strong>${sanitizePdfText(formatHydrationDual(day.totalMl))}</strong></li>`,
    )
    .join('')}</ul>`
}

function buildHydrationReportHtml(report: HydrationReportSummary, meta: HydrationPdfMeta = {}) {
  const patientName = meta.patientName?.trim() || 'Paciente'
  const logoSrc = meta.logoSrc ?? ''
  const includeTrendChart = meta.includeTrendChart ?? true
  const generatedAt = new Date().toLocaleString('pt-BR')
  const trendLabel = getHydrationTrendDirectionLabel(report.trend.direction)

  const trendHtml =
    includeTrendChart && report.trend.buckets.length >= 2
      ? buildTrendLineSvgHtml(report.trend.buckets, 520, 200, '#0ea5e9')
      : '<p class="muted">Sem dados suficientes para tendencia no periodo.</p>'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatorio de Hidratacao</title>
  <style>
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; font-size: 11px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0ea5e9; padding-bottom: 14px; margin-bottom: 18px; gap: 16px; }
    .brand-logo { height: 46px; width: auto; max-width: 220px; object-fit: contain; display: block; }
    .brand-title { font-size: 22px; font-weight: 800; color: #111827; }
    .doc-meta { text-align: right; color: #6b7280; font-size: 10px; }
    .doc-meta strong { color: #111827; display: block; font-size: 12px; }
    .hero { background: linear-gradient(135deg, #ecfeff 0%, #ffffff 100%); border: 1px solid #7dd3fc; border-radius: 14px; padding: 16px 18px; margin-bottom: 16px; text-align: center; }
    .hero-eyebrow { color: #0369a1; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
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
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table th, .data-table td { border-bottom: 1px solid #e5e7eb; padding: 7px 6px; text-align: left; vertical-align: middle; }
    .data-table th { color: #6b7280; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
    .center { text-align: center; }
    .trend-caption { margin: 0 0 8px; font-size: 10px; color: #6b7280; }
    ul { margin: 0; padding-left: 18px; }
    .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 9px; }
    .patient-line { margin-bottom: 12px; color: #374151; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>${logoSrc ? `<img src="${logoSrc}" alt="Telefarmed" class="brand-logo" />` : `<div class="brand-title">Telefarmed</div>`}</div>
    <div class="doc-meta">
      <strong>Hidratacao</strong>
      Gerado em ${generatedAt}
    </div>
  </div>

  <p class="patient-line"><strong>Paciente:</strong> ${sanitizePdfText(patientName)} | <strong>Periodo:</strong> ${sanitizePdfText(report.periodLabel)} | <strong>Meta diaria:</strong> ${sanitizePdfText(formatHydrationGoalLabel(report.goalMl))}</p>

  <div class="hero">
    <div class="hero-eyebrow">Media diaria de agua</div>
    <div class="hero-value">${sanitizePdfText(formatHydrationDual(report.dailyAverageMl))}</div>
    <div class="hero-meta">Relatorio de habito | util para idosos, gestantes e prevencao de calculo renal</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Total no periodo</div>
      <div class="kpi-value">${sanitizePdfText(formatHydrationDual(report.totalMl))}</div>
      <div class="kpi-note">${report.daysTracked} dias</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Abaixo da meta</div>
      <div class="kpi-value">${report.daysBelowGoal}</div>
      <div class="kpi-note">${report.belowGoalPct}% dos dias</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Na meta</div>
      <div class="kpi-value">${report.daysAtOrAboveGoal}</div>
      <div class="kpi-note">${report.atOrAboveGoalPct}% dos dias</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Tendencia</div>
      <div class="kpi-value">${sanitizePdfText(trendLabel)}</div>
      <div class="kpi-note">${report.trend.changePct !== 0 ? `${report.trend.changePct > 0 ? '+' : ''}${report.trend.changePct}%` : 'Estavel'}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Dias abaixo da meta</h2>
    ${buildBelowGoalHtml(report)}
  </div>

  <div class="section">
    <h2 class="section-title">Tendencia no periodo</h2>
    <p class="trend-caption">${sanitizePdfText(trendLabel)}</p>
    ${trendHtml}
  </div>

  <div class="section">
    <h2 class="section-title">Historico diario</h2>
    ${buildDaysTableHtml(report)}
  </div>

  <div class="footer">
    Relatorio de hidratacao gerado pelo app Telefarmed para acompanhamento de habitos.
    Nao substitui orientacao medica individualizada, especialmente em gestacao ou doenca renal.
  </div>
</body>
</html>`
}

async function createHydrationReportPdf(
  report: HydrationReportSummary,
  meta: HydrationPdfMeta = {},
) {
  let logoSrc = ''
  try {
    logoSrc = await resolvePdfLogoDataUri()
  } catch {
    logoSrc = ''
  }

  const attempts: HydrationPdfMeta[] = [
    { ...meta, logoSrc, includeTrendChart: true },
    { ...meta, logoSrc: '', includeTrendChart: true },
    { ...meta, logoSrc: '', includeTrendChart: false },
  ]

  let lastError: unknown = null

  for (const attemptMeta of attempts) {
    try {
      const html = buildHydrationReportHtml(report, attemptMeta)
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

export async function shareHydrationReportPdf(
  report: HydrationReportSummary,
  meta: HydrationPdfMeta = {},
) {
  const uri = await createHydrationReportPdf(report, meta)
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Compartilhamento indisponivel neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar relatorio de hidratacao',
  })
}
