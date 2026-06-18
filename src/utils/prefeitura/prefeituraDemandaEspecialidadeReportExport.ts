import { brand } from '../../config/brand'
import {applyEntidadeCopyToExportText,
  buildEntidadeExportBaseStyles,
  resolveEntidadeExportBranding,
  type EntidadeExportBranding,
  resolveExportAssetUrl,
  escapeExportHtml
} from '../entidadeExportHtml'
import type { DemandaEspecialidadeReportApi } from '../../types/prefeituraRelatorios'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'

type ExportContext = {
  report: DemandaEspecialidadeReportApi
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

function buildReportStyles(branding: EntidadeExportBranding = resolveEntidadeExportBranding()) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      line-height: 1.45;
    }
    main {
      max-width: 1100px;
      margin: 0 auto;
      padding: 28px 32px 36px;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      background: #fff;
    }
    .brand-bar { height: 4px; background: ${branding.corPrimaria}; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .header img { height: 36px; width: auto; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; }
    h1 { font-size: 24px; font-weight: 700; color: #111827; margin-top: 4px; }
    .subtitle { margin-top: 4px; font-size: 13px; color: #6b7280; max-width: 42rem; }
    .meta { margin-top: 12px; font-size: 12px; color: #6b7280; }
    .meta p + p { margin-top: 4px; }
    section { margin-top: 28px; }
    h2 {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      border-bottom: 2px solid ${branding.corPrimaria};
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #f8fafc;
      padding: 16px;
      text-align: center;
    }
    .card-label { font-size: 12px; color: #6b7280; font-weight: 500; }
    .card-value { margin-top: 4px; font-size: 24px; font-weight: 700; color: #111827; }
    .card-value-sm { margin-top: 4px; font-size: 18px; font-weight: 700; color: #111827; }
    .card-footer { margin-top: 4px; font-size: 12px; color: #6b7280; }
    .card-footer-positive { color: #059669; font-weight: 600; }
    .card-footer-negative { color: #b45309; font-weight: 600; }
    .highlight-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .highlight-card {
      border-radius: 12px;
      padding: 12px 16px;
      text-align: center;
    }
    .highlight-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .highlight-subtitle { margin-top: 4px; font-size: 12px; font-weight: 500; }
    .chart-wrap { margin-top: 8px; }
    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 176px;
    }
    .chart-bar-col {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .chart-bar-value { font-size: 10px; font-weight: 600; color: #6b7280; }
    .chart-bar {
      width: 100%;
      max-width: 32px;
      border-radius: 8px 8px 0 0;
    }
    .chart-bar-volume { background: linear-gradient(to top, #ea580c, #fb923c); }
    .chart-bar-completion { background: linear-gradient(to top, #059669, #34d399); }
    .chart-bar-completion-rate { background: linear-gradient(to top, #4f46e5, #818cf8); }
    .chart-bar-label { font-size: 10px; font-weight: 500; color: #6b7280; }
    .chart-caption { margin-top: 12px; font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; vertical-align: top; }
    th {
      background: #f9fafb;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #6b7280;
    }
    th.metric, td.metric { text-align: center; }
    th.unit, td.unit { text-align: left; font-weight: 700; }
    tr:nth-child(even) td { background: #fafafa; }
    .positive { color: #047857; font-weight: 600; }
    .negative { color: #b45309; font-weight: 600; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
    .footer p + p { margin-top: 4px; color: #9ca3af; }
    @media print {
      body { background: #fff; }
      main { border: 0; border-radius: 0; box-shadow: none; }
    }
  `
}

function buildSummaryCards(report: DemandaEspecialidadeReportApi) {
  const topSpecialty = report.specialties[0]
  const completionDeltaClass =
    report.summary.completionDeltaPp >= 0 ? 'card-footer-positive' : 'card-footer-negative'

  return `
    <div class="summary-grid">
      <article class="card">
        <p class="card-label">Solicitações no período</p>
        <p class="card-value">${formatNumber(report.summary.requested)}</p>
        <p class="card-footer card-footer-positive">${signedPercent(report.summary.requestedDeltaPercent)} vs período anterior</p>
      </article>
      <article class="card">
        <p class="card-label">Consultas realizadas</p>
        <p class="card-value">${formatNumber(report.summary.completed)}</p>
        <p class="card-footer">Atendimentos concluídos no período</p>
      </article>
      <article class="card">
        <p class="card-label">Taxa de conversão</p>
        <p class="card-value">${formatPercent(report.summary.completionRatePercent)}%</p>
        <p class="card-footer ${completionDeltaClass}">${signedPp(report.summary.completionDeltaPp)} vs período anterior</p>
      </article>
      <article class="card">
        <p class="card-label">Líder de demanda</p>
        <p class="card-value-sm">${escapeHtml(topSpecialty?.name ?? report.summary.topSpecialtyName)}</p>
        <p class="card-footer">${
          topSpecialty
            ? `${formatPercent(topSpecialty.sharePercent)}% do total · ${formatNumber(topSpecialty.requested)} solicitações`
            : 'Sem dados'
        }</p>
      </article>
    </div>
  `
}

function buildHighlights(report: DemandaEspecialidadeReportApi) {
  if (report.highlights.length === 0) return ''

  const cards = report.highlights
    .map(
      (item) => `
        <article class="highlight-card" style="${HIGHLIGHT_TONE_STYLE[item.tone]}">
          <p class="highlight-title">${escapeHtml(item.title)}</p>
          <p class="highlight-subtitle">${escapeHtml(item.subtitle)}</p>
        </article>
      `,
    )
    .join('')

  return `
    <section>
      <h2>Destaques do período</h2>
      <div class="highlight-grid">${cards}</div>
    </section>
  `
}

function buildEvolutionChart(
  points: DemandaEspecialidadeReportApi['evolution']['volumePoints'],
  mode: 'daily' | 'monthly',
  caption: string,
  barClass: string,
  valueSuffix = '',
) {
  const max = Math.max(...points.map((point) => point.value), 1)
  const barAreaHeightPx = 120
  const bars = points
    .map((point) => {
      const barHeightPx = Math.max(8, Math.round((point.value / max) * barAreaHeightPx))
      return `
        <div class="chart-bar-col">
          <span class="chart-bar-value">${point.value > 0 ? `${formatNumber(point.value)}${valueSuffix}` : ''}</span>
          <div class="chart-bar ${barClass}" style="height:${barHeightPx}px"></div>
          <span class="chart-bar-label">${escapeHtml(point.label)}</span>
        </div>
      `
    })
    .join('')

  return `
    <div class="chart-wrap">
      <div class="chart-bars">${bars}</div>
      <p class="chart-caption">Evolução ${mode === 'monthly' ? 'mensal' : 'diária'} de ${caption} na rede municipal.</p>
    </div>
  `
}

function buildSpecialtiesTable(report: DemandaEspecialidadeReportApi) {
  if (report.specialties.length === 0) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="8" style="text-align:center;padding:24px;color:#6b7280;">
              Nenhuma especialidade com demanda no período selecionado.
            </td>
          </tr>
        </tbody>
      </table>
    `
  }

  const rows = report.specialties
    .map((specialty) => {
      const deltaClass = specialty.requestedDeltaPercent >= 0 ? 'positive' : 'negative'
      return `
        <tr>
          <td class="unit">${escapeHtml(specialty.name)}</td>
          <td class="metric"><strong>${formatNumber(specialty.requested)}</strong></td>
          <td class="metric">${formatNumber(specialty.agendaCount)}</td>
          <td class="metric">${formatNumber(specialty.filaCount)}</td>
          <td class="metric">${formatNumber(specialty.completed)}</td>
          <td class="metric"><strong>${formatPercent(specialty.completionRatePercent)}%</strong></td>
          <td class="metric">${formatPercent(specialty.sharePercent)}%</td>
          <td class="metric ${deltaClass}">${signedPercent(specialty.requestedDeltaPercent)}</td>
        </tr>
      `
    })
    .join('')

  return `
    <table>
      <thead>
        <tr>
          <th class="unit">Especialidade</th>
          <th class="metric">Solicitadas</th>
          <th class="metric">Agenda</th>
          <th class="metric">Fila</th>
          <th class="metric">Realizadas</th>
          <th class="metric">Conversão</th>
          <th class="metric">Participação</th>
          <th class="metric">vs período ant.</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildUnitsTable(report: DemandaEspecialidadeReportApi) {
  if (report.units.length === 0) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="7" style="text-align:center;padding:24px;color:#6b7280;">
              Nenhuma unidade com demanda registrada no período selecionado.
            </td>
          </tr>
        </tbody>
      </table>
    `
  }

  const rows = report.units
    .map((unit) => {
      const vsNetworkClass = unit.completionVsNetworkPp >= 0 ? 'positive' : 'negative'
      return `
        <tr>
          <td class="unit">${escapeHtml(unit.name)}</td>
          <td class="metric">${escapeHtml(unit.region)}</td>
          <td class="metric"><strong>${formatNumber(unit.requested)}</strong></td>
          <td class="metric">${formatNumber(unit.completed)}</td>
          <td class="metric"><strong>${formatPercent(unit.completionRatePercent)}%</strong></td>
          <td class="metric">${escapeHtml(unit.topSpecialtyName)} (${formatPercent(unit.topSpecialtySharePercent)}%)</td>
          <td class="metric ${vsNetworkClass}">${signedPp(unit.completionVsNetworkPp)}</td>
        </tr>
      `
    })
    .join('')

  return `
    <table>
      <thead>
        <tr>
          <th class="unit">Unidade</th>
          <th class="metric">Região</th>
          <th class="metric">Solicitadas</th>
          <th class="metric">Realizadas</th>
          <th class="metric">Conversão</th>
          <th class="metric">Top especialidade</th>
          <th class="metric">vs rede</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildKpiCards(report: DemandaEspecialidadeReportApi) {
  const cards = report.summary.kpis
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

  return `<div class="kpi-grid">${cards}</div>`
}

export function buildDemandaEspecialidadeReportHtml({ report, generatedAtLabel }: ExportContext) {
  const logoUrl = resolveExportAssetUrl(branding.logoUrl)

  return applyEntidadeCopyToExportText(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.title)}</title>
  <style>${buildReportStyles(branding)}</style>
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
          <p><strong>${escapeHtml(report.entidadeRazaoSocial)}</strong> · ${escapeExportHtml(branding.brandName)}</p>
          <p>Período: <strong>${escapeHtml(report.periodLabel)}</strong></p>
        </div>
      </div>
      <img src="${escapeHtml(logoUrl)}" alt="${escapeExportHtml(branding.brandName)}" />
    </header>

    <section>
      ${buildSummaryCards(report)}
    </section>

    ${buildHighlights(report)}

    <section>
      <h2>Demanda por especialidade</h2>
      ${buildSpecialtiesTable(report)}
    </section>

    <section>
      <h2>Evolução das solicitações</h2>
      ${buildEvolutionChart(
        report.evolution.volumePoints,
        report.evolution.mode,
        'solicitações',
        'chart-bar-volume',
      )}
    </section>

    <section>
      <h2>Evolução das consultas realizadas</h2>
      ${buildEvolutionChart(
        report.evolution.completionPoints,
        report.evolution.mode,
        'consultas realizadas',
        'chart-bar-completion',
      )}
    </section>

    <section>
      <h2>Evolução da taxa de conversão</h2>
      ${buildEvolutionChart(
        report.evolution.completionRatePoints,
        report.evolution.mode,
        'taxa de conversão',
        'chart-bar-completion-rate',
        '%',
      )}
    </section>

    <section>
      <h2>Comparativo entre unidades</h2>
      ${buildUnitsTable(report)}
    </section>

    <section>
      <h2>Indicadores do período</h2>
      ${buildKpiCards(report)}
    </section>

    <footer class="footer">
      <p>Relatório gerado em <strong>${escapeHtml(generatedAtLabel)}</strong> por <strong>${escapeHtml(report.generatedBy)}</strong></p>
      <p>Demanda consolidada a partir das solicitações por especialidade nas agendas e filas das UBTs da rede municipal.</p>
    </footer>
  </main>
</body>
</html>`)
}

function createExportFrame(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'width:1100px',
    'height:1px',
    'border:0',
    'opacity:0',
    'pointer-events:none',
  ].join(';')
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

  if (ownerDocument.fonts?.ready) {
    await ownerDocument.fonts.ready
  }

  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 400)
  })
}

export async function exportPrefeituraDemandaEspecialidadeReportPdf(context: ExportContext) {
  const filename = pdfFilenameFromLabel('demanda-especialidade', context.report.periodLabel)
  const html = buildDemandaEspecialidadeReportHtml(context)
  const exportFrame = createExportFrame(html)

  try {
    await waitForExportFrame(exportFrame)
    const exportWindow = exportFrame.contentWindow
    if (!exportWindow) {
      throw new Error('Não foi possível gerar o PDF do relatório.')
    }
    await downloadWindowAsPdf(exportWindow, { filename, scale: 2, maxPages: 2, marginMm: 4 })
  } finally {
    if (exportFrame.parentNode) {
      exportFrame.parentNode.removeChild(exportFrame)
    }
  }
}
