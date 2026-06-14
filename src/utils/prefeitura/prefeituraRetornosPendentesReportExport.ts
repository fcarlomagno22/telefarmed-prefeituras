import { brand } from '../../config/brand'
import type { RetornosPendentesReportApi } from '../../types/prefeituraRelatorios'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'

type ExportContext = { report: RetornosPendentesReportApi; generatedAtLabel: string }

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function resolveAssetUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}
function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}
function formatPercent(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}
const HIGHLIGHT_TONE_STYLE = {
  red: 'border:1px solid #fecdd3;background:#fff1f2;color:#9f1239;',
  green: 'border:1px solid #bbf7d0;background:#ecfdf5;color:#065f46;',
  amber: 'border:1px solid #fde68a;background:#fffbeb;color:#92400e;',
  blue: 'border:1px solid #bae6fd;background:#f0f9ff;color:#0c4a6e;',
} as const

function buildStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; background: #fff; line-height: 1.45; }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 32px 36px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; }
    .brand-bar { height: 4px; background: #ff6b00; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .header img { height: 36px; width: auto; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; }
    h1 { font-size: 24px; font-weight: 700; color: #111827; margin-top: 4px; }
    .subtitle { margin-top: 4px; font-size: 13px; color: #6b7280; max-width: 42rem; }
    .meta { margin-top: 12px; font-size: 12px; color: #6b7280; } .meta p + p { margin-top: 4px; }
    section { margin-top: 28px; } h2 { font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid #ff6b00; padding-bottom: 8px; margin-bottom: 14px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; padding: 16px; text-align: center; }
    .card-label { font-size: 12px; color: #6b7280; font-weight: 500; } .card-value { margin-top: 4px; font-size: 24px; font-weight: 700; color: #111827; }
    .highlight-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .highlight-card { border-radius: 12px; padding: 12px 16px; text-align: center; }
    .highlight-title { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .highlight-subtitle { margin-top: 4px; font-size: 12px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; }
    th { background: #f9fafb; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280; }
    th.metric, td.metric { text-align: center; } th.unit, td.unit { text-align: left; font-weight: 700; }
    tr:nth-child(even) td { background: #fafafa; }
    .chart-wrap { margin-top: 8px; } .chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 176px; }
    .chart-bar-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .chart-bar-value { font-size: 10px; font-weight: 600; color: #6b7280; } .chart-bar-label { font-size: 10px; font-weight: 500; color: #6b7280; }
    .chart-bar { width: 100%; max-width: 32px; border-radius: 8px 8px 0 0; background: linear-gradient(to top, #dc2626, #f87171); }
    .chart-caption { margin-top: 12px; font-size: 12px; color: #6b7280; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280; }
    .footer p + p { margin-top: 4px; color: #9ca3af; }
  `
}

function buildChart(points: Array<{ label: string; value: number }>, mode: 'daily' | 'monthly') {
  const max = Math.max(...points.map((p) => p.value), 1)
  const bars = points
    .map((point) => {
      const h = Math.max(8, Math.round((point.value / max) * 120))
      return `<div class="chart-bar-col"><span class="chart-bar-value">${point.value > 0 ? formatNumber(point.value) : ''}</span><div class="chart-bar" style="height:${h}px"></div><span class="chart-bar-label">${escapeHtml(point.label)}</span></div>`
    })
    .join('')
  return `<div class="chart-wrap"><div class="chart-bars">${bars}</div><p class="chart-caption">Evolução ${mode === 'monthly' ? 'mensal' : 'diária'} de retornos pendentes na rede municipal.</p></div>`
}

export function buildRetornosPendentesReportHtml({ report, generatedAtLabel }: ExportContext) {
  const logoUrl = resolveAssetUrl(brand.logoUrl)
  const highlightCards = report.highlights
    .map(
      (item) =>
        `<article class="highlight-card" style="${HIGHLIGHT_TONE_STYLE[item.tone]}"><p class="highlight-title">${escapeHtml(item.title)}</p><p class="highlight-subtitle">${escapeHtml(item.subtitle)}</p></article>`,
    )
    .join('')
  const breakdownRows = report.breakdown
    .map(
      (row) =>
        `<tr><td class="unit">${escapeHtml(row.label)}</td><td class="metric">${formatNumber(row.count)}</td><td class="metric">${formatPercent(row.sharePercent)}%</td></tr>`,
    )
    .join('')
  const unitRows = report.units
    .map(
      (row) =>
        `<tr><td class="unit">${escapeHtml(row.name)}</td><td class="metric">${escapeHtml(row.region)}</td><td class="metric">${formatNumber(row.count)}</td><td class="metric">${formatPercent(row.sharePercent)}%</td></tr>`,
    )
    .join('')
  const patientRows = report.patients
    .map(
      (row) =>
        `<tr><td class="unit">${escapeHtml(row.patientName)}</td><td class="metric">${escapeHtml(row.unitName)}</td><td class="metric">${escapeHtml(row.scheduledDate)}</td><td class="metric">${escapeHtml(row.status)}</td><td class="metric">${formatNumber(row.daysOverdue)}</td></tr>`,
    )
    .join('')
  const kpiCards = report.summary.kpis
    .map(
      (kpi) =>
        `<article class="card"><p class="card-label">${escapeHtml(kpi.label)}</p><p class="card-value">${escapeHtml(kpi.value)}</p><p class="subtitle">${escapeHtml(kpi.footer)}</p></article>`,
    )
    .join('')
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /><title>${escapeHtml(report.title)}</title><style>${buildStyles()}</style></head><body><main><div class="brand-bar"></div><header class="header"><div><p class="eyebrow">Relatório operacional</p><h1>${escapeHtml(report.title)}</h1><p class="subtitle">${escapeHtml(report.description)}</p><div class="meta"><p><strong>${escapeHtml(report.entidadeRazaoSocial)}</strong> · ${escapeHtml(brand.appName)}</p><p>Período: <strong>${escapeHtml(report.periodLabel)}</strong></p></div></div><img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.appName)}" /></header><section><div class="summary-grid"><article class="card"><p class="card-label">Retornos pendentes</p><p class="card-value">${formatNumber(report.summary.pendingCount)}</p></article><article class="card"><p class="card-label">Não agendados</p><p class="card-value">${formatNumber(report.summary.notScheduledCount)}</p></article><article class="card"><p class="card-label">Não realizados</p><p class="card-value">${formatNumber(report.summary.notPerformedCount)}</p></article><article class="card"><p class="card-label">Atrasados</p><p class="card-value">${formatNumber(report.summary.overdueCount)}</p></article></div></section><section><h2>Destaques do período</h2><div class="highlight-grid">${highlightCards}</div></section><section><h2>Composição dos retornos</h2><table><thead><tr><th class="unit">Situação</th><th class="metric">Volume</th><th class="metric">Participação</th></tr></thead><tbody>${breakdownRows}</tbody></table></section><section><h2>Unidades com retornos pendentes</h2><table><thead><tr><th class="unit">Unidade</th><th class="metric">Região</th><th class="metric">Pendências</th><th class="metric">Participação</th></tr></thead><tbody>${unitRows}</tbody></table></section><section><h2>Pacientes em destaque</h2><table><thead><tr><th class="unit">Paciente</th><th class="metric">Unidade</th><th class="metric">Data</th><th class="metric">Status</th><th class="metric">Dias atraso</th></tr></thead><tbody>${patientRows}</tbody></table></section><section><h2>Evolução das pendências</h2>${buildChart(report.evolution.pendingPoints, report.evolution.mode)}</section><section><h2>Indicadores do período</h2><div class="kpi-grid">${kpiCards}</div></section><footer class="footer"><p>Relatório gerado em <strong>${escapeHtml(generatedAtLabel)}</strong> por <strong>${escapeHtml(report.generatedBy)}</strong></p><p>${escapeHtml(report.description)}</p></footer></main></body></html>`
}

function createExportFrame(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = ['position:fixed', 'left:-10000px', 'top:0', 'width:1100px', 'height:1px', 'border:0', 'opacity:0', 'pointer-events:none'].join(';')
  document.body.appendChild(iframe)
  const ownerDocument = iframe.contentDocument
  if (!ownerDocument) {
    document.body.removeChild(iframe)
    throw new Error('Não foi possível preparar a exportação do PDF.')
  }
  ownerDocument.open()
  ownerDocument.write(html)
  ownerDocument.close()
  return iframe
}
async function waitForExportFrame(iframe: HTMLIFrameElement) {
  const ownerDocument = iframe.contentDocument
  if (!ownerDocument) return
  if (ownerDocument.readyState !== 'complete') {
    await new Promise<void>((resolve) => {
      iframe.addEventListener('load', () => resolve(), { once: true })
    })
  }
  if (ownerDocument.fonts?.ready) await ownerDocument.fonts.ready
  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 400)
  })
}
export async function exportPrefeituraRetornosPendentesReportPdf(context: ExportContext) {
  const filename = pdfFilenameFromLabel('retornos-pendentes', context.report.periodLabel)
  const html = buildRetornosPendentesReportHtml(context)
  const exportFrame = createExportFrame(html)
  try {
    await waitForExportFrame(exportFrame)
    const exportWindow = exportFrame.contentWindow
    if (!exportWindow) throw new Error('Não foi possível gerar o PDF do relatório.')
    await downloadWindowAsPdf(exportWindow, { filename, scale: 2, marginMm: 4 })
  } finally {
    if (exportFrame.parentNode) exportFrame.parentNode.removeChild(exportFrame)
  }
}
