import { brand } from '../../config/brand'
import {applyEntidadeCopyToExportText,
  buildEntidadeExportBaseStyles,
  resolveEntidadeExportBranding,
  type EntidadeExportBranding,
  resolveExportAssetUrl,
  escapeExportHtml
} from '../entidadeExportHtml'
import type { UnidadesCriticasReportApi } from '../../types/prefeituraRelatorios'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'

type ExportContext = { report: UnidadesCriticasReportApi; generatedAtLabel: string }

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function resolveAssetUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}
function formatNumber(value: number) { return new Intl.NumberFormat('pt-BR').format(value) }
function formatPercent(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value)
}
function signedPercent(value: number) { return value === 0 ? '0%' : `${value > 0 ? '+' : ''}${formatPercent(value)}%` }
function signedPp(value: number) { return value === 0 ? '0 p.p.' : `${value > 0 ? '+' : ''}${formatPercent(value)} p.p.` }
function signedMinutes(value: number) { return value === 0 ? '0 min' : `${value > 0 ? '+' : ''}${formatNumber(Math.abs(value))} min` }
const HIGHLIGHT_TONE_STYLE = { red: 'border:1px solid #fecdd3;background:#fff1f2;color:#9f1239;', green: 'border:1px solid #bbf7d0;background:#ecfdf5;color:#065f46;', amber: 'border:1px solid #fde68a;background:#fffbeb;color:#92400e;', blue: 'border:1px solid #bae6fd;background:#f0f9ff;color:#0c4a6e;' } as const
function buildReportStyles(branding: EntidadeExportBranding = resolveEntidadeExportBranding()) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; background: #fff; line-height: 1.45; }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 32px 36px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; }
    .brand-bar { height: 4px; background: ${branding.corPrimaria}; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .header img { height: 36px; width: auto; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; }
    h1 { font-size: 24px; font-weight: 700; color: #111827; margin-top: 4px; }
    .subtitle { margin-top: 4px; font-size: 13px; color: #6b7280; max-width: 42rem; }
    .meta { margin-top: 12px; font-size: 12px; color: #6b7280; } .meta p + p { margin-top: 4px; }
    section { margin-top: 28px; }
    h2 { font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid ${branding.corPrimaria}; padding-bottom: 8px; margin-bottom: 14px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; padding: 16px; text-align: center; }
    .card-label { font-size: 12px; color: #6b7280; font-weight: 500; }
    .card-value { margin-top: 4px; font-size: 24px; font-weight: 700; color: #111827; }
    .card-value-sm { margin-top: 4px; font-size: 18px; font-weight: 700; color: #111827; }
    .card-footer { margin-top: 4px; font-size: 12px; color: #6b7280; }
    .card-footer-positive { color: #059669; font-weight: 600; }
    .card-footer-negative { color: #b45309; font-weight: 600; }
    .highlight-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .highlight-card { border-radius: 12px; padding: 12px 16px; text-align: center; }
    .highlight-title { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .highlight-subtitle { margin-top: 4px; font-size: 12px; font-weight: 500; }
    .chart-wrap { margin-top: 8px; } .chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 176px; }
    .chart-bar-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .chart-bar-value { font-size: 10px; font-weight: 600; color: #6b7280; }
    .chart-bar { width: 100%; max-width: 32px; border-radius: 8px 8px 0 0; }
    .chart-bar-primary { background: linear-gradient(to top, #4f46e5, #818cf8); }
    .chart-bar-volume { background: linear-gradient(to top, #ea580c, #fb923c); }
    .chart-bar-success { background: linear-gradient(to top, #059669, #34d399); }
    .chart-bar-danger { background: linear-gradient(to top, #dc2626, #f87171); }
    .chart-bar-label { font-size: 10px; font-weight: 500; color: #6b7280; }
    .chart-caption { margin-top: 12px; font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; }
    th { background: #f9fafb; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280; }
    th.metric, td.metric { text-align: center; } th.unit, td.unit { text-align: left; font-weight: 700; }
    tr:nth-child(even) td { background: #fafafa; }
    .positive { color: #047857; font-weight: 600; } .negative { color: #b45309; font-weight: 600; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280; }
    .footer p + p { margin-top: 4px; color: #9ca3af; }
    .badge-critico { color: #b91c1c; font-weight: 700; } .badge-atencao { color: #b45309; font-weight: 700; }
  `
}
function buildHighlights(report: { highlights: Array<{ title: string; subtitle: string; tone: 'red' | 'green' | 'amber' | 'blue' }> }) {
  if (report.highlights.length === 0) return ''
  const cards = report.highlights.map((item) => `<article class="highlight-card" style="${HIGHLIGHT_TONE_STYLE[item.tone]}"><p class="highlight-title">${escapeHtml(item.title)}</p><p class="highlight-subtitle">${escapeHtml(item.subtitle)}</p></article>`).join('')
  return `<section><h2>Destaques do período</h2><div class="highlight-grid">${cards}</div></section>`
}
function buildEvolutionChart(points: Array<{ label: string; value: number }>, mode: 'daily' | 'monthly', caption: string, barClass: string, valueSuffix = '') {
  const max = Math.max(...points.map((p) => p.value), 1)
  const bars = points.map((point) => {
    const h = Math.max(8, Math.round((point.value / max) * 120))
    return `<div class="chart-bar-col"><span class="chart-bar-value">${point.value > 0 ? `${formatNumber(point.value)}${valueSuffix}` : ''}</span><div class="chart-bar ${barClass}" style="height:${h}px"></div><span class="chart-bar-label">${escapeHtml(point.label)}</span></div>`
  }).join('')
  return `<div class="chart-wrap"><div class="chart-bars">${bars}</div><p class="chart-caption">Evolução ${mode === 'monthly' ? 'mensal' : 'diária'} de ${caption} na rede municipal.</p></div>`
}
function buildKpiCards(kpis: Array<{ label: string; value: string; footer: string }>) {
  return `<div class="kpi-grid">${kpis.map((kpi) => `<article class="card"><p class="card-label">${escapeHtml(kpi.label)}</p><p class="card-value-sm">${escapeHtml(kpi.value)}</p><p class="card-footer">${escapeHtml(kpi.footer)}</p></article>`).join('')}</div>`
}
function buildReportShell(report: { title: string; description: string; entidadeRazaoSocial: string; periodLabel: string; generatedBy: string }, generatedAtLabel: string, body: string, branding: EntidadeExportBranding = resolveEntidadeExportBranding()) {
  const logoUrl = resolveExportAssetUrl(branding.logoUrl)
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /><title>${escapeHtml(report.title)}</title><style>${buildReportStyles(branding)}</style></head><body><main><div class="brand-bar"></div><header class="header"><div><p class="eyebrow">Relatório operacional</p><h1>${escapeHtml(report.title)}</h1><p class="subtitle">${escapeHtml(report.description)}</p><div class="meta"><p><strong>${escapeHtml(report.entidadeRazaoSocial)}</strong> · ${escapeExportHtml(branding.brandName)}</p><p>Período: <strong>${escapeHtml(report.periodLabel)}</strong></p></div></div><img src="${escapeHtml(logoUrl)}" alt="${escapeExportHtml(branding.brandName)}" /></header>${body}<footer class="footer"><p>Relatório gerado em <strong>${escapeHtml(generatedAtLabel)}</strong> por <strong>${escapeHtml(report.generatedBy)}</strong></p><p>${escapeHtml(report.description)}</p></footer></main></body></html>`
  return applyEntidadeCopyToExportText(html)
}
export function buildUnidadesCriticasReportHtml({ report, generatedAtLabel }: ExportContext) {
  const summary = `<section><div class="summary-grid">
    <article class="card"><p class="card-label">Unidades críticas</p><p class="card-value">${formatNumber(report.summary.criticalUnitsCount)}</p><p class="card-footer card-footer-negative">Abaixo dos parâmetros mínimos</p></article>
    <article class="card"><p class="card-label">Em atenção</p><p class="card-value">${formatNumber(report.summary.unitsCount - report.summary.criticalUnitsCount)}</p></article>
    <article class="card"><p class="card-label">Itens de ação</p><p class="card-value">${formatNumber(report.summary.actionItemsCount)}</p></article>
    <article class="card"><p class="card-label">Especialidades críticas</p><p class="card-value">${formatNumber(report.summary.criticalSpecialtiesCount)}</p></article>
  </div></section>`
  const unitRows = report.units.map((r) => `<tr><td class="unit">${escapeHtml(r.name)}</td><td class="metric">${escapeHtml(r.region)}</td><td class="metric"><span class="badge-${r.severity}">${r.severity === 'critico' ? 'Crítico' : 'Atenção'}</span></td><td class="metric">${formatNumber(r.issuesCount)}</td><td class="metric">${formatPercent(r.completionRatePercent)}%</td><td class="metric">${formatPercent(r.avgRating, 1)}</td><td class="metric">${formatPercent(r.interruptionRatePercent)}%</td><td class="metric">${formatPercent(r.nps, 1)}</td></tr>`).join('')
  const specRows = report.specialties.map((r) => `<tr><td class="unit">${escapeHtml(r.name)}</td><td class="metric">${escapeHtml(r.unitName)}</td><td class="metric"><span class="badge-${r.severity}">${r.severity === 'critico' ? 'Crítico' : 'Atenção'}</span></td><td class="metric">${formatNumber(r.issuesCount)}</td></tr>`).join('')
  const body = summary + buildHighlights(report) + `<section><h2>Unidades abaixo dos parâmetros</h2><table><thead><tr><th class="unit">Unidade</th><th class="metric">Região</th><th class="metric">Severidade</th><th class="metric">Itens</th><th class="metric">Conclusão</th><th class="metric">Nota</th><th class="metric">Interrupção</th><th class="metric">NPS</th></tr></thead><tbody>${unitRows}</tbody></table></section><section><h2>Especialidades críticas</h2><table><thead><tr><th class="unit">Especialidade</th><th class="metric">Unidade</th><th class="metric">Severidade</th><th class="metric">Itens</th></tr></thead><tbody>${specRows}</tbody></table></section><section><h2>Evolução de unidades críticas</h2>${buildEvolutionChart(report.evolution.criticalCountPoints, report.evolution.mode, 'unidades críticas', 'chart-bar-danger')}</section><section><h2>Indicadores do período</h2>${buildKpiCards(report.summary.kpis)}</section>`
  return applyEntidadeCopyToExportText(buildReportShell(report, generatedAtLabel, body))
}
function createExportFrame(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = ['position:fixed','left:-10000px','top:0','width:1100px','height:1px','border:0','opacity:0','pointer-events:none'].join(';')
  document.body.appendChild(iframe)
  const ownerDocument = iframe.contentDocument
  if (!ownerDocument) { document.body.removeChild(iframe); throw new Error('Não foi possível preparar a exportação do PDF.') }
  ownerDocument.open(); ownerDocument.write(html); ownerDocument.close()
  return iframe
}

async function waitForExportFrame(iframe: HTMLIFrameElement) {
  const ownerDocument = iframe.contentDocument
  if (!ownerDocument) return
  if (ownerDocument.readyState !== 'complete') {
    await new Promise<void>((resolve) => { iframe.addEventListener('load', () => resolve(), { once: true }) })
  }
  if (ownerDocument.fonts?.ready) await ownerDocument.fonts.ready
  await new Promise<void>((resolve) => { window.setTimeout(() => resolve(), 400) })
}

export async function exportPrefeituraUnidadesCriticasReportPdf(context: ExportContext) {
  const filename = pdfFilenameFromLabel('unidades-criticas', context.report.periodLabel)
  const html = buildUnidadesCriticasReportHtml(context)
  const exportFrame = createExportFrame(html)
  try {
    await waitForExportFrame(exportFrame)
    const exportWindow = exportFrame.contentWindow
    if (!exportWindow) throw new Error('Não foi possível gerar o PDF do relatório.')
    await downloadWindowAsPdf(exportWindow, { filename, scale: 2, maxPages: 2, marginMm: 4 })
  } finally {
    if (exportFrame.parentNode) exportFrame.parentNode.removeChild(exportFrame)
  }
}
