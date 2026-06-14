import { brand } from '../../config/brand'
import type { MedicosPlantaoReportApi } from '../../types/prefeituraRelatorios'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'

type ExportContext = {
  report: MedicosPlantaoReportApi
  generatedAtLabel: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveAssetUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${normalized}`
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

function signedPercent(value: number) {
  if (value === 0) return '0%'
  return `${value > 0 ? '+' : ''}${formatPercent(value)}%`
}

function signedPp(value: number) {
  if (value === 0) return '0 p.p.'
  return `${value > 0 ? '+' : ''}${formatPercent(value)} p.p.`
}

const HIGHLIGHT_TONE_STYLE = {
  red: 'border:1px solid #fecdd3;background:#fff1f2;color:#9f1239;',
  green: 'border:1px solid #bbf7d0;background:#ecfdf5;color:#065f46;',
  amber: 'border:1px solid #fde68a;background:#fffbeb;color:#92400e;',
  blue: 'border:1px solid #bae6fd;background:#f0f9ff;color:#0c4a6e;',
} as const

function buildReportStyles() {
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
    .meta { margin-top: 12px; font-size: 12px; color: #6b7280; }
    .meta p + p { margin-top: 4px; }
    section { margin-top: 28px; }
    h2 { font-size: 14px; font-weight: 700; color: #111827; border-bottom: 2px solid #ff6b00; padding-bottom: 8px; margin-bottom: 14px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; padding: 16px; text-align: center; }
    .card-label { font-size: 12px; color: #6b7280; font-weight: 500; }
    .card-value { margin-top: 4px; font-size: 24px; font-weight: 700; color: #111827; }
    .card-value-sm { margin-top: 4px; font-size: 18px; font-weight: 700; color: #111827; }
    .card-footer { margin-top: 4px; font-size: 12px; color: #6b7280; }
    .card-footer-positive { color: #059669; font-weight: 600; }
    .card-footer-negative { color: #b45309; font-weight: 600; }
    .highlight-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .highlight-card { border-radius: 12px; padding: 12px 16px; text-align: center; }
    .highlight-title { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .highlight-subtitle { margin-top: 4px; font-size: 12px; font-weight: 500; }
    .chart-wrap { margin-top: 8px; }
    .chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 176px; }
    .chart-bar-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .chart-bar-value { font-size: 10px; font-weight: 600; color: #6b7280; }
    .chart-bar { width: 100%; max-width: 32px; border-radius: 8px 8px 0 0; }
    .chart-bar-plantoes { background: linear-gradient(to top, #ea580c, #fb923c); }
    .chart-bar-consultas { background: linear-gradient(to top, #059669, #34d399); }
    .chart-bar-label { font-size: 10px; font-weight: 500; color: #6b7280; }
    .chart-caption { margin-top: 12px; font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; }
    th { background: #f9fafb; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280; }
    th.metric, td.metric { text-align: center; }
    th.unit, td.unit { text-align: left; font-weight: 700; }
    tr:nth-child(even) td { background: #fafafa; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280; }
    .footer p + p { margin-top: 4px; color: #9ca3af; }
    @media print { body { background: #fff; } main { border: 0; border-radius: 0; box-shadow: none; } }
  `
}

function buildEvolutionChart(
  points: MedicosPlantaoReportApi['evolution']['plantoesPoints'],
  mode: 'daily' | 'monthly',
  caption: string,
  barClass: string,
) {
  const max = Math.max(...points.map((point) => point.value), 1)
  const barAreaHeightPx = 120
  const bars = points
    .map(
      (point) => `
        <div class="chart-bar-col">
          <span class="chart-bar-value">${point.value > 0 ? formatNumber(point.value) : ''}</span>
          <div class="chart-bar ${barClass}" style="height:${Math.max(8, Math.round((point.value / max) * barAreaHeightPx))}px"></div>
          <span class="chart-bar-label">${escapeHtml(point.label)}</span>
        </div>
      `,
    )
    .join('')

  return `
    <div class="chart-wrap">
      <div class="chart-bars">${bars}</div>
      <p class="chart-caption">Evolução ${mode === 'monthly' ? 'mensal' : 'diária'} de ${caption} na rede municipal.</p>
    </div>
  `
}

export function buildMedicosPlantaoReportHtml({ report, generatedAtLabel }: ExportContext) {
  const logoUrl = resolveAssetUrl(brand.logoUrl)
  const topProfessional = report.professionals[0]
  const adherenceDeltaClass =
    report.summary.adherenceDeltaPp >= 0 ? 'card-footer-positive' : 'card-footer-negative'

  const highlights =
    report.highlights.length > 0
      ? `
    <section>
      <h2>Destaques do período</h2>
      <div class="highlight-grid">
        ${report.highlights
          .map(
            (item) => `
          <article class="highlight-card" style="${HIGHLIGHT_TONE_STYLE[item.tone]}">
            <p class="highlight-title">${escapeHtml(item.title)}</p>
            <p class="highlight-subtitle">${escapeHtml(item.subtitle)}</p>
          </article>
        `,
          )
          .join('')}
      </div>
    </section>`
      : ''

  const professionalRows = report.professionals
    .map(
      (professional) => `
      <tr>
        <td class="unit">${escapeHtml(professional.name)}</td>
        <td class="metric">${escapeHtml(professional.especialidadeName)}</td>
        <td class="metric">${formatNumber(professional.plantoesCount)}</td>
        <td class="metric">${formatNumber(professional.scheduledConsultas)}</td>
        <td class="metric"><strong>${formatNumber(professional.completedConsultas)}</strong></td>
        <td class="metric"><strong>${formatPercent(professional.adherencePercent)}%</strong></td>
      </tr>
    `,
    )
    .join('')

  const unitRows = report.units
    .map(
      (unit) => `
      <tr>
        <td class="unit">${escapeHtml(unit.name)}</td>
        <td class="metric">${escapeHtml(unit.region)}</td>
        <td class="metric">${formatNumber(unit.plantoesCount)}</td>
        <td class="metric">${formatNumber(unit.scheduledConsultas)}</td>
        <td class="metric"><strong>${formatNumber(unit.completedConsultas)}</strong></td>
        <td class="metric"><strong>${formatPercent(unit.adherencePercent)}%</strong></td>
      </tr>
    `,
    )
    .join('')

  const kpiCards = report.summary.kpis
    .map(
      (kpi) => `
        <article class="card">
          <p class="card-label">${escapeHtml(kpi.label)}</p>
          <p class="card-value-sm">${escapeHtml(kpi.value)}</p>
          <p class="card-footer">${escapeHtml(kpi.footer)}</p>
        </article>
      `,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.title)}</title>
  <style>${buildReportStyles()}</style>
