import { brand } from '../../config/brand'
import type { RankingUbtsReportApi } from '../../types/prefeituraRelatorios'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'

type ExportContext = {
  report: RankingUbtsReportApi
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

const SLA_STATUS_STYLE = {
  normal: 'color:#047857;font-weight:600;',
  atencao: 'color:#b45309;font-weight:600;',
  critico: 'color:#be123c;font-weight:600;',
} as const

const SLA_STATUS_LABEL = {
  normal: 'Normal',
  atencao: 'Atenção',
  critico: 'Crítico',
} as const

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
    .goals-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .goal-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #f8fafc;
      padding: 12px;
      text-align: center;
    }
    .goal-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #6b7280;
    }
    .goal-value { margin-top: 4px; font-size: 18px; font-weight: 700; color: #111827; }
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
    .chart-bar-composite { background: linear-gradient(to top, #7c3aed, #a78bfa); }
    .chart-bar-production { background: linear-gradient(to top, #0284c7, #38bdf8); }
    .chart-bar-goals { background: linear-gradient(to top, #059669, #34d399); }
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
    .dimension-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .dimension-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
    }
    .dimension-title {
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
      padding: 10px 12px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #4b5563;
    }
    .dimension-table th, .dimension-table td { padding: 8px 10px; font-size: 11px; }
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

function buildSummaryCards(report: RankingUbtsReportApi) {
  const topUnit = report.units[0]
  const productionDeltaClass =
    report.summary.productionDeltaPercent >= 0 ? 'card-footer-positive' : 'card-footer-negative'
  const compositeDeltaSuffix =
    report.summary.compositeDeltaPp !== 0
      ? ` (${signedPp(report.summary.compositeDeltaPp)} vs anterior)`
      : ''

  return `
    <div class="summary-grid">
      <article class="card">
        <p class="card-label">Unidades classificadas</p>
        <p class="card-value">${formatNumber(report.summary.unitsCount)}</p>
        <p class="card-footer">UBTs ativas no recorte do relatório</p>
      </article>
      <article class="card">
        <p class="card-label">Produção total</p>
        <p class="card-value">${formatNumber(report.summary.totalProduction)}</p>
        <p class="card-footer ${productionDeltaClass}">${signedPercent(report.summary.productionDeltaPercent)} vs período anterior</p>
      </article>
      <article class="card">
        <p class="card-label">Cumprimento médio de metas</p>
        <p class="card-value">${formatPercent(report.summary.avgGoalFulfillmentPercent)}%</p>
        <p class="card-footer">${formatNumber(report.summary.unitsMeetingGoals)} unidades com metas ≥ 75%</p>
      </article>
      <article class="card">
        <p class="card-label">Líder do ranking</p>
        <p class="card-value-sm">${escapeHtml(topUnit?.name ?? report.summary.topUnitName)}</p>
        <p class="card-footer">Score ${formatPercent(topUnit?.compositeScore ?? report.summary.networkCompositeScore)} · rede ${formatPercent(report.summary.networkCompositeScore)}${compositeDeltaSuffix}</p>
      </article>
    </div>
  `
}

function buildHighlights(report: RankingUbtsReportApi) {
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

function buildGoalsSection(report: RankingUbtsReportApi) {
  return `
    <section>
      <h2>Metas da rede municipal</h2>
      <div class="goals-grid">
        <article class="goal-card">
          <p class="goal-label">Conclusão</p>
          <p class="goal-value">≥ ${formatPercent(report.goals.completionRatePercent)}%</p>
        </article>
        <article class="goal-card">
          <p class="goal-label">Abandono</p>
          <p class="goal-value">≤ ${formatPercent(report.goals.maxAbandonmentRatePercent)}%</p>
        </article>
        <article class="goal-card">
          <p class="goal-label">Espera média</p>
          <p class="goal-value">≤ ${formatNumber(report.goals.maxWaitMinutes)} min</p>
        </article>
        <article class="goal-card">
          <p class="goal-label">Comparecimento</p>
          <p class="goal-value">≥ ${formatPercent(report.goals.minAttendanceRatePercent)}%</p>
        </article>
      </div>
    </section>
  `
}

function buildEvolutionChart(
  points: RankingUbtsReportApi['evolution']['compositePoints'],
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

function buildUnitsTable(report: RankingUbtsReportApi) {
  if (report.units.length === 0) {
    return `
      <table>
        <tbody>
          <tr>
            <td colspan="13" style="text-align:center;padding:24px;color:#6b7280;">
              Nenhuma unidade classificada no período selecionado.
            </td>
          </tr>
        </tbody>
      </table>
    `
  }

  const rows = report.units
    .map((unit) => {
      const vsNetwork = unit.compositeScore - report.summary.networkCompositeScore
      const vsNetworkClass = vsNetwork >= 0 ? 'positive' : 'negative'
      return `
        <tr>
          <td class="metric"><strong>${unit.rank}</strong></td>
          <td class="unit">${escapeHtml(unit.name)}</td>
          <td class="metric">${escapeHtml(unit.region)}</td>
          <td class="metric"><strong>${formatNumber(unit.production)}</strong></td>
          <td class="metric">${formatPercent(unit.completionRatePercent)}%</td>
          <td class="metric">${formatPercent(unit.abandonmentRatePercent)}%</td>
          <td class="metric">${formatNumber(unit.avgWaitMinutes)} min</td>
          <td class="metric">${formatPercent(unit.attendanceRatePercent)}%</td>
          <td class="metric">${unit.avgRating > 0 ? formatPercent(unit.avgRating, 1) : '—'}</td>
          <td class="metric"><strong>${formatPercent(unit.goalFulfillmentPercent)}%</strong></td>
          <td class="metric"><strong>${formatPercent(unit.compositeScore)}</strong></td>
          <td class="metric ${vsNetworkClass}">${signedPp(vsNetwork)}</td>
          <td class="metric" style="${SLA_STATUS_STYLE[unit.slaStatus]}">${SLA_STATUS_LABEL[unit.slaStatus]}</td>
        </tr>
      `
    })
    .join('')

  return `
    <table>
      <thead>
        <tr>
          <th class="metric">Pos.</th>
          <th class="unit">Unidade</th>
          <th class="metric">Região</th>
          <th class="metric">Produção</th>
          <th class="metric">Conclusão</th>
          <th class="metric">Abandono</th>
          <th class="metric">Espera</th>
          <th class="metric">Comparec.</th>
          <th class="metric">Nota</th>
          <th class="metric">Metas</th>
          <th class="metric">Score</th>
          <th class="metric">vs rede</th>
          <th class="metric">SLA</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

function buildDimensionRankingTable(
  title: string,
  rows: RankingUbtsReportApi['rankings']['producao'],
) {
  const bodyRows =
    rows.length === 0
      ? `<tr><td colspan="4" style="text-align:center;padding:20px;color:#6b7280;">Sem dados</td></tr>`
      : rows
          .slice(0, 5)
          .map((row) => {
            const variationClass = row.variationPercent >= 0 ? 'positive' : 'negative'
            return `
              <tr>
                <td class="metric"><strong>${row.position}</strong></td>
                <td class="unit">
                  ${escapeHtml(row.unitName)}
                  <div style="font-size:10px;color:#6b7280;font-weight:400;">${escapeHtml(row.region)}</div>
                </td>
                <td class="metric"><strong>${escapeHtml(row.valueLabel)}</strong></td>
                <td class="metric ${variationClass}">${signedPercent(row.variationPercent)}</td>
              </tr>
            `
          })
          .join('')

  return `
    <article class="dimension-card">
      <h3 class="dimension-title">${escapeHtml(title)}</h3>
      <table class="dimension-table">
        <thead>
          <tr>
            <th class="metric">#</th>
            <th class="unit">Unidade</th>
            <th class="metric">Valor</th>
            <th class="metric">Var.</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </article>
  `
}

function buildDimensionRankings(report: RankingUbtsReportApi) {
  return `
    <section>
      <h2>Rankings por dimensão</h2>
      <div class="dimension-grid">
        ${buildDimensionRankingTable('Produção', report.rankings.producao)}
        ${buildDimensionRankingTable('Eficiência (conclusão)', report.rankings.eficiencia)}
        ${buildDimensionRankingTable('Menor abandono', report.rankings.abandono)}
        ${buildDimensionRankingTable('Cumprimento de metas', report.rankings.metas)}
      </div>
    </section>
  `
}

function buildKpiCards(report: RankingUbtsReportApi) {
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

export function buildRankingUbtsReportHtml({ report, generatedAtLabel }: ExportContext) {
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

    ${buildHighlights(report)}

    ${buildGoalsSection(report)}

    <section>
      <h2>Evolução do score composto</h2>
      ${buildEvolutionChart(
        report.evolution.compositePoints,
        report.evolution.mode,
        'score composto',
        'chart-bar-composite',
      )}
    </section>

    <section>
      <h2>Evolução da produção</h2>
      ${buildEvolutionChart(
        report.evolution.productionPoints,
        report.evolution.mode,
        'produção',
        'chart-bar-production',
      )}
    </section>

    <section>
      <h2>Evolução do cumprimento de metas</h2>
      ${buildEvolutionChart(
        report.evolution.goalPoints,
        report.evolution.mode,
        'cumprimento de metas',
        'chart-bar-goals',
        '%',
      )}
    </section>

    <section>
      <h2>Ranking geral das UBTs</h2>
      ${buildUnitsTable(report)}
    </section>

    ${buildDimensionRankings(report)}

    <section>
      <h2>Indicadores do período</h2>
      ${buildKpiCards(report)}
    </section>

    <footer class="footer">
      <p>Relatório gerado em <strong>${escapeHtml(generatedAtLabel)}</strong> por <strong>${escapeHtml(report.generatedBy)}</strong></p>
      <p>Classificação consolidada a partir de produção, fila de espera, agenda, avaliações e metas operacionais da rede municipal.</p>
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

export async function exportPrefeituraRankingUbtsReportPdf(context: ExportContext) {
  const filename = pdfFilenameFromLabel('ranking-ubts', context.report.periodLabel)
  const html = buildRankingUbtsReportHtml(context)
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
