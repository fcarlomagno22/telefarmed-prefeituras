import { brand } from '../../config/brand'
import {applyEntidadeCopyToExportText,
  buildEntidadeExportBaseStyles,
  resolveEntidadeExportBranding,
  type EntidadeExportBranding,
  resolveExportAssetUrl,
  escapeExportHtml
} from '../entidadeExportHtml'
import type {
  PrefeituraContratoMonthConsultation,
  PrefeituraContratoMonthDetail,
} from '../../data/prefeituraContratoMonthConsultations'
import { formatPrefeituraContratoLineNumber } from '../../data/prefeituraContratoMonthConsultations'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'
import { maskCpfForDisplay } from '../lgpdDisplay'
import { getLoggedOperatorName } from '../sessionUser'

export type PrefeituraContratoMonthExportContext = {
  detail: PrefeituraContratoMonthDetail
  sensitiveDataUnlocked: boolean
}

const TABLE_HEADERS = [
  'Nº',
  'Paciente',
  'CPF',
  'Idade',
  'Data',
  'Hora',
  'Especialidade',
  'Tempo de atendimento',
] as const

const COL_COUNT = TABLE_HEADERS.length
/** Limite de linhas no PDF para evitar falha de memória no html2canvas. */
const PDF_MAX_ROWS = 200

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
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

function emptyRow() {
  return Array.from({ length: COL_COUNT }, () => '')
}

function displayCpf(cpf: string, sensitiveDataUnlocked: boolean) {
  return sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)
}

function consultationToRow(
  record: PrefeituraContratoMonthConsultation,
  sensitiveDataUnlocked: boolean,
): (string | number)[] {
  return [
    formatPrefeituraContratoLineNumber(record.lineNumber),
    record.patientName,
    displayCpf(record.cpf, sensitiveDataUnlocked),
    record.age,
    record.date,
    record.time,
    record.specialty,
    `${record.durationMinutes} min`,
  ]
}

function buildKpiRows(detail: PrefeituraContratoMonthDetail): (string | number)[][] {
  const { kpis } = detail
  return [
    ['Contratadas', formatNumber(kpis.contracted)],
    ['Realizadas', formatNumber(kpis.performed)],
    ['Uso (%)', kpis.usagePercent],
    ['Avulsas', formatNumber(kpis.avulsoCount)],
  ]
}

