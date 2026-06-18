import { brand } from '../../config/brand'
import {applyEntidadeCopyToExportText,
  buildEntidadeExportBaseStyles,
  resolveEntidadeExportBranding,
  type EntidadeExportBranding,
  resolveExportAssetUrl,
  escapeExportHtml
} from '../entidadeExportHtml'
import type { PrefeituraSlaStatus } from '../../types/prefeituraDashboard'
import {
  formatPrefeituraRedeUnitLocation,
  type PrefeituraRedeUnitCadastral,
} from '../../data/prefeituraRedeUnitDetail'
import type { PrefeituraUbsDetail } from '../../data/prefeituraUbsDetails'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'
import { getLoggedOperatorName } from '../sessionUser'

const SLA_LABELS: Record<PrefeituraSlaStatus, string> = {
  normal: 'Normal',
  atencao: 'Atenção',
  critico: 'Crítico',
}

export type PrefeituraUbsDetailExportContext = {
  detail: PrefeituraUbsDetail
  /** Cadastro completo da UBT (drawer da rede). */
  cadastral?: PrefeituraRedeUnitCadastral | null
  /** Rótulos do recorte do dashboard (período, região, tipo). */
  filterSummaryLines?: string[]
}

function credentialStatus(defined: boolean) {
  return defined ? 'Definida' : 'Não definida'
}

function buildCadastralTableRows(pairs: [string, string | number][]) {
  return pairs
    .map(([label, value]) => {
      const display = value === '' || value === undefined ? '—' : String(value)
      return `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(display)}</td></tr>`
    })
    .join('')
}

function buildCadastralReportHtml(cadastral: PrefeituraRedeUnitCadastral) {
  const { unit, address } = cadastral
  const location = formatPrefeituraRedeUnitLocation(cadastral)
  const stationsOffline = Math.max(0, unit.stationsTotal - unit.stationsOnline)

  const unitRows = buildCadastralTableRows([
    ['Nome', unit.name],
    ['CNES', unit.cnes],
    ['Tipo', cadastral.unitType],
    ['Região administrativa', unit.region],
    ['Situação', cadastral.statusLabel],
  ])

  const locationRows = buildCadastralTableRows([
    ['Endereço', location.primary],
    ['Bairro / Cidade', location.locality],
    ['CEP / Telefone', location.meta],
    ['Endereço cadastrado', address.formatted || unit.address],
  ])

  const responsibleRows = buildCadastralTableRows([
    ['Nome', unit.responsibleName],
    ['E-mail', cadastral.responsibleEmail],
    ['CPF', cadastral.responsibleCpf],
    ['Celular', unit.responsiblePhone],
    ['Senha de acesso', credentialStatus(cadastral.credentialsConfigured)],
    ['PIN de autorização', credentialStatus(cadastral.credentialsConfigured)],
  ])

  const operationRows = buildCadastralTableRows([
    ['Terminais online', `${unit.stationsOnline} de ${unit.stationsTotal}`],
    ['Terminais fora de linha', String(stationsOffline)],
    ['Capacidade diária', cadastral.dailyCapacityLabel],
    [
      'Especialidades habilitadas',
      cadastral.specialtyNames.length > 0 ? cadastral.specialtyNames.join(', ') : '—',
    ],
  ])

  const operatorRows =
    cadastral.operators.length > 0
      ? cadastral.operators
          .map(
            (operator) =>
              `<tr><td>${escapeHtml(operator.name)}</td><td>${escapeHtml(operator.role)}</td></tr>`,
          )
          .join('')
      : '<tr><td colspan="2">Nenhuma operadora cadastrada</td></tr>'

  const notesSection = cadastral.notes.trim()
    ? `<section>
        <h2>Observações</h2>
        <p style="font-size:12px;color:#374151;line-height:1.5;">${escapeHtml(cadastral.notes)}</p>
      </section>`
    : ''

  return `
    <section>
      <h2>Cadastro da unidade</h2>
      <table><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>${unitRows}</tbody></table>
    </section>
    <section>
      <h2>Localização</h2>
      <table><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>${locationRows}</tbody></table>
    </section>
    <section>
      <h2>Responsável</h2>
      <table><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>${responsibleRows}</tbody></table>
    </section>
    <section>
      <h2>Operação</h2>
      <table><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>${operationRows}</tbody></table>
    </section>
    <section>
      <h2>Operadoras</h2>
      <table><thead><tr><th>Nome</th><th>Função</th></tr></thead><tbody>${operatorRows}</tbody></table>
    </section>
    ${notesSection}
    <section>
      <h2>Métricas operacionais</h2>
      <p style="font-size:12px;color:#6b7280;margin-bottom:8px;">Indicadores do dia conforme painel municipal.</p>
    </section>
  `
}

