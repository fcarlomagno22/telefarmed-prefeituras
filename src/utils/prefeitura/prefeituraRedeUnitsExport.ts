import { brand } from '../../config/brand'
import { prefeituraRedeStatusBadgeConfig } from '../../components/prefeitura/rede/prefeituraRedeStatusBadge'
import {
  prefeituraRedeRegionFilterOptions,
  prefeituraRedeStatusFilterOptions,
  type PrefeituraRedeUnit,
} from '../../data/prefeituraRedeMock'
import {
  buildPrefeituraRedeUnitCadastral,
  formatPrefeituraRedeUnitLocation,
  type PrefeituraRedeUnitCadastralProfile,
} from '../../data/prefeituraRedeUnitDetail'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'
import { getLoggedOperatorName } from '../sessionUser'

export type PrefeituraRedeUnitsExportContext = {
  units: PrefeituraRedeUnit[]
  regionFilter: string
  statusFilter: string
  search: string
  cadastralProfilesByUnitId?: Record<string, PrefeituraRedeUnitCadastralProfile>
}

const TABLE_HEADERS = [
  'Unidade',
  'Endereço',
  'CNES',
  'Região',
  'Responsável',
  'Celular',
  'Terminais',
  'Online',
  'Status',
] as const

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

function csvCell(value: string | number) {
  const text = String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function labelFromOptions(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  if (!value || value === 'todas') return null
  return options.find((item) => item.value === value)?.label ?? value
}

function buildFilterSummaryLines(context: PrefeituraRedeUnitsExportContext) {
  const lines: string[] = []

  const region = labelFromOptions(prefeituraRedeRegionFilterOptions, context.regionFilter)
  if (region) lines.push(`Região: ${region}`)

  const status = labelFromOptions(prefeituraRedeStatusFilterOptions, context.statusFilter)
  if (status) lines.push(`Status: ${status}`)

  const search = context.search.trim()
  if (search) lines.push(`Busca: “${search}”`)

  lines.push(`Unidades no relatório: ${formatNumber(context.units.length)}`)

  return lines
}

function sortUnits(units: PrefeituraRedeUnit[]) {
  return [...units].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

function unitToRow(unit: PrefeituraRedeUnit): (string | number)[] {
  return [
    unit.name,
    unit.address,
    unit.cnes,
    unit.region,
    unit.responsibleName,
    unit.responsiblePhone,
    unit.stationsTotal,
    unit.stationsOnline,
    prefeituraRedeStatusBadgeConfig[unit.status].label,
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
    .unit-block { margin-top: 18px; page-break-inside: avoid; }
    .unit-block h3 { font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #111827; }
    .unit-block table { font-size: 11px; }
    @media print { main { padding: 16px; } thead { display: table-header-group; } }
  `
}

function buildFilterBlock(lines: string[]) {
  if (!lines.length) return ''
  const items = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')
  return `<div class="filters"><strong>Recorte aplicado</strong><ul>${items}</ul></div>`
}

function buildListTableHtml(units: PrefeituraRedeUnit[]) {
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
      <h2>Unidades Básicas de Teleatendimento</h2>
      <table>
        <thead><tr>${header}</tr></thead>
        <tbody>${body || '<tr><td colspan="9">Nenhuma unidade no recorte.</td></tr>'}</tbody>
      </table>
    </section>
  `
}

function buildCadastralAppendixHtml(
  units: PrefeituraRedeUnit[],
  profiles?: Record<string, PrefeituraRedeUnitCadastralProfile>,
) {
  if (!profiles || Object.keys(profiles).length === 0) return ''

  const blocks = sortUnits(units)
    .map((unit) => {
      const profile = profiles[unit.id]
      if (!profile) return ''

      const cadastral = buildPrefeituraRedeUnitCadastral(unit, profile)
      const location = formatPrefeituraRedeUnitLocation(cadastral)
      const operators =
        cadastral.operators.length > 0
          ? cadastral.operators
              .map((op) => `<li>${escapeHtml(op.name)} — ${escapeHtml(op.role)}</li>`)
              .join('')
          : '<li>Nenhuma operadora cadastrada</li>'

      return `
        <div class="unit-block">
          <h3>${escapeHtml(unit.name)}</h3>
          <table>
            <tbody>
              <tr><td>CNES / Tipo</td><td>${escapeHtml(unit.cnes)} · ${escapeHtml(cadastral.unitType)}</td></tr>
              <tr><td>Região / Situação</td><td>${escapeHtml(unit.region)} · ${escapeHtml(cadastral.statusLabel)}</td></tr>
              <tr><td>Endereço</td><td>${escapeHtml(location.full)}</td></tr>
              <tr><td>Responsável</td><td>${escapeHtml(unit.responsibleName)} · ${escapeHtml(cadastral.responsibleEmail)} · ${escapeHtml(cadastral.responsibleCpf)} · ${escapeHtml(unit.responsiblePhone)}</td></tr>
              <tr><td>Operação</td><td>${unit.stationsOnline}/${unit.stationsTotal} terminais · ${escapeHtml(cadastral.dailyCapacityLabel)}</td></tr>
              <tr><td>Especialidades</td><td>${escapeHtml(cadastral.specialtyNames.join(', ') || '—')}</td></tr>
            </tbody>
          </table>
          <p style="font-size:11px;font-weight:600;margin:8px 0 4px;color:#374151;">Operadoras</p>
          <ul style="font-size:11px;color:#374151;padding-left:18px;">${operators}</ul>
          ${cadastral.notes ? `<p style="font-size:11px;color:#6b7280;margin-top:6px;"><strong>Obs.:</strong> ${escapeHtml(cadastral.notes)}</p>` : ''}
        </div>
      `
    })
    .filter(Boolean)
    .join('')

  if (!blocks) return ''

  return `
    <section style="margin-top:28px;">
      <h2>Anexo — cadastro detalhado</h2>
      <p style="font-size:12px;color:#6b7280;margin-bottom:12px;">Unidades com perfil cadastral disponível no painel.</p>
      ${blocks}
    </section>
  `
}

function buildRedeUnitsReportHtml(context: PrefeituraRedeUnitsExportContext) {
  const filterLines = buildFilterSummaryLines(context)
  const operatorName = getLoggedOperatorName()
  const generatedAt = formatGeneratedAt(new Date())
  const logoUrl = resolveAssetUrl(brand.logoUrl)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rede de UBTs — exportação</title>
  <style>${buildReportStyles()}</style>
</head>
<body>
  <main>
    <div class="brand-bar"></div>
    <div class="header">
      <div>
        <h1>Rede de unidades</h1>
        <p class="subtitle">Unidades Básicas de Teleatendimento</p>
        <div class="meta">
          <p><strong>${escapeHtml(brand.appName)}</strong> · Painel municipal</p>
          <p>Operador: ${escapeHtml(operatorName)} · Gerado em ${escapeHtml(generatedAt)}</p>
        </div>
        ${buildFilterBlock(filterLines)}
      </div>
      <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.appName)}" />
    </div>

    ${buildListTableHtml(context.units)}
    ${buildCadastralAppendixHtml(context.units, context.cadastralProfilesByUnitId)}

    <p class="footer">
      Relatório da rede municipal · lista conforme filtros aplicados na tabela de UBTs.
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

function pushSection(
  rows: (string | number)[][],
  title: string,
  headers: string[],
  data: (string | number)[][],
) {
  rows.push([title, '', '', '', '', '', '', '', ''])
  rows.push(headers)
  rows.push(...data)
  rows.push(['', '', '', '', '', '', '', '', ''])
}

export async function exportPrefeituraRedeUnitsPdf(context: PrefeituraRedeUnitsExportContext) {
  const filename = pdfFilenameFromLabel('rede-ubts', 'lista')
  const title = 'Rede de UBTs — exportação'
  const html = buildRedeUnitsReportHtml(context)
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

export function exportPrefeituraRedeUnitsExcel(context: PrefeituraRedeUnitsExportContext) {
  const rows: (string | number)[][] = []
  const filterLines = buildFilterSummaryLines(context)

  if (filterLines.length) {
    rows.push(['Recorte aplicado', '', '', '', '', '', '', '', ''])
    filterLines.forEach((line) => rows.push([line, '', '', '', '', '', '', '', '']))
    rows.push(['', '', '', '', '', '', '', '', ''])
  }

  pushSection(
    rows,
    'Unidades Básicas de Teleatendimento',
    [...TABLE_HEADERS],
    sortUnits(context.units).map((unit) => unitToRow(unit)),
  )

  const profiles = context.cadastralProfilesByUnitId
  if (profiles && Object.keys(profiles).length > 0) {
    const detailRows: (string | number)[][] = []

    sortUnits(context.units).forEach((unit) => {
      const profile = profiles[unit.id]
      if (!profile) return

      const cadastral = buildPrefeituraRedeUnitCadastral(unit, profile)
      const location = formatPrefeituraRedeUnitLocation(cadastral)

      detailRows.push([unit.name, '', '', '', '', '', '', '', ''])
      detailRows.push(['CNES', unit.cnes, 'Tipo', cadastral.unitType, 'Região', unit.region, 'Situação', cadastral.statusLabel, ''])
      detailRows.push(['Endereço', location.full, '', '', '', '', '', '', ''])
      detailRows.push([
        'Responsável',
        unit.responsibleName,
        'E-mail',
        cadastral.responsibleEmail,
        'CPF',
        cadastral.responsibleCpf,
        'Celular',
        unit.responsiblePhone,
        '',
      ])
      detailRows.push([
        'Terminais',
        `${unit.stationsOnline}/${unit.stationsTotal}`,
        'Capacidade',
        cadastral.dailyCapacityLabel,
        '',
        '',
        '',
        '',
        '',
      ])
      detailRows.push([
        'Especialidades',
        cadastral.specialtyNames.join(', ') || '—',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ])
      cadastral.operators.forEach((operator) => {
        detailRows.push(['Operadora', operator.name, 'Função', operator.role, '', '', '', '', ''])
      })
      if (cadastral.notes) {
        detailRows.push(['Observações', cadastral.notes, '', '', '', '', '', '', ''])
      }
      detailRows.push(['', '', '', '', '', '', '', '', ''])
    })

    if (detailRows.length) {
      rows.push(['Anexo — cadastro detalhado', '', '', '', '', '', '', '', ''])
      rows.push(...detailRows)
    }
  }

  rows.push(['Operador', getLoggedOperatorName(), '', '', '', '', '', '', ''])
  rows.push(['Gerado em', formatGeneratedAt(new Date()), '', '', '', '', '', '', ''])

  const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'rede-ubts-lista.csv'
  link.click()
  URL.revokeObjectURL(url)
}
