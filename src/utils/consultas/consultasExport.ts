import { brand } from '../../config/brand'
import {
  consultasFilterOptions,
  type ConsultationRecord,
  type ConsultationStatus,
} from '../../data/consultasMock'
import type { ConsultasFilters } from '../consultasFilters'
import { formatDatePtBr } from '../calendar'
import { downloadWindowAsPdf, pdfFilenameFromLabel } from '../htmlDocumentToPdf'
import { maskCpfForDisplay } from '../lgpdDisplay'

export type ConsultasExportContext = {
  records: ConsultationRecord[]
  filters: ConsultasFilters
  generalSearch: string
  sensitiveDataUnlocked: boolean
  unitLabel: string
  operatorName: string
}

const STATUS_LABELS: Record<ConsultationStatus, string> = {
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  em_andamento: 'Em andamento',
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

function labelFromOptions(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  if (!value) return null
  return options.find((item) => item.value === value)?.label ?? value
}

function buildFilterSummaryLines(
  filters: ConsultasFilters,
  generalSearch: string,
): string[] {
  const lines: string[] = []

  const periodStart = formatDatePtBr(filters.periodStart)
  const periodEnd = formatDatePtBr(filters.periodEnd)
  if (periodStart && periodEnd) {
    lines.push(`Período: ${periodStart} a ${periodEnd}`)
  }

  const specialty = labelFromOptions(consultasFilterOptions.specialties, filters.specialty)
  if (specialty && specialty !== 'Todas') lines.push(`Especialidade: ${specialty}`)

  const doctor = labelFromOptions(consultasFilterOptions.doctors, filters.doctor)
  if (doctor && doctor !== 'Todos') lines.push(`Médico: ${doctor}`)

  const neighborhood = labelFromOptions(
    consultasFilterOptions.neighborhoods,
    filters.neighborhood,
  )
  if (neighborhood && neighborhood !== 'Todos') lines.push(`Bairro: ${neighborhood}`)

  const gender = labelFromOptions(consultasFilterOptions.genders, filters.gender)
  if (gender && gender !== 'Todos') lines.push(`Sexo: ${gender}`)

  const ageRange = labelFromOptions(consultasFilterOptions.ageRanges, filters.ageRange)
  if (ageRange && ageRange !== 'Todas') lines.push(`Faixa etária: ${ageRange}`)

  const status = labelFromOptions(consultasFilterOptions.statuses, filters.status)
  if (status && status !== 'Todos') lines.push(`Status: ${status}`)

  const unit = labelFromOptions(consultasFilterOptions.units, filters.unit)
  if (unit && unit !== 'Todas') lines.push(`Unidade: ${unit}`)

  const search = generalSearch.trim()
  if (search) lines.push(`Busca: “${search}”`)

  return lines
}

function displayCpf(cpf: string, sensitiveDataUnlocked: boolean) {
  return sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)
}

function genderLabel(gender: ConsultationRecord['gender']) {
  return gender === 'F' ? 'Feminino' : 'Masculino'
}

function buildReportStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
    }
    main { max-width: 1100px; margin: 0 auto; padding: 28px 32px 36px; }
    .brand-bar { height: 5px; background: #ff6b00; border-radius: 999px; margin-bottom: 20px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    .header-logo { height: 36px; width: auto; max-width: 180px; object-fit: contain; }
    .header-fallback { font-size: 20px; font-weight: 800; color: #ff6b00; }
    .doc-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .doc-meta { margin-top: 4px; font-size: 13px; color: #6b7280; }
    .filters {
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      font-size: 12px;
      color: #4b5563;
    }
    .filters strong { color: #374151; }
    .filters ul { margin: 6px 0 0 18px; }
    .lgpd-note {
      margin-top: 10px;
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }
    .summary {
      margin-top: 14px;
      font-size: 13px;
      color: #374151;
    }
    .summary strong { font-weight: 700; }
    .table-wrap { margin-top: 18px; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead { background: #f9fafb; }
    th {
      padding: 8px 10px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
      color: #374151;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .patient-name { font-weight: 600; color: #111827; }
    .patient-cpf { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .patient-cpf.unlocked { color: #0284c7; }
    .footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 11px;
      color: #9ca3af;
    }
    @media print {
      main { padding: 16px 20px; }
    }
  `
}

function buildConsultasReportHtml(context: ConsultasExportContext) {
  const generatedAt = formatGeneratedAt(new Date())
  const logoUrl = resolveAssetUrl(brand.logoUrl)
  const filterLines = buildFilterSummaryLines(context.filters, context.generalSearch)
  const periodLabel = `${formatDatePtBr(context.filters.periodStart)} a ${formatDatePtBr(context.filters.periodEnd)}`

  const tableRows = context.records
    .map((record) => {
      const cpf = displayCpf(record.cpf, context.sensitiveDataUnlocked)
      const cpfClass = context.sensitiveDataUnlocked ? 'patient-cpf unlocked' : 'patient-cpf'
      const duration =
        record.durationMinutes !== null ? `${record.durationMinutes} min` : '—'

      return `
        <tr>
          <td>${escapeHtml(record.date)}<br><span style="color:#6b7280;font-size:10px">${escapeHtml(record.time)}</span></td>
          <td>
            <div class="patient-name">${escapeHtml(record.patientName)}</div>
            <div class="${cpfClass}">${escapeHtml(cpf)}</div>
          </td>
          <td>${record.age} anos · ${escapeHtml(genderLabel(record.gender))}</td>
          <td>${escapeHtml(record.specialty)}</td>
          <td>
            <div class="patient-name">${escapeHtml(record.doctorName)}</div>
            <div class="patient-cpf">${escapeHtml(record.doctorCrm)}</div>
          </td>
          <td>${escapeHtml(record.neighborhood)}</td>
          <td>${escapeHtml(STATUS_LABELS[record.status])}</td>
          <td>${escapeHtml(duration)}</td>
        </tr>
      `
    })
    .join('')

  const filtersBlock =
    filterLines.length > 0
      ? `<div class="filters"><strong>Filtros aplicados</strong><ul>${filterLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul></div>`
      : ''

  const lgpdNote = !context.sensitiveDataUnlocked
    ? '<p class="lgpd-note">CPF exibido com mascaramento conforme a LGPD.</p>'
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Histórico de consultas — ${escapeHtml(periodLabel)}</title>
  <style>${buildReportStyles()}</style>
</head>
<body>
  <main>
    <div class="brand-bar"></div>
    <header class="header">
      <div>
        <img class="header-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.appName)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
        <div class="header-fallback" style="display:none">${escapeHtml(brand.appName)}</div>
      </div>
      <div style="text-align:right">
        <h1 class="doc-title">Histórico de consultas</h1>
        <p class="doc-meta">Gerado em ${escapeHtml(generatedAt)}</p>
      </div>
    </header>

    <p class="doc-meta" style="margin-top:12px">
      <strong>Unidade:</strong> ${escapeHtml(context.unitLabel)} ·
      <strong>Operador:</strong> ${escapeHtml(context.operatorName)}
    </p>

    <p class="summary">
      <strong>${new Intl.NumberFormat('pt-BR').format(context.records.length)}</strong>
      consulta${context.records.length === 1 ? '' : 's'} no relatório
      · Período ${escapeHtml(periodLabel)}
    </p>

    ${filtersBlock}
    ${lgpdNote}

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data e hora</th>
            <th>Paciente</th>
            <th>Idade / sexo</th>
            <th>Especialidade</th>
            <th>Médico</th>
            <th>Bairro</th>
            <th>Status</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <footer class="footer">
      <span>${escapeHtml(brand.copyright)}</span>
      <span>${escapeHtml(brand.appName)} · Documento gerado automaticamente</span>
    </footer>
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

export async function exportConsultasPdf(context: ConsultasExportContext) {
  const periodLabel = `${formatDatePtBr(context.filters.periodStart)}-${formatDatePtBr(context.filters.periodEnd)}`
  const filename = pdfFilenameFromLabel('consultas', periodLabel)
  const title = `Histórico de consultas — ${periodLabel}`
  const html = buildConsultasReportHtml(context)
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

function csvCell(value: string | number) {
  const text = String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function exportConsultasExcel(context: ConsultasExportContext) {
  const header = [
    'Data',
    'Hora',
    'Paciente',
    'CPF',
    'Idade',
    'Sexo',
    'Especialidade',
    'Médico',
    'CRM',
    'Bairro',
    'Status',
    'Duração (min)',
  ]

  const rows = context.records.map((record) => [
    record.date,
    record.time,
    record.patientName,
    displayCpf(record.cpf, context.sensitiveDataUnlocked),
    record.age,
    genderLabel(record.gender),
    record.specialty,
    record.doctorName,
    record.doctorCrm,
    record.neighborhood,
    STATUS_LABELS[record.status],
    record.durationMinutes !== null ? record.durationMinutes : '',
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvCell(cell)).join(';'))
    .join('\r\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date())
    .replace(/[^\d]/g, '')
  link.href = url
  link.download = `consultas-${stamp}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