</head>
<body>
  <main>
    <div class="brand-bar"></div>
    <header class="header">
      <div>
        <p class="eyebrow">Relatório operacional</p>
        <h1>${escapeHtml(report.title)}</h1>
        <p class="subtitle">${escapeHtml(report.description)}</p>
        <div class="meta">
          <p><strong>${escapeHtml(report.entidadeRazaoSocial)}</strong> · ${escapeHtml(brand.appName)}</p>
          <p>Período: <strong>${escapeHtml(report.periodLabel)}</strong></p>
        </div>
      </div>
      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.appName)}" />
    </header>
    <section>
      <div class="summary-grid">
        <article class="card">
          <p class="card-label">Plantões no período</p>
          <p class="card-value">${formatNumber(report.summary.plantoesCount)}</p>
          <p class="card-footer card-footer-positive">${signedPercent(report.summary.plantoesDeltaPercent)} vs período anterior</p>
        </article>
        <article class="card">
          <p class="card-label">Aderência média</p>
          <p class="card-value">${formatPercent(report.summary.adherencePercent)}%</p>
          <p class="card-footer ${adherenceDeltaClass}">${signedPp(report.summary.adherenceDeltaPp)} vs período anterior</p>
        </article>
        <article class="card">
          <p class="card-label">Consultas realizadas</p>
          <p class="card-value">${formatNumber(report.summary.completedConsultas)}</p>
          <p class="card-footer">${formatNumber(report.summary.scheduledConsultas)} agendadas no período</p>
        </article>
        <article class="card">
          <p class="card-label">Profissionais escalados</p>
          <p class="card-value">${formatNumber(report.summary.professionalsCount)}</p>
          <p class="card-footer">${topProfessional ? `Destaque: ${escapeHtml(topProfessional.name)}` : `${formatPercent(report.summary.avgConsultasPerPlantao)} consultas/plantão`}</p>
        </article>
      </div>
    </section>
    ${highlights}
    <section>
      <h2>Profissionais em plantão</h2>
      <table>
        <thead>
          <tr>
            <th class="unit">Profissional</th>
            <th class="metric">Especialidade</th>
            <th class="metric">Plantões</th>
            <th class="metric">Agendadas</th>
            <th class="metric">Realizadas</th>
            <th class="metric">Aderência</th>
          </tr>
        </thead>
        <tbody>${professionalRows}</tbody>
      </table>
    </section>
    <section>
      <h2>Evolução de plantões</h2>
      ${buildEvolutionChart(report.evolution.plantoesPoints, report.evolution.mode, 'plantões', 'chart-bar-plantoes')}
    </section>
    <section>
      <h2>Evolução de consultas realizadas</h2>
      ${buildEvolutionChart(report.evolution.consultasPoints, report.evolution.mode, 'consultas realizadas', 'chart-bar-consultas')}
    </section>
    <section>
      <h2>Comparativo entre unidades</h2>
      <table>
        <thead>
          <tr>
            <th class="unit">Unidade</th>
            <th class="metric">Região</th>
            <th class="metric">Plantões</th>
            <th class="metric">Agendadas</th>
            <th class="metric">Realizadas</th>
            <th class="metric">Aderência</th>
          </tr>
        </thead>
        <tbody>${unitRows}</tbody>
      </table>
    </section>
    <section>
      <h2>Indicadores do período</h2>
      <div class="kpi-grid">${kpiCards}</div>
    </section>
    <footer class="footer">
      <p>Relatório gerado em <strong>${escapeHtml(generatedAtLabel)}</strong> por <strong>${escapeHtml(report.generatedBy)}</strong></p>
      <p>Escalas e aderência consolidadas a partir dos plantões médicos e consultas realizadas nas UBTs da rede municipal.</p>
    </footer>
  </main>
</body>
</html>`
}

function createExportFrame(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1100px;height:1px;border:0;opacity:0;pointer-events:none;'
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
  await new Promise<void>((resolve) => window.setTimeout(() => resolve(), 400))
}

export async function exportPrefeituraMedicosPlantaoReportPdf(context: ExportContext) {
  const filename = pdfFilenameFromLabel('medicos-plantao', context.report.periodLabel)
  const html = buildMedicosPlantaoReportHtml(context)
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
