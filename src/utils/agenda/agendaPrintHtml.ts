import { brand } from '../../config/brand'
import type { AgendaDoctorShiftRecord } from '../../data/agendaDoctorShiftMock'
import { openAgendaFullReportView } from './agendaFullReportHtml'
import type {
  AgendaDaySummary,
  AgendaOperationalClimate,
  AppointmentStatus,
  DayAppointment,
} from '../../data/agendaMock'
import { findNetworkUserForAppointment } from '../agendaPatientUser'
import { maskCpfForDisplay, maskPhoneForDisplay } from '../lgpdDisplay'

export type OpenAgendaPrintOptions = {
  appointments: DayAppointment[]
  dayLabel: string
  unitLabel: string
  unitRoom?: string
  summary: AgendaDaySummary
  sensitiveDataUnlocked: boolean
  operatorName?: string
  /** `agenda` = lista do dia; `report` = relatório com resumo e clima */
  variant?: 'agenda' | 'report'
  operationalClimate?: AgendaOperationalClimate
}

const statusPrintConfig: Record<
  AppointmentStatus,
  { label: string; textColor: string; rowBg: string; lineGradient: string; lineGlow: string }
> = {
  realizado: {
    label: 'Realizado',
    textColor: '#047857',
    rowBg: '#ecfdf5',
    lineGradient: 'linear-gradient(to right, #34d399, #10b981, #14b8a6)',
    lineGlow: '0 2px 10px rgba(16, 185, 129, 0.55)',
  },
  em_atendimento: {
    label: 'Em atendimento',
    textColor: '#0369a1',
    rowBg: 'rgba(240, 249, 255, 0.85)',
    lineGradient: 'linear-gradient(to right, #38bdf8, #3b82f6, #6366f1)',
    lineGlow: '0 2px 10px rgba(59, 130, 246, 0.55)',
  },
  aguardando: {
    label: 'Aguardando',
    textColor: '#c2410c',
    rowBg: 'rgba(255, 247, 237, 0.9)',
    lineGradient: 'linear-gradient(to right, #fbbf24, #f97316, #ff6b00)',
    lineGlow: '0 2px 10px rgba(255, 107, 0, 0.55)',
  },
  agendado: {
    label: 'Agendado',
    textColor: '#4b5563',
    rowBg: '#ffffff',
    lineGradient: 'linear-gradient(to right, #d1d5db, #9ca3af, #64748b)',
    lineGlow: '0 2px 8px rgba(100, 116, 139, 0.4)',
  },
  faltou: {
    label: 'Faltou',
    textColor: '#dc2626',
    rowBg: 'rgba(254, 242, 242, 0.9)',
    lineGradient: 'linear-gradient(to right, #fb7185, #ef4444, #dc2626)',
    lineGlow: '0 2px 10px rgba(239, 68, 68, 0.5)',
  },
}

