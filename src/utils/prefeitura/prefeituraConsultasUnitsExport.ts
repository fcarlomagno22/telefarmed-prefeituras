import { prefeituraSlaBadgeConfig } from '../../components/prefeitura/prefeituraDashboardUi'
import { brand } from '../../config/brand'
import {
  prefeituraConsultasRegionFilterOptions,
  prefeituraConsultasUnitFilterOptions,
  type PrefeituraConsultasUnitRow,
} from '../../data/prefeituraConsultasMock'
import { formatDatePtBr } from '../calendar'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'
import { getLoggedOperatorName } from '../sessionUser'

export type PrefeituraConsultasUnitsExportContext = {
  units: PrefeituraConsultasUnitRow[]
  unitFilter: string
  regionFilter: string
  periodStart: string
  periodEnd: string
  search: string
}

const TABLE_HEADERS = [
  'Unidade',
  'Endereço',
  'Região',
  'Volume total',
  'Concluídas',
  'Taxa conclusão (%)',
  'Canceladas',
  'Canceladas (%)',
  'Duração média (min)',
  'Status',
] as const

const COL_COUNT = TABLE_HEADERS.length

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

function formatGeneratedAt(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function csvCell(value: string | number) {
  const text = String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function emptyRow() {
  return Array.from({ length: COL_COUNT }, () => '')
}

function labelFromOptions(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  if (!value || value === 'todas') return null
  return options.find((item) => item.value === value)?.label ?? value
}

function buildFilterSummaryLines(context: PrefeituraConsultasUnitsExportContext) {
  const lines: string[] = []

  const periodStart = formatDatePtBr(context.periodStart)
  const periodEnd = formatDatePtBr(context.periodEnd)
  if (periodStart && periodEnd) {
    lines.push(`Período: ${periodStart} a ${periodEnd}`)
  }

  const unit = labelFromOptions(prefeituraConsultasUnitFilterOptions, context.unitFilter)
  if (unit && unit !== 'Selecione uma unidade') lines.push(`Unidade: ${unit}`)

  const region = labelFromOptions(prefeituraConsultasRegionFilterOptions, context.regionFilter)
  if (region && region !== 'Selecione uma região') lines.push(`Região: ${region}`)

  const search = context.search.trim()
  if (search) lines.push(`Busca: “${search}”`)

  lines.push(`Unidades no relatório: ${formatNumber(context.units.length)} (lista completa)`)

  return lines
}

function sortUnits(units: PrefeituraConsultasUnitRow[]) {
  return [...units].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

function unitToRow(unit: PrefeituraConsultasUnitRow): (string | number)[] {
  return [
    unit.name,
    unit.address,
    unit.region,
    unit.volumeTotal,
    unit.completed,
    formatPercent(unit.completionRate),
    unit.cancelled,
    formatPercent(unit.cancelledRate),
    unit.avgDurationMin,
    prefeituraSlaBadgeConfig[unit.status].label,
  ]
}

function buildReportStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      line-height: 1.4;
    }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 32px 36px; }
    .brand-bar { height: 5px; background: #ff6b00; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
    .header img { height: 36px; width: auto; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #6b7280; }
    .meta { font-size: 12px; color: #6b7280; margin-top: 12px; }
    .meta p + p { margin-top: 4px; }
    .filters { margin-top: 10px; padding: 10px 12px; background: #f9fafb; border-radius: 8px; font-size: 12px; color: #374151; }
    .filters li { margin-top: 2px; }
    section { margin-top: 20px; }
    h2 { font-size: 14px; font-weight: 700; margin-bottom: 10px; color: #111827; border-bottom: 2px solid #ff6b00; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 7px 8px; text-align: left; vertical-align: top; }
    th { background: #f9fafb; font-weight: 600; color: #374151; white-space: nowrap; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
    @media print { main { padding: 16px; } thead { display: table-header-group; } }
  `
}

function buildFilterBlock(lines: string[]) {
  if (!lines.length) return ''
  const items = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')
  return `<div class="filters"><strong>Recorte aplicado</strong><ul>${items}</ul></div>`
}

function buildListTableHtml(units: PrefeituraConsultasUnitRow[]) {
  const header = TABLE_HEADERS.map((col) => `<th>${escapeHtml(col)}</th>`).join('')
  const body = sortUnits(units)
    .map((unit) => {
      const cells = unitToRow(unit)
        .map((cell) => `<td>${escapeHtml(String(cell))}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  return `
    <section>
      <h2>Consultas por unidade</h2>
      <table>
        <thead><tr>${header}</tr></thead>
        <tbody>${body || `<tr><td colspan="${COL_COUNT}">Nenhuma unidade no recorte.</td></tr>`}</tbody>
      </table>
    </section>
  `
}

function buildConsultasUnitsReportHtml(context: PrefeituraConsultasUnitsExportContext) {
  const filterLines = buildFilterSummaryLines(context)
  const operatorName = getLoggedOperatorName()
  const generatedAt = formatGeneratedAt(new Date())
  const logoUrl = resolveAssetUrl(brand.logoUrl)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Consultas por unidade — exportação</title>
  <style>${buildReportStyles()}</style>
</head>
<body>
  <main>
    <div class="brand-bar"></div>
    <div class="header">
      <div>
        <h1>Consultas por unidade</h1>
        <p class="subtitle">Visão consolidada das consultas de telemedicina na rede municipal</p>
        <div class="meta">
          <p><strong>${escapeHtml(brand.appName)}</strong> · Painel municipal</p>
          <p>Operador: ${escapeHtml(operatorName)} · Gerado em ${escapeHtml(generatedAt)}</p>
        </div>
        ${buildFilterBlock(filterLines)}
      </div>
      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.appName)}" />
    </div>

    ${buildListTableHtml(context.units)}

    <p class="footer">
      Relatório municipal de consultas por UBT · lista conforme filtros aplicados na tabela.
    </p>
  </main>
</body>
</html>`
}

function openExportWindow(html: string, title: string): Window {
  const documentHtml = html.includes('<title>')
    ? html
    : html.replace('<head>', `<head><title>${escapeHtml(title)}</title>`)

  const exportWindow = window.open('', '_blank')
  if (!exportWindow) {
    throw new Error('Permita pop-ups neste site para exportar o relatório em PDF.')
  }

  exportWindow.document.open()
  exportWindow.document.write(documentHtml)
  exportWindow.document.close()
  return exportWindow
}

function waitForExportWindowReady(targetWindow: Window) {
  return new Promise<void>((resolve) => {
    const document = targetWindow.document
    if (document.readyState === 'complete') {
      resolve()
      return
    }
    targetWindow.addEventListener('load', () => resolve(), { once: true })
  })
}

export async function exportPrefeituraConsultasUnitsPdf(
  context: PrefeituraConsultasUnitsExportContext,
) {
  const filename = pdfFilenameFromLabel('consultas-por-unidade', 'municipal')
  const title = 'Consultas por unidade — exportação'
  const html = buildConsultasUnitsReportHtml(context)
  const exportWindow = openExportWindow(html, title)

  try {
    await waitForExportWindowReady(exportWindow)
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 350)
    })
    await downloadWindowAsPdf(exportWindow, { filename })
  } finally {
    exportWindow.close()
  }
}

export function exportPrefeituraConsultasUnitsExcel(
  context: PrefeituraConsultasUnitsExportContext,
) {
  const rows: (string | number)[][] = []
  const filterLines = buildFilterSummaryLines(context)

  if (filterLines.length) {
    rows.push(['Recorte aplicado', ...emptyRow().slice(1)])
    filterLines.forEach((line) => rows.push([line, ...emptyRow().slice(1)]))
    rows.push(emptyRow())
  }

  rows.push([...TABLE_HEADERS])
  sortUnits(context.units).forEach((unit) => {
    rows.push(unitToRow(unit))
  })

  rows.push(emptyRow())
  rows.push(['Operador', getLoggedOperatorName(), ...emptyRow().slice(2)])
  rows.push(['Gerado em', formatGeneratedAt(new Date()), ...emptyRow().slice(2)])

  const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'consultas-por-unidade-municipal.csv'
  link.click()
  URL.revokeObjectURL(url)
}
