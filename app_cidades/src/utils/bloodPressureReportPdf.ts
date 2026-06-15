import * as FileSystem from 'expo-file-system/legacy'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { BloodPressureReportSummary } from '../types/bloodPressure'
import {
  BLOOD_PRESSURE_TIME_SLOT_SHORT_LABELS,
  formatBloodPressureDateTime,
  formatBloodPressureShort,
  formatBloodPressureTime,
  getBloodPressureZone,
} from './bloodPressure'
import {
  formatBloodPressureTargetLabel,
  getBloodPressureTrendDirectionLabel,
} from './bloodPressureReport'
import { buildBloodPressureTrendSvgHtml } from './bloodPressureTrendChart'
import { resolvePdfLogoDataUri } from './pdfBrandLogo'

type BloodPressurePdfMeta = {
  patientName?: string
  logoSrc?: string
  includeTrendChart?: boolean
}

function buildTrendSectionHtml(report: BloodPressureReportSummary, includeTrendChart: boolean) {
  if (!includeTrendChart || report.trend.buckets.length === 0) {
    return '<p class="muted">Sem dados suficientes para tendencia no periodo.</p>'
  }

  return buildBloodPressureTrendSvgHtml(report.trend.buckets)
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

function buildTimeSlotsHtml(report: BloodPressureReportSummary) {
  const rows = report.timeSlots
    .filter((slot) => slot.count > 0)
    .map(
      (slot) => `
        <tr>
          <td>${sanitizePdfText(slot.label)}</td>
          <td class="center">${slot.count}</td>
          <td class="center"><strong>${formatBloodPressureShort(slot.avgSystolic, slot.avgDiastolic)}</strong></td>
          <td class="center">${slot.aboveTargetPct}% acima da meta</td>
        </tr>
      `,
    )
    .join('')

  if (!rows) {
    return '<p class="muted">Sem medições suficientes por horário.</p>'
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Horário</th>
          <th class="center">Medições</th>
          <th class="center">Média</th>
          <th class="center">Acima da meta</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildAlertsHtml(report: BloodPressureReportSummary) {
  const sustained = report.hypertensionPattern.sustainedReadings
    .map(
      (entry) =>
        `<li>${sanitizePdfText(formatBloodPressureDateTime(entry.recordedAt))} | <strong>${formatBloodPressureShort(entry.systolic, entry.diastolic)}</strong></li>`,
    )
    .join('')
  const isolated = report.hypertensionPattern.isolatedPeakReadings
    .map(
      (entry) =>
        `<li>${sanitizePdfText(formatBloodPressureDateTime(entry.recordedAt))} | <strong>${formatBloodPressureShort(entry.systolic, entry.diastolic)}</strong></li>`,
    )
    .join('')

  return `
    <div class="alert-grid">
      <div class="alert-card sustained">
        <div class="alert-count">${report.hypertensionPattern.sustainedDayCount}</div>
        <div class="alert-title">Hipertensão sustentada (dias consecutivos)</div>
        ${sustained ? `<ul>${sustained}</ul>` : '<p class="muted">Nenhum padrão sustentado no período.</p>'}
      </div>
      <div class="alert-card isolated">
        <div class="alert-count">${report.hypertensionPattern.isolatedPeakCount}</div>
        <div class="alert-title">Picos isolados</div>
        ${isolated ? `<ul>${isolated}</ul>` : '<p class="muted">Nenhum pico isolado no período.</p>'}
      </div>
    </div>
  `
}

function buildReadingsTableHtml(report: BloodPressureReportSummary) {
  if (report.readings.length === 0) {
    return '<p class="muted">Nenhuma medição registrada no período selecionado.</p>'
  }

  const rows = report.readings
    .slice(0, 30)
    .map((entry) => {
      const zone = getBloodPressureZone(entry.systolic, entry.diastolic)
      return `
        <tr>
          <td>${sanitizePdfText(formatBloodPressureDateTime(entry.recordedAt))}</td>
          <td class="center"><strong>${formatBloodPressureShort(entry.systolic, entry.diastolic)}</strong></td>
          <td class="center">${sanitizePdfText(formatBloodPressureTime(entry.recordedAt))}</td>
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
          <th class="center">Horario</th>
          <th class="center">Classificacao</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${
      report.readings.length > 30
        ? `<p class="muted footnote">Exibindo 30 de ${report.readings.length} medicoes.</p>`
        : ''
    }
  `
}

export function buildBloodPressureReportHtml(
  report: BloodPressureReportSummary,
  meta: BloodPressurePdfMeta = {},
) {
  const patientName = meta.patientName?.trim() || 'Paciente'
  const logoSrc = meta.logoSrc?.trim() ?? ''
  const includeTrendChart = meta.includeTrendChart !== false
  const generatedAt = sanitizePdfText(new Date().toLocaleString('pt-BR'))
  const trendLabel = sanitizePdfText(getBloodPressureTrendDirectionLabel(report.trend.direction))
  const targetLabel = sanitizePdfText(formatBloodPressureTargetLabel(report.target))
  const peakSlot = report.peakTimeSlot
    ? sanitizePdfText(BLOOD_PRESSURE_TIME_SLOT_SHORT_LABELS[report.peakTimeSlot.slot])
    : '-'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório de Pressão Arterial</title>
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
    .brand-logo { height: 46px; width: auto; max-width: 220px; object-fit: contain; display: block; }
    .brand-title { font-size: 22px; font-weight: 800; color: #111827; }
    .doc-meta { text-align: right; color: #6b7280; font-size: 10px; }
    .doc-meta strong { color: #111827; display: block; font-size: 12px; }
    .hero {
      background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
      border: 1px solid #fde68a;
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 16px;
    }
    .hero-eyebrow { color: #92400e; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .hero-value { font-size: 28px; font-weight: 800; color: #111827; margin: 6px 0; }
    .hero-meta { color: #6b7280; font-size: 10px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; text-align: center; }
    .kpi-label { color: #6b7280; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .kpi-value { font-size: 18px; font-weight: 800; margin-top: 4px; color: #111827; }
    .kpi-note { color: #9ca3af; font-size: 9px; margin-top: 2px; }
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { font-size: 13px; font-weight: 800; color: #111827; margin: 0 0 8px; }
    .section-subtitle { margin-top: 14px; }
    .muted { color: #6b7280; }
    .trend-caption { margin: 0 0 8px; font-size: 10px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .data-table th, .data-table td { border-bottom: 1px solid #e5e7eb; padding: 7px 6px; text-align: left; }
    .data-table th { color: #6b7280; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
    .center { text-align: center; }
    .alert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .alert-card { border-radius: 12px; padding: 12px; border: 1px solid #e5e7eb; }
    .alert-count { font-size: 22px; font-weight: 800; color: #111827; }
    .alert-title { font-size: 10px; font-weight: 700; margin: 4px 0 8px; color: #374151; }
    .alert-card ul { margin: 0; padding-left: 16px; color: #4b5563; }
    .sustained { background: #fef2f2; border-color: #fecaca; }
    .isolated { background: #fffbeb; border-color: #fde68a; }
    .zone-mark { display: inline-block; text-align: center; }
    .zone-mark-text { font-size: 10px; font-weight: 800; display: block; }
    .zone-mark-line { width: 22px; height: 2px; border-radius: 999px; margin: 2px auto 0; }
    .section-trend-history { page-break-inside: auto; margin-bottom: 16px; }
    .trend-line-chart { width: 100%; height: auto; display: block; margin-bottom: 12px; }
    .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 9px; }
    .patient-line { margin-bottom: 12px; color: #374151; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${
        logoSrc
          ? `<img src="${logoSrc}" alt="Telefarmed" class="brand-logo" />`
          : `<div class="brand-title">Telefarmed</div>`
      }
    </div>
    <div class="doc-meta">
      <strong>Relatório de Pressão Arterial</strong>
      Gerado em ${generatedAt}
    </div>
  </div>

  <p class="patient-line"><strong>Paciente:</strong> ${sanitizePdfText(patientName)} | <strong>Periodo:</strong> ${sanitizePdfText(report.periodLabel)} | <strong>Meta:</strong> ${targetLabel}</p>

  <div class="hero">
    <div class="hero-eyebrow">Media do periodo</div>
    <div class="hero-value">${formatBloodPressureShort(report.overall.avgSystolic, report.overall.avgDiastolic)} mmHg</div>
    <div class="hero-meta">
      ${report.totalReadings} medicoes | Sistolica ${report.overall.minSystolic}-${report.overall.maxSystolic} | Diastolica ${report.overall.minDiastolic}-${report.overall.maxDiastolic}
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Na meta</div>
      <div class="kpi-value">${report.overall.inTargetPct}%</div>
      <div class="kpi-note">&lt; ${targetLabel}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Acima da meta</div>
      <div class="kpi-value">${report.aboveTarget.count}</div>
      <div class="kpi-note">${report.aboveTarget.pct}% das medições</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Sustentada</div>
      <div class="kpi-value">${report.hypertensionPattern.sustainedDayCount}</div>
      <div class="kpi-note">dias consecutivos</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Tendência</div>
      <div class="kpi-value">${sanitizePdfText(trendLabel)}</div>
      <div class="kpi-note">${report.trend.systolicChangePct === 0 ? 'estavel' : `${report.trend.systolicChangePct > 0 ? '+' : ''}${report.trend.systolicChangePct}% sistolica`}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Horarios com maior pressao</h2>
    <p class="muted trend-caption">Periodo de pico: ${peakSlot}</p>
    ${buildTimeSlotsHtml(report)}
  </div>

  <div class="section">
    <h2 class="section-title">Padrão de hipertensão</h2>
    ${buildAlertsHtml(report)}
  </div>

  <div class="section-trend-history">
    <h2 class="section-title">Tendencia no periodo</h2>
    <p class="muted trend-caption">Media diaria sistolica e diastolica (mmHg)</p>
    ${buildTrendSectionHtml(report, includeTrendChart)}
    <h2 class="section-title section-subtitle">Historico detalhado</h2>
    ${buildReadingsTableHtml(report)}
  </div>

  <div class="footer">
    Documento gerado pelo app Telefarmed para apoio a consulta medica e telemedicina.
    Classificacao adaptada as faixas AHA (Normal, Elevada, Alta >= 140/90 mmHg). Meta padrao: ${targetLabel}.
  </div>
</body>
</html>`
}

async function createBloodPressureReportPdf(
  report: BloodPressureReportSummary,
  meta: BloodPressurePdfMeta = {},
) {
  let logoSrc = ''
  try {
    logoSrc = await resolvePdfLogoDataUri()
  } catch {
    logoSrc = ''
  }

  const attempts: BloodPressurePdfMeta[] = [
    { ...meta, logoSrc, includeTrendChart: true },
    { ...meta, logoSrc: '', includeTrendChart: true },
    { ...meta, logoSrc: '', includeTrendChart: false },
  ]

  let lastError: unknown = null

  for (const attemptMeta of attempts) {
    try {
      const html = buildBloodPressureReportHtml(report, attemptMeta)
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

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error('Nao foi possivel gerar o PDF do relatorio.')
}

function buildPdfFilename() {
  const stamp = new Date().toISOString().slice(0, 10)
  return `relatorio-pressao-${stamp}.pdf`
}

export async function shareBloodPressureReportPdf(
  report: BloodPressureReportSummary,
  meta: BloodPressurePdfMeta = {},
) {
  const uri = await createBloodPressureReportPdf(report, meta)
  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) {
    throw new Error('Compartilhamento indisponível neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartilhar relatório de pressão arterial',
  })
}

export async function saveBloodPressureReportPdf(
  report: BloodPressureReportSummary,
  meta: BloodPressurePdfMeta = {},
) {
  const uri = await createBloodPressureReportPdf(report, meta)
  const filename = buildPdfFilename()
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
      dialogTitle: 'Salvar relatório de pressão arterial',
    })
  }

  return destination
}
