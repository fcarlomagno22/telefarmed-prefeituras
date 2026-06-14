import { brand } from '../../config/brand'
import { prefeituraSlaBadgeConfig } from '../../components/prefeitura/prefeituraDashboardUi'
import type { ProducaoUnidadeReportApi } from '../../types/prefeituraRelatorios'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'

type ExportContext = {
  report: ProducaoUnidadeReportApi
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

function buildReportStyles() {
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
    .brand-bar { height: 4px; background: #ff6b00; border-radius: 999px; margin-bottom: 20px; }
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
      border-bottom: 2px solid #ff6b00;
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
      background: linear-gradient(to top, #0284c7, #38bdf8);
    }
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

function buildSummaryCards(report: ProducaoUnidadeReportApi) {
  const topUnit = report.units[0]

  return `
    <div class="summary-grid">
      <article class="card">
        <p class="card-label">Volume total no período</p>
        <p class="card-value">${formatNumber(report.summary.periodTotal)}</p>
        <p class="card-footer card-footer-positive">${signedPercent(report.summary.volumeDeltaPercent)} vs período anterior</p>
      </article>
      <article class="card">
        <p class="card-label">Unidades com produção</p>
        <p class="card-value">${formatNumber(report.summary.unitsCount)}</p>
        <p class="card-footer">UBTs ativas no recorte</p>
      </article>
      <article class="card">
        <p class="card-label">Média por unidade</p>
        <p class="card-value">${formatNumber(report.summary.networkAvgVolume)}</p>
        <p class="card-footer">Consultas por UBT no período</p>
      </article>
      <article class="card">
        <p class="card-label">Maior produtora</p>
        <p class="card-value-sm">${escapeHtml(topUnit?.name ?? '—')}</p>
        <p class="card-footer">${
          topUnit
            ? `${formatNumber(topUnit.volumeTotal)} consultas (${formatPercent(topUnit.sharePercent)}% da rede)`
            : 'Sem dados'
        }</p>
      </article>
    </div>
  `
}

function buildEvolutionChart(report: ProducaoUnidadeReportApi) {
  const max = Math.max(...report.evolution.points.map((point) => point.value), 1)
  const barAreaHeightPx = 120
  const bars = report.evolution.points
    .map((point) => {
      const barHeightPx = Math.max(8, Math.round((point.value / max) * barAreaHeightPx))
      return `
        <div class="chart-bar-col">
          <span class="chart-bar-value">${point.value > 0 ? formatNumber(point.value) : ''}</span>
          <div class="chart-bar" style="height:${barHeightPx}px"></div>
          <span class="chart-bar-label">${escapeHtml(point.label)}</span>
        </div>
      `
    })
    .join('')

  return `
    <div class="chart-wrap">
      <div class="chart-bars">${bars}</div>
      <p class="chart-caption">Evolução ${
        report.evolution.mode === 'monthly' ? 'mensal' : 'diária'
      } do volume de consultas na rede municipal.</p>
    </div>
  `
}

function buildUnitsTable(report: ProducaoUnidadeReportApi) {
  if (report.units.length === 0) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="10" style="text-align:center;padding:24px;color:#6b7280;">
              Nenhuma consulta registrada no período selecionado.
            </td>
          </tr>
        </tbody>
      </table>
    `
  }

  const rows = report.units
    .map((unit) => {
      const vsAverageClass = unit.volumeVsNetworkPercent >= 0 ? 'positive' : 'negative'
      return `
        <tr>
          <td class="unit">${escapeHtml(unit.name)}</td>
          <td class="metric">${escapeHtml(unit.region)}</td>
          <td class="metric"><strong>${formatNumber(unit.volumeTotal)}</strong></td>
          <td class="metric">${formatPercent(unit.sharePercent)}%</td>
          <td class="metric ${vsAverageClass}">${signedPercent(unit.volumeVsNetworkPercent)}</td>
          <td class="metric">${formatNumber(unit.completed)}</td>
          <td class="metric">${formatPercent(unit.completionRate)}%</td>
          <td class="metric">${formatNumber(unit.cancelled)}</td>
          <td class="metric">${unit.avgDurationMin > 0 ? `${unit.avgDurationMin} min` : '—'}</td>
          <td class="metric">${escapeHtml(prefeituraSlaBadgeConfig[unit.status].label)}</td>
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
          <th class="metric">Volume</th>
          <th class="metric">% da rede</th>
          <th class="metric">vs média</th>
          <th class="metric">Concluídas</th>
          <th class="metric">Taxa conclusão</th>
          <th class="metric">Canceladas</th>
          <th class="metric">Duração média</th>
          <th class="metric">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildKpiCards(report: ProducaoUnidadeReportApi) {
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

export function buildProducaoUnidadeReportHtml({ report, generatedAtLabel }: ExportContext) {
  const logoUrl = resolveAssetUrl(brand.logoUrl)

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
      ${buildSummaryCards(report)}
    </section>

    <section>
      <h2>Evolução do volume</h2>
      ${buildEvolutionChart(report)}
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
      <p>Dados consolidados a partir das consultas operacionais registradas nas UBTs da rede municipal.</p>
    </footer>
  </main>
</body>
</html>`
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

export async function exportPrefeituraProducaoUnidadeReportPdf(context: ExportContext) {
  const filename = pdfFilenameFromLabel('producao-por-unidade', context.report.periodLabel)
  const html = buildProducaoUnidadeReportHtml(context)
  const exportFrame = createExportFrame(html)

  try {
    await waitForExportFrame(exportFrame)
    const exportWindow = exportFrame.contentWindow
    if (!exportWindow) {
      throw new Error('Não foi possível gerar o PDF do relatório.')
    }
    await downloadWindowAsPdf(exportWindow, { filename, scale: 2, singlePage: true, marginMm: 3 })
  } finally {
    if (exportFrame.parentNode) {
      exportFrame.parentNode.removeChild(exportFrame)
    }
  }
}
