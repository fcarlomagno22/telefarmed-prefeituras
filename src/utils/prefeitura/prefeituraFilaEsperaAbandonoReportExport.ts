import { brand } from '../../config/brand'
import type { FilaEsperaAbandonoReportApi } from '../../types/prefeituraRelatorios'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'

type ExportContext = {
  report: FilaEsperaAbandonoReportApi
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

function signedMinutes(value: number) {
  if (value === 0) return '0 min'
  return `${value > 0 ? '+' : ''}${value} min`
}

function signedPp(value: number) {
  if (value === 0) return '0 p.p.'
  return `${value > 0 ? '+' : ''}${formatPercent(value)} p.p.`
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
    .card-footer-negative { color: #b45309; font-weight: 600; }
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
    .chart-bar-wait { background: linear-gradient(to top, #0891b2, #22d3ee); }
    .chart-bar-abandon { background: linear-gradient(to top, #e11d48, #fb7185); }
    .chart-bar-volume { background: linear-gradient(to top, #4f46e5, #818cf8); }
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

function buildSummaryCards(report: FilaEsperaAbandonoReportApi) {
  const criticalUnit = report.units[0]
  const waitDeltaClass =
    report.summary.avgWaitDeltaMinutes <= 0 ? 'card-footer-positive' : 'card-footer-negative'
  const abandonmentDeltaClass =
    report.summary.abandonmentDeltaPp <= 0 ? 'card-footer-positive' : 'card-footer-negative'

  return `
    <div class="summary-grid">
      <article class="card">
        <p class="card-label">Fila na rede (agora)</p>
        <p class="card-value">${formatNumber(report.summary.queueNow)}</p>
        <p class="card-footer">Pacientes aguardando ou chamados</p>
      </article>
      <article class="card">
        <p class="card-label">Tempo médio de espera</p>
        <p class="card-value">${report.summary.avgWaitMinutes > 0 ? `${report.summary.avgWaitMinutes} min` : '—'}</p>
        <p class="card-footer ${waitDeltaClass}">${signedMinutes(report.summary.avgWaitDeltaMinutes)} vs período anterior</p>
      </article>
      <article class="card">
        <p class="card-label">Taxa de abandono</p>
        <p class="card-value">${formatPercent(report.summary.abandonmentRatePercent)}%</p>
        <p class="card-footer ${abandonmentDeltaClass}">${signedPp(report.summary.abandonmentDeltaPp)} vs período anterior</p>
      </article>
      <article class="card">
        <p class="card-label">Unidade mais crítica</p>
        <p class="card-value-sm">${escapeHtml(criticalUnit?.name ?? '—')}</p>
        <p class="card-footer">${
          criticalUnit
            ? `${formatPercent(criticalUnit.abandonmentRatePercent)}% abandono · ${criticalUnit.avgWaitMinutes > 0 ? `${criticalUnit.avgWaitMinutes} min` : '—'} espera`
            : 'Sem dados'
        }</p>
      </article>
    </div>
  `
}

function buildEvolutionChart(
  points: FilaEsperaAbandonoReportApi['evolution']['waitPoints'],
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

function buildUnitsTable(report: FilaEsperaAbandonoReportApi) {
  if (report.units.length === 0) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="10" style="text-align:center;padding:24px;color:#6b7280;">
              Nenhum registro de fila no período selecionado.
            </td>
          </tr>
        </tbody>
      </table>
    `
  }

  const rows = report.units
    .map((unit) => {
      const waitClass = unit.waitVsNetworkMinutes <= 0 ? 'positive' : 'negative'
      const abandonmentClass = unit.abandonmentVsNetworkPp <= 0 ? 'positive' : 'negative'
      return `
        <tr>
          <td class="unit">${escapeHtml(unit.name)}</td>
          <td class="metric">${escapeHtml(unit.region)}</td>
          <td class="metric"><strong>${formatNumber(unit.queueNow)}</strong></td>
          <td class="metric">${unit.avgWaitMinutes > 0 ? `${unit.avgWaitMinutes} min` : '—'}</td>
          <td class="metric ${waitClass}">${signedMinutes(unit.waitVsNetworkMinutes)}</td>
          <td class="metric">${formatNumber(unit.filaProcessed)}</td>
          <td class="metric">${formatNumber(unit.abandoned)}</td>
          <td class="metric">${formatNumber(unit.cancelled)}</td>
          <td class="metric"><strong>${formatPercent(unit.abandonmentRatePercent)}%</strong></td>
          <td class="metric ${abandonmentClass}">${signedPp(unit.abandonmentVsNetworkPp)}</td>
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
          <th class="metric">Fila agora</th>
          <th class="metric">Espera média</th>
          <th class="metric">vs rede</th>
          <th class="metric">Processados</th>
          <th class="metric">Desistências</th>
          <th class="metric">Canceladas</th>
          <th class="metric">Taxa abandono</th>
          <th class="metric">vs rede</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildKpiCards(report: FilaEsperaAbandonoReportApi) {
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

export function buildFilaEsperaAbandonoReportHtml({ report, generatedAtLabel }: ExportContext) {
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
      <h2>Evolução do tempo médio de espera</h2>
      ${buildEvolutionChart(
        report.evolution.waitPoints,
        report.evolution.mode,
        'tempo médio de espera',
        'chart-bar-wait',
        ' min',
      )}
    </section>

    <section>
      <h2>Evolução da taxa de abandono</h2>
      ${buildEvolutionChart(
        report.evolution.abandonmentPoints,
        report.evolution.mode,
        'taxa de abandono',
        'chart-bar-abandon',
        '%',
      )}
    </section>

    <section>
      <h2>Volume na fila do terminal</h2>
      ${buildEvolutionChart(
        report.evolution.volumePoints,
        report.evolution.mode,
        'volume na fila',
        'chart-bar-volume',
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
      <p>Dados consolidados a partir da fila de espera do terminal e das consultas operacionais registradas nas UBTs da rede municipal.</p>
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

export async function exportPrefeituraFilaEsperaAbandonoReportPdf(context: ExportContext) {
  const filename = pdfFilenameFromLabel('fila-espera-abandono', context.report.periodLabel)
  const html = buildFilaEsperaAbandonoReportHtml(context)
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