const timeColorByStatus: Record<AppointmentStatus, string> = {
  realizado: '#111827',
  em_atendimento: '#0284c7',
  aguardando: '#ea580c',
  agendado: '#111827',
  faltou: '#dc2626',
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

function formatStat(value: number) {
  return value.toString().padStart(2, '0')
}

function buildStatusBadge(status: AppointmentStatus) {
  const config = statusPrintConfig[status]
  return `
    <span class="status-badge" style="color: ${config.textColor}">
      ${escapeHtml(config.label)}
      <span class="status-badge-line" style="background: ${config.lineGradient}; box-shadow: ${config.lineGlow}"></span>
    </span>
  `
}

function buildPatientCell(appointment: DayAppointment, sensitiveDataUnlocked: boolean) {
  const patient = findNetworkUserForAppointment(appointment)
  const cpf = sensitiveDataUnlocked
    ? appointment.patientCpf
    : maskCpfForDisplay(appointment.patientCpf)
  const cpfClass = sensitiveDataUnlocked ? 'patient-cpf unlocked' : 'patient-cpf'

  const avatar = patient.avatarUrl
    ? `<img class="avatar-img" src="${escapeHtml(resolveAssetUrl(patient.avatarUrl))}" alt="" />`
    : `<span class="avatar-initials">${escapeHtml(patient.initials)}</span>`

  return `
    <div class="patient-cell">
      ${avatar}
      <div class="patient-meta">
        <p class="patient-name">${escapeHtml(appointment.patientName)}</p>
        <p class="${cpfClass}">${escapeHtml(cpf)}</p>
      </div>
    </div>
  `
}

function buildAppointmentRow(appointment: DayAppointment, sensitiveDataUnlocked: boolean) {
  const status = statusPrintConfig[appointment.status]
  const phone = sensitiveDataUnlocked
    ? appointment.patientPhone
    : maskPhoneForDisplay(appointment.patientPhone)
  const phoneClass = sensitiveDataUnlocked ? 'phone unlocked' : 'phone'

  return `
    <tr style="background: ${status.rowBg}">
      <td class="col-time" style="color: ${timeColorByStatus[appointment.status]}">${escapeHtml(appointment.time)}</td>
      <td class="col-patient">${buildPatientCell(appointment, sensitiveDataUnlocked)}</td>
      <td class="col-phone ${phoneClass}">${escapeHtml(phone)}</td>
      <td class="col-type">${escapeHtml(appointment.serviceType)}</td>
      <td class="col-status">${buildStatusBadge(appointment.status)}</td>
    </tr>
  `
}

function buildSummarySection(summary: AgendaDaySummary) {
  return `
    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">Total</span>
        <strong class="summary-value">${formatStat(summary.total)}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">Realizados</span>
        <strong class="summary-value">${formatStat(summary.completed)}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">Em atendimento</span>
        <strong class="summary-value">${formatStat(summary.inProgress)}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">Aguardando</span>
        <strong class="summary-value">${formatStat(summary.waiting)}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">Agendados</span>
        <strong class="summary-value">${formatStat(summary.scheduled)}</strong>
      </article>
      <article class="summary-card">
        <span class="summary-label">Faltas</span>
        <strong class="summary-value">${formatStat(summary.noShows)}</strong>
      </article>
      <article class="summary-card summary-card--highlight">
        <span class="summary-label">Comparecimento</span>
        <strong class="summary-value">${summary.attendanceRate}%</strong>
      </article>
    </section>
  `
}

function buildClimateSection(climate: AgendaOperationalClimate) {
  const maxCount = Math.max(...climate.hourlySlots.map((slot) => slot.count), 1)

  const bars = climate.hourlySlots
    .map((slot) => {
      const height = Math.max(12, Math.round((slot.count / maxCount) * 56))
      return `
        <div class="climate-slot${slot.isPeak ? ' climate-slot--peak' : ''}">
          <div class="climate-bar-wrap">
            <div class="climate-bar" style="height: ${height}px"></div>
          </div>
          <span class="climate-hour">${escapeHtml(slot.hour)}</span>
          <span class="climate-count">${slot.count}</span>
        </div>
      `
    })
    .join('')

  return `
    <section class="climate-section">
      <h2 class="section-title">Clima operacional</h2>
      <div class="climate-chart">${bars}</div>
    </section>
  `
}

function buildPrintStyles() {
  return `
    :root {
      --brand: #ff6b00;
      --brand-soft: #fff7ed;
      --text: #111827;
      --muted: #6b7280;
      --border: #f3f4f6;
      --border-strong: #e5e7eb;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: var(--text);
      background: #f5f6f8;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 28px 32px 40px;
      background: #fff;
      min-height: 100vh;
    }

    .print-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 24px;
      padding: 14px 18px;
      border-radius: 14px;
      background: var(--brand-soft);
      border: 1px solid rgba(255, 107, 0, 0.2);
    }

    .print-toolbar p {
      font-size: 14px;
      color: #9a3412;
      font-weight: 500;
    }

    .print-actions { display: flex; gap: 10px; }

    .btn {
      border: none;
      border-radius: 10px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--brand);
      color: #fff;
      box-shadow: 0 4px 14px rgba(255, 107, 0, 0.35);
    }

    .btn-ghost {
      background: #fff;
      color: #374151;
      border: 1px solid var(--border-strong);
    }

    .brand-bar {
      height: 6px;
      background: var(--brand);
      border-radius: 999px;
      margin-bottom: 24px;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-strong);
    }

    .header-logo {
      height: 40px;
      width: auto;
      max-width: 200px;
      object-fit: contain;
      display: block;
    }

    .header-fallback {
      font-size: 22px;
      font-weight: 800;
      color: var(--brand);
    }

    .header-right { text-align: right; }

    .doc-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .doc-date {
      margin-top: 6px;
      font-size: 14px;
      color: var(--muted);
    }

    .meta {
      margin-top: 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
      font-size: 13px;
      color: var(--muted);
    }

    .meta strong { color: #374151; font-weight: 600; }

    .lgpd-note {
      margin-top: 10px;
      font-size: 12px;
      color: var(--muted);
      font-style: italic;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 10px;
      margin: 24px 0 8px;
    }

    .summary-card {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 10px;
      text-align: center;
      background: #fafafa;
    }

    .summary-card--highlight {
      background: linear-gradient(135deg, #ecfdf5, #f0fdfa);
      border-color: #a7f3d0;
    }

    .summary-label {
      display: block;
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .summary-value {
      display: block;
      margin-top: 6px;
      font-size: 22px;
      font-weight: 800;
      color: var(--text);
    }

    .summary-card--highlight .summary-value {
      color: #059669;
    }

    .climate-section {
      margin: 20px 0 8px;
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fafafa;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 14px;
    }

    .climate-chart {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      justify-content: space-between;
    }

    .climate-slot {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .climate-bar-wrap {
      height: 56px;
      display: flex;
      align-items: flex-end;
    }

    .climate-bar {
      width: 100%;
      max-width: 36px;
      min-width: 20px;
      border-radius: 8px 8px 4px 4px;
      background: linear-gradient(to top, #9ca3af, #d1d5db);
    }

    .climate-slot--peak .climate-bar {
      background: linear-gradient(to top, #e55f00, #ff6b00, #ff9a3d);
      box-shadow: 0 0 12px rgba(255, 107, 0, 0.45);
    }

    .climate-hour {
      font-size: 11px;
      color: var(--muted);
      font-weight: 600;
    }

    .climate-count {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
    }

    .table-wrap {
      margin-top: 24px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .patients-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
      line-height: 1.25;
    }

    .patients-table thead th {
      text-align: left;
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #9ca3af;
      padding: 5px 8px;
      background: #fff;
      border-bottom: 1px solid var(--border-strong);
    }

    .patients-table thead th:nth-child(3),
    .patients-table thead th:nth-child(4),
    .patients-table thead th:nth-child(5) { text-align: center; }

    .patients-table tbody tr { border-bottom: 1px solid var(--border); }
    .patients-table tbody tr:last-child { border-bottom: none; }

    .patients-table tbody td {
      padding: 5px 8px;
      vertical-align: middle;
      font-size: 8px;
      color: #374151;
    }

    .patients-table .col-time {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      width: 52px;
    }

    .patients-table .col-phone,
    .patients-table .col-type,
    .patients-table .col-status { text-align: center; }
    .patients-table .col-type { color: #4b5563; }

    .patients-table .phone.unlocked { color: #0284c7; }

    .patients-table .patient-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .patients-table .avatar-img,
    .patients-table .avatar-initials {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .patients-table .avatar-img {
      object-fit: cover;
      border: 1px solid var(--border);
    }

    .patients-table .avatar-initials {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      color: #374151;
      font-size: 7px;
      font-weight: 700;
    }

    .patients-table .patient-name {
      font-size: 8px;
      font-weight: 700;
      line-height: 1.2;
      color: var(--text);
    }

    .patients-table .patient-cpf {
      margin-top: 1px;
      font-size: 7px;
      line-height: 1.2;
      color: var(--muted);
    }

    .patients-table .patient-cpf.unlocked { color: #0284c7; }

    .patients-table .status-badge {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 5.75rem;
      height: 1.25rem;
      overflow: hidden;
      border-radius: 5px;
      background: transparent;
      padding: 0 4px 5px;
      font-size: 7px;
      font-weight: 600;
      line-height: 1.1;
    }

    .patients-table .status-badge-line {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2px;
    }

    .patients-table .empty-state {
      padding: 24px 16px;
      text-align: center;
      color: var(--muted);
      font-size: 8px;
    }

    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid var(--border-strong);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 11px;
      color: #78716c;
    }

    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page {
        max-width: none;
        margin: 0;
        padding: 0;
        min-height: auto;
      }
      .table-wrap { border: none; border-radius: 0; }
      @page {
        size: landscape;
        margin: 12mm;
      }
    }
  `
}

function buildDocumentHtml(options: OpenAgendaPrintOptions) {
  const {
    appointments,
    dayLabel,
    unitLabel,
    unitRoom = 'Sala de Teleatendimento',
    summary,
    sensitiveDataUnlocked,
    operatorName = brand.operatorName,
    variant = 'agenda',
    operationalClimate,
  } = options

  const logoUrl = resolveAssetUrl(brand.logoUrl)
  const isReport = variant === 'report'
  const docTitle = isReport ? 'Relatório da agenda' : 'Agenda do dia'

  const rows =
    appointments.length > 0
      ? appointments
          .map((appointment) => buildAppointmentRow(appointment, sensitiveDataUnlocked))
          .join('')
      : ''

  const tableBody = appointments.length
    ? rows
    : `<tr><td colspan="5" class="empty-state">Nenhum agendamento para este dia.</td></tr>`

  const reportExtras =
    isReport
      ? `${buildSummarySection(summary)}${
          operationalClimate ? buildClimateSection(operationalClimate) : ''
        }`
      : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(docTitle)} — ${escapeHtml(dayLabel)}</title>
    <style>${buildPrintStyles()}</style>
  </head>
  <body>
    <main class="page">
      <div class="no-print print-toolbar">
        <p>Revise o documento e use o botão abaixo para imprimir ou salvar em PDF.</p>
        <div class="print-actions">
          <button type="button" class="btn btn-ghost" onclick="window.close()">Fechar</button>
          <button type="button" class="btn btn-primary" onclick="window.print()">Imprimir</button>
        </div>
      </div>

      <div class="brand-bar"></div>

      <header class="header">
        <div>
          <img class="header-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.appName)}" />
        </div>
        <div class="header-right">
          <h1 class="doc-title">${escapeHtml(docTitle)}</h1>
          <p class="doc-date">${escapeHtml(dayLabel)}</p>
        </div>
      </header>

      <div class="meta">
        <span><strong>${escapeHtml(unitLabel)}</strong> — ${escapeHtml(unitRoom)}</span>
        <span>Total: <strong>${summary.total}</strong> agendamentos</span>
        <span>Comparecimento: <strong>${summary.attendanceRate}%</strong></span>
        <span>Gerado em ${escapeHtml(formatGeneratedAt(new Date()))}</span>
        <span>Operador: <strong>${escapeHtml(operatorName)}</strong></span>
      </div>

      ${
        !sensitiveDataUnlocked
          ? '<p class="lgpd-note">CPF e telefone exibidos com mascaramento conforme a LGPD.</p>'
          : ''
      }

      ${reportExtras}

      <div class="table-wrap">
        <table class="patients-table">
          <thead>
            <tr>
              <th>Horário</th>
              <th>Paciente</th>
              <th>Telefone</th>
              <th>Tipo de atendimento</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>${tableBody}</tbody>
        </table>
      </div>

      <footer class="footer">
        <span>${escapeHtml(brand.copyright)}</span>
        <span>${escapeHtml(brand.appName)} · Documento gerado automaticamente</span>
      </footer>
    </main>
    <script>
      window.addEventListener('load', function () {
        window.setTimeout(function () { window.print(); }, 400);
      });
    </script>
  </body>
</html>`
}

export function openAgendaPrintView(options: OpenAgendaPrintOptions) {
  const html = buildDocumentHtml({ ...options, variant: 'agenda' })
  openPrintWindow(html, `Agenda — ${options.dayLabel}`)
}

export function openAgendaReportPrintView(
  options: OpenAgendaPrintOptions & { doctorShifts: AgendaDoctorShiftRecord[] },
): Promise<void> {
  return openAgendaFullReportView({ ...options, doctorShifts: options.doctorShifts })
}

function openWithDocumentWrite(documentHtml: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  printWindow.document.open()
  printWindow.document.write(documentHtml)
  printWindow.document.close()
  return true
}

function openPrintWindow(html: string, title: string) {
  const documentHtml = html.includes('<title>')
    ? html
    : html.replace('<head>', `<head>\n    <title>${escapeHtml(title)}</title>`)

  const blob = new Blob([documentHtml], { type: 'text/html;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  const printWindow = window.open(blobUrl, '_blank')

  if (printWindow) {
    const revokeBlobUrl = () => URL.revokeObjectURL(blobUrl)
    printWindow.addEventListener('load', revokeBlobUrl, { once: true })
    window.setTimeout(revokeBlobUrl, 120_000)
    return
  }

  URL.revokeObjectURL(blobUrl)

  if (openWithDocumentWrite(documentHtml)) return

  window.alert('Permita pop-ups neste site para abrir a visualização de impressão.')
}