function appendCadastralExcelRows(rows: (string | number)[][], cadastral: PrefeituraRedeUnitCadastral) {
  const { unit } = cadastral
  const location = formatPrefeituraRedeUnitLocation(cadastral)
  const stationsOffline = Math.max(0, unit.stationsTotal - unit.stationsOnline)

  pushSection(rows, 'Cadastro da unidade', ['Campo', 'Valor', ''], [
    ['Nome', unit.name, ''],
    ['CNES', unit.cnes, ''],
    ['Tipo', cadastral.unitType, ''],
    ['Região administrativa', unit.region, ''],
    ['Situação', cadastral.statusLabel, ''],
  ])

  pushSection(rows, 'Localização', ['Campo', 'Valor', ''], [
    ['Endereço', location.primary, ''],
    ['Bairro / Cidade', location.locality, ''],
    ['CEP / Telefone', location.meta, ''],
    ['Endereço cadastrado', cadastral.address.formatted || unit.address, ''],
  ])

  pushSection(rows, 'Responsável', ['Campo', 'Valor', ''], [
    ['Nome', unit.responsibleName, ''],
    ['E-mail', cadastral.responsibleEmail, ''],
    ['CPF', cadastral.responsibleCpf, ''],
    ['Celular', unit.responsiblePhone, ''],
    ['Senha de acesso', credentialStatus(cadastral.credentialsConfigured), ''],
    ['PIN de autorização', credentialStatus(cadastral.credentialsConfigured), ''],
  ])

  pushSection(rows, 'Operação', ['Campo', 'Valor', ''], [
    ['Terminais online', `${unit.stationsOnline} de ${unit.stationsTotal}`, ''],
    ['Terminais fora de linha', stationsOffline, ''],
    ['Capacidade diária', cadastral.dailyCapacityLabel, ''],
    [
      'Especialidades habilitadas',
      cadastral.specialtyNames.length > 0 ? cadastral.specialtyNames.join(', ') : '—',
      '',
    ],
  ])

  if (cadastral.operators.length > 0) {
    pushSection(
      rows,
      'Operadoras',
      ['Nome', 'Função', ''],
      cadastral.operators.map((operator) => [operator.name, operator.role, '']),
    )
  } else {
    pushSection(rows, 'Operadoras', ['Nome', 'Função', ''], [['—', 'Nenhuma operadora cadastrada', '']])
  }

  if (cadastral.notes.trim()) {
    pushSection(rows, 'Observações', ['Campo', 'Valor', ''], [['Anotações', cadastral.notes, '']])
  }
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

function buildReportStyles(branding: EntidadeExportBranding = resolveEntidadeExportBranding()) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
    }
    main { max-width: 900px; margin: 0 auto; padding: 28px 32px 36px; }
    .brand-bar { height: 5px; background: ${branding.corPrimaria}; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
    .header img { height: 36px; width: auto; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #6b7280; }
    .meta { font-size: 12px; color: #6b7280; margin-top: 12px; }
    .meta p + p { margin-top: 4px; }
    .filters { margin-top: 10px; padding: 10px 12px; background: #f9fafb; border-radius: 8px; font-size: 12px; color: #374151; }
    .filters li { margin-top: 2px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
    .kpi { padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f8fafc; }
    .kpi-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
    .kpi-value { font-size: 18px; font-weight: 700; margin-top: 4px; color: #111827; }
    section { margin-top: 22px; }
    h2 { font-size: 14px; font-weight: 700; margin-bottom: 10px; color: #111827; border-bottom: 2px solid ${branding.corPrimaria}; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media print { main { padding: 16px; } }
  `
}

function buildFilterBlock(lines: string[] | undefined) {
  if (!lines?.length) return ''
  const items = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')
  return `<div class="filters"><strong>Recorte do dashboard</strong><ul>${items}</ul></div>`
}

function buildUbsDetailReportHtml(context: PrefeituraUbsDetailExportContext) {
  const { detail, cadastral } = context
  const { unit } = detail
  const slaLabel = SLA_LABELS[unit.sla]
  const operatorName = getLoggedOperatorName()
  const generatedAt = formatGeneratedAt(new Date())
  const logoUrl = resolveExportAssetUrl(branding.logoUrl)
  const displayName = cadastral?.unit.name ?? unit.name
  const displaySubtitle = cadastral
    ? `${cadastral.unit.region} · ${cadastral.unitType} · CNES ${cadastral.unit.cnes}`
    : `${unit.region} · ${unit.type}`
  const cadastralHtml = cadastral ? buildCadastralReportHtml(cadastral) : ''
  const reportFooter = cadastral
    ? 'Relatório completo da UBT · cadastro, equipe e métricas operacionais.'
    : 'Relatório detalhado da unidade · dados conforme recorte do dashboard municipal.'

  const kpiItems = [
    { label: 'Consultas hoje', value: formatNumber(unit.consultationsToday) },
    { label: 'Fila atual', value: String(unit.queueNow) },
    { label: 'Concluídas', value: formatNumber(detail.consultationsCompleted) },
    { label: 'Em andamento', value: String(detail.consultationsInProgress) },
    { label: 'Faltas', value: String(unit.absencesToday) },
    { label: 'Operadores online', value: String(detail.operatorsOnline) },
    { label: 'Terminais ativos', value: String(detail.stationsActive) },
    { label: 'Cancelamentos', value: String(detail.cancellationsToday) },
    { label: 'Absenteísmo', value: `${detail.noShowRatePercent}%` },
  ]

  const kpiHtml = kpiItems
    .map(
      (item) => `
        <div class="kpi">
          <div class="kpi-label">${escapeHtml(item.label)}</div>
          <div class="kpi-value">${escapeHtml(item.value)}</div>
        </div>`,
    )
    .join('')

  const genderRows = detail.genderStats
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${item.count}</td><td>${item.percent}%</td></tr>`,
    )
    .join('')

  const specialtyRows = detail.specialties
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${formatNumber(item.count)}</td><td>${item.percent}%</td></tr>`,
    )
    .join('')

  const hourlyRows = detail.hourlyToday
    .map((point) => `<tr><td>${escapeHtml(point.hour)}</td><td>${point.value}</td></tr>`)
    .join('')

  const queueRows = detail.queueBreakdown
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${item.count}</td><td>${escapeHtml(item.description)}</td></tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Detalhes da unidade — ${escapeHtml(displayName)}</title>
  <style>${buildReportStyles(branding)}</style>
</head>
<body>
  <main>
    <div class="brand-bar"></div>
    <div class="header">
      <div>
        <h1>${escapeHtml(displayName)}</h1>
        <p class="subtitle">${escapeHtml(displaySubtitle)}</p>
        <div class="meta">
          <p><strong>${escapeExportHtml(branding.brandName)}</strong> · Painel municipal</p>
          <p>SLA: ${escapeHtml(slaLabel)} · Espera média: ${escapeHtml(unit.avgWait)}</p>
          ${cadastral ? `<p>Situação cadastral: ${escapeHtml(cadastral.statusLabel)}</p>` : ''}
          <p>Operador: ${escapeHtml(operatorName)} · Gerado em ${escapeHtml(generatedAt)}</p>
        </div>
        ${buildFilterBlock(context.filterSummaryLines)}
      </div>
      <img src="${escapeHtml(logoUrl)}" alt="${escapeExportHtml(branding.brandName)}" />
    </div>

    ${cadastralHtml}

    <div class="kpi-grid">${kpiHtml}</div>

    <div class="two-col">
      <section>
        <h2>Modalidade de atendimento</h2>
        <table>
          <thead><tr><th>Modalidade</th><th>Participação</th></tr></thead>
          <tbody>
            <tr><td>Teleatendimento</td><td>100%</td></tr>
            <tr><td>Pico do dia</td><td>${escapeHtml(detail.peakHour)}</td></tr>
            <tr><td>Duração média</td><td>${detail.avgConsultationMinutes} min</td></tr>
          </tbody>
        </table>
      </section>
      <section>
        <h2>Perfil por gênero</h2>
        <table>
          <thead><tr><th>Gênero</th><th>Consultas</th><th>%</th></tr></thead>
          <tbody>${genderRows}</tbody>
        </table>
      </section>
    </div>

    <section>
      <h2>Consultas por especialidade</h2>
      <table>
        <thead><tr><th>Especialidade</th><th>Volume</th><th>%</th></tr></thead>
        <tbody>${specialtyRows}</tbody>
      </table>
    </section>

    <div class="two-col">
      <section>
        <h2>Consultas por hora (hoje)</h2>
        <table>
          <thead><tr><th>Hora</th><th>Consultas</th></tr></thead>
          <tbody>${hourlyRows}</tbody>
        </table>
      </section>
      <section>
        <h2>Composição da fila atual</h2>
        <table>
          <thead><tr><th>Etapa</th><th>Quantidade</th><th>Descrição</th></tr></thead>
          <tbody>${queueRows}</tbody>
        </table>
      </section>
    </div>

    <p class="footer">${reportFooter}</p>
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

function unitSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function exportPrefeituraUbsDetailPdf(context: PrefeituraUbsDetailExportContext) {
  const displayName = context.cadastral?.unit.name ?? context.detail.unit.name
  const prefix = context.cadastral ? 'ubt-detalhe' : 'ubs-detalhe'
  const filename = pdfFilenameFromLabel(prefix, unitSlug(displayName))
  const title = `Detalhes da unidade — ${displayName}`
  const html = buildUbsDetailReportHtml(context)
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

function pushSection(
  rows: (string | number)[][],
  title: string,
  headers: string[],
  data: (string | number)[][],
) {
  rows.push([title, '', ''])
  rows.push(headers)
  rows.push(...data)
  rows.push(['', '', ''])
}

export function exportPrefeituraUbsDetailExcel(context: PrefeituraUbsDetailExportContext) {
  const { detail, cadastral } = context
  const { unit } = detail
  const slaLabel = SLA_LABELS[unit.sla]
  const displayName = cadastral?.unit.name ?? unit.name
  const rows: (string | number)[][] = []

  const filterLines = context.filterSummaryLines ?? []
  if (filterLines.length) {
    rows.push(['Recorte do dashboard', '', ''])
    filterLines.forEach((line) => rows.push([line, '', '']))
    rows.push(['', '', ''])
  }

  pushSection(rows, 'Identificação do relatório', ['Campo', 'Valor', ''], [
    ['Unidade', displayName, ''],
    ['Região administrativa', cadastral?.unit.region ?? unit.region, ''],
    ['Tipo', cadastral ? cadastral.unitType : unit.type, ''],
    ['SLA', slaLabel, ''],
    ['Espera média', unit.avgWait, ''],
    ['Operador', getLoggedOperatorName(), ''],
    ['Gerado em', formatGeneratedAt(new Date()), ''],
  ])

  if (cadastral) {
    appendCadastralExcelRows(rows, cadastral)
  }

  pushSection(rows, 'Indicadores do dia', ['Indicador', 'Valor', ''], [
    ['Consultas hoje', unit.consultationsToday, ''],
    ['Fila atual', unit.queueNow, ''],
    ['Concluídas', detail.consultationsCompleted, ''],
    ['Em andamento', detail.consultationsInProgress, ''],
    ['Faltas', unit.absencesToday, ''],
    ['Operadores online', detail.operatorsOnline, ''],
    ['Terminais ativos', detail.stationsActive, ''],
    ['Cancelamentos', detail.cancellationsToday, ''],
    ['Taxa de absenteísmo', `${detail.noShowRatePercent}%`, ''],
    ['Teleatendimento', '100%', ''],
    ['Pico do dia', detail.peakHour, ''],
    ['Duração média', `${detail.avgConsultationMinutes} min`, ''],
  ])

  pushSection(
    rows,
    'Perfil por gênero',
    ['Gênero', 'Consultas', '%'],
    detail.genderStats.map((item) => [item.label, item.count, `${item.percent}%`]),
  )

  pushSection(
    rows,
    'Especialidades',
    ['Especialidade', 'Volume', '%'],
    detail.specialties.map((item) => [item.label, item.count, `${item.percent}%`]),
  )

  pushSection(
    rows,
    'Consultas por hora',
    ['Hora', 'Consultas', ''],
    detail.hourlyToday.map((point) => [point.hour, point.value, '']),
  )

  pushSection(
    rows,
    'Fila atual',
    ['Etapa', 'Quantidade', 'Descrição'],
    detail.queueBreakdown.map((item) => [item.label, item.count, item.description]),
  )

  const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(';')).join('\r\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const filePrefix = cadastral ? 'ubt-detalhe' : 'ubs-detalhe'
  link.download = `${filePrefix}-${unitSlug(displayName)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
