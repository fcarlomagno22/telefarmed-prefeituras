import type { ReportCategoryConfig } from '../../config/reportsCategories'
import type { ReportTableColumn } from '../../data/relatoriosMock'
import { brand } from '../../config/brand'
import { formatCellValue, type ReportRowValue } from '../relatoriosFilters'
import { getLoggedOperatorName } from '../sessionUser'

export type RelatoriosExportContext = {
  category: ReportCategoryConfig
  columns: ReportTableColumn[]
  rows: Record<string, ReportRowValue>[]
  periodLabel: string
  unitLabel: string
}

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportRelatoriosExcel(context: RelatoriosExportContext): void {
  const header = context.columns.map((col) => col.label).join(',')
  const body = context.rows
    .map((row) =>
      context.columns
        .map((col) => escapeCsv(formatCellValue(col.key, row[col.key])))
        .join(','),
    )
    .join('\n')

  const blob = new Blob(['\uFEFF' + [header, body].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `relatorio-${context.category.id}-${Date.now()}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

function buildPdfHtml(context: RelatoriosExportContext): string {
  const operatorName = getLoggedOperatorName()
  const tableHead = context.columns.map((col) => `<th>${col.label}</th>`).join('')
  const tableBody = context.rows
    .map(
      (row) =>
        `<tr>${context.columns
          .map(
            (col) =>
              `<td>${formatCellValue(col.key, row[col.key])}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório — ${context.category.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>${context.category.title}</h1>
  <p class="meta">
    ${brand.appName} · ${context.unitLabel}<br />
    Período: ${context.periodLabel} · Operador: ${operatorName}<br />
    ${context.rows.length} registro(s) no relatório
  </p>
  <table>
    <thead><tr>${tableHead}</tr></thead>
    <tbody>${tableBody}</tbody>
  </table>
  <p class="footer">Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`
}

export function exportRelatoriosPdf(context: RelatoriosExportContext): void {
  const html = buildPdfHtml(context)
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!popup) {
    throw new Error('Permita pop-ups neste site para exportar o relatório em PDF.')
  }
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
}
