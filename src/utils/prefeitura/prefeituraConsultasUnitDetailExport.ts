import { prefeituraSlaBadgeConfig } from '../../components/prefeitura/prefeituraDashboardUi'
import { brand } from '../../config/brand'
import type { PrefeituraConsultasUnitDetail } from '../../data/prefeituraConsultasUnitDetail'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'
import { getLoggedOperatorName } from '../sessionUser'

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
  return `"${String(value).replace(/"/g, '""')}"`
}

function buildReportHtml(detail: PrefeituraConsultasUnitDetail) {
  const { unit } = detail
  const statusLabel = prefeituraSlaBadgeConfig[unit.status].label
  const logoUrl = resolveAssetUrl(brand.logoUrl)
  const generatedAt = formatGeneratedAt(new Date())
  const operatorName = getLoggedOperatorName()

  const dailyRows = detail.dailySeries
    .map(
      (point) =>
        `<tr><td>${escapeHtml(point.label)}</td><td>${formatNumber(point.value)}</td></tr>`,
    )
    .join('')

  const specialtyRows = detail.specialties
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${formatNumber(item.count)}</td><td>${item.percent}%</td></tr>`,
    )
    .join('')

  const genderRows = detail.genderStats
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${formatNumber(item.count)}</td><td>${item.percent}%</td></tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Detalhes — ${escapeHtml(unit.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; }
    main { max-width: 900px; margin: 0 auto; padding: 28px 32px; }
    .bar { height: 5px; background: #ff6b00; border-radius: 999px; margin-bottom: 20px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .sub { color: #6b7280; font-size: 13px; }
    .meta { font-size: 12px; color: #6b7280; margin-top: 12px; }
    h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 2px solid #ff6b00; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <main>
    <div class="bar"></div>
    <h1>${escapeHtml(unit.name)}</h1>
    <p class="sub">${escapeHtml(unit.address)} · ${escapeHtml(unit.region)} · ${escapeHtml(statusLabel)}</p>
    <p class="sub">Período: ${escapeHtml(detail.periodLabel)}</p>
    <div class="meta">
      <p><strong>${escapeHtml(brand.appName)}</strong> · ${escapeHtml(operatorName)} · ${escapeHtml(generatedAt)}</p>
    </div>
    <h2>Resumo do período</h2>
    <table>
      <tbody>
        <tr><td>Volume total</td><td>${formatNumber(unit.volumeTotal)}</td></tr>
        <tr><td>Concluídas</td><td>${formatNumber(unit.completed)}</td></tr>
        <tr><td>Taxa conclusão</td><td>${formatPercent(unit.completionRate)}%</td></tr>
        <tr><td>Canceladas</td><td>${formatNumber(unit.cancelled)} (${formatPercent(unit.cancelledRate)}%)</td></tr>
        <tr><td>Duração média</td><td>${unit.avgDurationMin} min</td></tr>
        <tr><td>Vs média da rede</td><td>${detail.volumeVsNetworkPercent >= 0 ? '+' : ''}${formatPercent(detail.volumeVsNetworkPercent)}%</td></tr>
      </tbody>
    </table>
    <h2>Consultas por dia</h2>
    <table><thead><tr><th>Data</th><th>Volume</th></tr></thead><tbody>${dailyRows}</tbody></table>
    <h2>Especialidades</h2>
    <table><thead><tr><th>Especialidade</th><th>Volume</th><th>%</th></tr></thead><tbody>${specialtyRows}</tbody></table>
    <h2>Perfil por gênero</h2>
    <table><thead><tr><th>Gênero</th><th>Volume</th><th>%</th></tr></thead><tbody>${genderRows}</tbody></table>
  </main>
</body>
</html>`
}

export async function exportPrefeituraConsultasUnitDetailPdf(detail: PrefeituraConsultasUnitDetail) {
  const slug = detail.unit.name.toLowerCase().replace(/\s+/g, '-').slice(0, 40)
  const filename = pdfFilenameFromLabel('consultas-unidade', slug)
  const html = buildReportHtml(detail)
  const exportWindow = window.open('', '_blank')
  if (!exportWindow) {
    throw new Error('Permita pop-ups neste site para exportar o relatório em PDF.')
  }
  exportWindow.document.open()
  exportWindow.document.write(html)
  exportWindow.document.close()

  await new Promise<void>((resolve) => {
    if (exportWindow.document.readyState === 'complete') resolve()
    else exportWindow.addEventListener('load', () => resolve(), { once: true })
  })
  await new Promise<void>((resolve) => window.setTimeout(resolve, 350))

  try {
    await downloadWindowAsPdf(exportWindow, { filename })
  } finally {
    exportWindow.close()
  }
}

export function exportPrefeituraConsultasUnitDetailExcel(detail: PrefeituraConsultasUnitDetail) {
  const { unit } = detail
  const rows: (string | number)[][] = [
    ['Unidade', unit.name],
    ['Endereço', unit.address],
    ['Região', unit.region],
    ['Período', detail.periodLabel],
    ['Status', prefeituraSlaBadgeConfig[unit.status].label],
    [''],
    ['Volume total', unit.volumeTotal],
    ['Concluídas', unit.completed],
    ['Taxa conclusão (%)', formatPercent(unit.completionRate)],
    ['Canceladas', unit.cancelled],
    ['Canceladas (%)', formatPercent(unit.cancelledRate)],
    ['Duração média (min)', unit.avgDurationMin],
    [''],
    ['Data', 'Volume diário'],
    ...detail.dailySeries.map((p) => [p.label, p.value]),
    [''],
    ['Especialidade', 'Volume', '%'],
    ...detail.specialties.map((s) => [s.label, s.count, s.percent]),
  ]

  const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const slug = unit.name.replace(/\s+/g, '-').toLowerCase()
  link.href = url
  link.download = `consultas-${slug}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