function buildReportStyles(branding: EntidadeExportBranding = resolveEntidadeExportBranding()) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      line-height: 1.4;
    }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 32px 36px; }
    .brand-bar { height: 5px; background: ${branding.corPrimaria}; border-radius: 999px; margin-bottom: 20px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
    .header img { height: 36px; width: auto; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #6b7280; }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 32px;
      font-size: 12px;
      color: #6b7280;
      margin-top: 12px;
      align-items: start;
    }
    .meta-col { display: flex; flex-direction: column; gap: 4px; }
    .meta-col p { margin: 0; line-height: 1.45; }
    .meta-col strong { color: #374151; font-weight: 600; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0 20px; }
    .kpi-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #f9fafb; }
    .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; }
    .kpi-value { font-size: 18px; font-weight: 800; margin-top: 4px; color: #111827; }
    h2 { font-size: 14px; font-weight: 700; margin-bottom: 10px; color: #111827; border-bottom: 2px solid ${branding.corPrimaria}; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: center; }
    th { background: #f3f4f6; font-weight: 700; text-transform: uppercase; font-size: 10px; }
    td.col-patient { text-align: left; }
    .patient-cpf { font-size: 10px; color: #6b7280; }
    .patient-cpf.unlocked { color: #0284c7; }
    .lgpd-note { margin-top: 14px; font-size: 11px; color: #6b7280; }
    .footer { margin-top: 18px; font-size: 11px; color: #6b7280; }
  `
}

function buildConsultationRowHtml(
  record: PrefeituraContratoMonthConsultation,
  sensitiveDataUnlocked: boolean,
) {
  const cpf = displayCpf(record.cpf, sensitiveDataUnlocked)
  const cpfClass = sensitiveDataUnlocked ? 'patient-cpf unlocked' : 'patient-cpf'

  return `
    <tr>
      <td>${escapeHtml(formatPrefeituraContratoLineNumber(record.lineNumber))}</td>
      <td class="col-patient">${escapeHtml(record.patientName)}</td>
      <td class="${cpfClass}">${escapeHtml(cpf)}</td>
      <td>${record.age}</td>
      <td>${escapeHtml(record.date)}</td>
      <td>${escapeHtml(record.time)}</td>
      <td>${escapeHtml(record.specialty)}</td>
      <td>${record.durationMinutes} min</td>
    </tr>
  `
}

function buildContratoMonthReportHtml(
  context: PrefeituraContratoMonthExportContext,
  options?: { maxRows?: number },
) {
  const { detail, sensitiveDataUnlocked } = context
  const { kpis } = detail
  const totalConsultations = detail.consultations.length
  const maxRows = options?.maxRows
  const consultationsForReport =
    maxRows !== undefined ? detail.consultations.slice(0, maxRows) : detail.consultations
  const truncated = maxRows !== undefined && totalConsultations > consultationsForReport.length

  const rows = consultationsForReport
    .map((record) => buildConsultationRowHtml(record, sensitiveDataUnlocked))
    .join('')

  const lgpdNote = !sensitiveDataUnlocked
    ? '<p class="lgpd-note">CPF exibido com mascaramento conforme a LGPD.</p>'
    : ''

  const truncationNote = truncated
    ? `<p class="lgpd-note">PDF exibe as primeiras ${formatNumber(consultationsForReport.length)} de ${formatNumber(totalConsultations)} consultas. Use Excel para a lista completa.</p>`
    : ''

  const logoUrl = resolveExportAssetUrl(branding.logoUrl)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Consultas do mês — ${escapeHtml(detail.month.label)}</title>
  <style>${buildReportStyles(branding)}</style>
</head>
<body>
  <main>
    <div class="brand-bar"></div>
    <div class="header">
      <div>
        <h1>Consultas do pacote — ${escapeHtml(detail.monthLabelLong)}</h1>
        <p class="subtitle">${escapeHtml(brand.prefeituraOperatorFooterLabel)} · Gestão de contrato</p>
        <div class="meta">
          <div class="meta-col">
            <p><strong>Município:</strong> ${escapeHtml(detail.municipalityName)}</p>
            <p><strong>Contrato:</strong> ${escapeHtml(detail.contractNumber)}</p>
            <p><strong>Início da vigência:</strong> ${escapeHtml(detail.contractStartsAtLabel)}</p>
            <p><strong>Término da vigência:</strong> ${escapeHtml(detail.contractEndsAtLabel)}</p>
          </div>
          <div class="meta-col">
            <p><strong>Gerado em:</strong> ${escapeHtml(formatGeneratedAt(new Date()))}</p>
            <p><strong>Operador:</strong> ${escapeHtml(getLoggedOperatorName())}</p>
            <p><strong>Total de linhas:</strong> ${escapeHtml(formatNumber(totalConsultations))}</p>
          </div>
        </div>
      </div>
      <img src="${escapeHtml(logoUrl)}" alt="${escapeExportHtml(branding.brandName)}" crossorigin="anonymous" onerror="this.style.display='none'" />
    </div>

    <section>
      <h2>Indicadores do mês</h2>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Contratadas</div><div class="kpi-value">${formatNumber(kpis.contracted)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Realizadas</div><div class="kpi-value">${formatNumber(kpis.performed)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Uso</div><div class="kpi-value">${kpis.usagePercent}%</div></div>
        <div class="kpi-card"><div class="kpi-label">Avulsas</div><div class="kpi-value">${formatNumber(kpis.avulsoCount)}</div></div>
      </div>
    </section>

    <section>
      <h2>Lista de consultas</h2>
      <table>
        <thead>
          <tr>
            ${TABLE_HEADERS.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${lgpdNote}
      ${truncationNote}
    </section>

    <p class="footer">Relatório gerado pelo painel municipal ${escapeExportHtml(branding.brandName)}.</p>
  </main>
</body>
</html>`
}

function openExportWindow(html: string, title: string) {
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
    if (targetWindow.document.readyState === 'complete') {
      resolve()
      return
    }
    targetWindow.addEventListener('load', () => resolve(), { once: true })
  })
}

export async function exportPrefeituraContratoMonthPdf(context: PrefeituraContratoMonthExportContext) {
  const slug = context.detail.month.key.replace(/[^\w-]+/g, '-')
  const filename = pdfFilenameFromLabel(`contrato-consultas-${slug}`, 'municipal')
  const title = 'Consultas do mês — exportação'
  const html = buildContratoMonthReportHtml(context, { maxRows: PDF_MAX_ROWS })
  const exportWindow = openExportWindow(html, title)

  try {
    await waitForExportWindowReady(exportWindow)
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 450)
    })
    await downloadWindowAsPdf(exportWindow, { filename })
  } finally {
    exportWindow.close()
  }
}

function pushContractMetaRows(rows: (string | number)[][], detail: PrefeituraContratoMonthDetail) {
  rows.push(['Município', detail.municipalityName, ...emptyRow().slice(2)])
  rows.push(['Nº do contrato', detail.contractNumber, ...emptyRow().slice(2)])
  rows.push(['Início da vigência', detail.contractStartsAtLabel, ...emptyRow().slice(2)])
  rows.push(['Término da vigência', detail.contractEndsAtLabel, ...emptyRow().slice(2)])
  rows.push(['Mês do relatório', detail.monthLabelLong, ...emptyRow().slice(2)])
}

export function exportPrefeituraContratoMonthExcel(context: PrefeituraContratoMonthExportContext) {
  const { detail, sensitiveDataUnlocked } = context
  const rows: (string | number)[][] = []

  pushContractMetaRows(rows, detail)
  rows.push(emptyRow())
  rows.push(['Indicadores do mês', ...emptyRow().slice(1)])
  buildKpiRows(detail).forEach((kpiRow) => {
    rows.push([kpiRow[0], kpiRow[1], ...emptyRow().slice(2)])
  })
  rows.push(emptyRow())
  rows.push([...TABLE_HEADERS])

  detail.consultations.forEach((record) => {
    rows.push(consultationToRow(record, sensitiveDataUnlocked))
  })

  rows.push(emptyRow())
  rows.push(['Operador', getLoggedOperatorName(), ...emptyRow().slice(2)])
  rows.push(['Gerado em', formatGeneratedAt(new Date()), ...emptyRow().slice(2)])

  const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `contrato-consultas-${detail.month.key}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
