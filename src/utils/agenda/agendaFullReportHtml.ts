import { brand } from '../../config/brand'
import {
  applyEntidadeCopyToExportText,
  escapeExportHtml,
  resolveEntidadeExportBranding,
  resolveExportAssetUrl,
} from '../entidadeExportHtml'
import {
  agendaChartSegments,
  AGENDA_PIXEL_COUNT,
  filledAgendaPixelCount,
  maxAgendaChartSegmentValue,
} from '../../data/agendaChartSegments'
import type {
  AgendaDoctorShiftRecord,
  DoctorRatings,
  DoctorStarRatingBreakdown,
} from '../../data/agendaDoctorShiftMock'
import type {
  AgendaDaySummary,
  AgendaOperationalClimate,
  AppointmentStatus,
  DayAppointment,
} from '../../data/agendaMock'
import { findNetworkUserForAppointment } from '../agendaPatientUser'
import { maskCpfForDisplay, maskPhoneForDisplay } from '../lgpdDisplay'
import {
  downloadWindowAsPdf,
  HTML_PDF_EXPORT_MESSAGE_TYPE,
  pdfFilenameFromLabel,
} from '../htmlDocumentToPdf'
import type { OpenAgendaPrintOptions } from './agendaPrintHtml'

export type AgendaFullReportOptions = OpenAgendaPrintOptions & {
  doctorShifts: AgendaDoctorShiftRecord[]
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
    textColor: '#b45309',
    rowBg: 'rgba(255, 251, 235, 0.9)',
    lineGradient: 'linear-gradient(to right, #fde047, #fbbf24, #f59e0b)',
    lineGlow: '0 2px 10px rgba(245, 158, 11, 0.45)',
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
  aguardando: '#d97706',
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
    ? `<img class="avatar-img" src="${escapeHtml(resolveAssetUrl(patient.avatarUrl))}" alt="" crossorigin="anonymous" />`
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

function buildPixelChartSection(summary: AgendaDaySummary) {
  const maxValue = maxAgendaChartSegmentValue(summary)

  const rows = agendaChartSegments
    .map((segment) => {
      const value = segment.getValue(summary)
      const filled = filledAgendaPixelCount(value, maxValue)
      const pixels = Array.from({ length: AGENDA_PIXEL_COUNT }, (_, index) => {
        const isFilled = index < filled
        return `<span class="pixel ${isFilled ? 'pixel--filled' : 'pixel--empty'}" style="${
          isFilled
            ? `background:${segment.printGradient};box-shadow:${segment.printGlow}`
            : `background:${segment.printEmptyColor}`
        }"></span>`
      }).join('')

      return `
        <div class="pixel-row">
          <span class="pixel-count" style="color:${segment.printValueColor}">${formatStat(value)}</span>
          <div class="pixel-track">${pixels}</div>
        </div>
      `
    })
    .join('')

  const legend = agendaChartSegments
    .map(
      (segment) => `
      <div class="legend-item">
        <span class="legend-swatch" style="background:${segment.printGradient};box-shadow:${segment.printGlow}"></span>
        <div class="legend-text">
          <strong style="color:${segment.printValueColor}">${escapeHtml(segment.situation)}</strong>
          <span>${escapeHtml(segment.legendDescription)}</span>
        </div>
      </div>
    `,
    )
    .join('')

  return `
    <section class="panel resumo-panel">
      <header class="panel-header">
        <h2 class="panel-title">Resumo do dia</h2>
        <p class="panel-subtitle">Distribuição visual por situação do atendimento</p>
      </header>

      <div class="resumo-total">
        <span>Total de agendamentos</span>
        <strong>${formatStat(summary.total)}</strong>
      </div>

      <div class="pixel-chart">${rows}</div>

      <div class="chart-legend">
        <p class="legend-title">O que cada cor representa</p>
        <div class="legend-grid">${legend}</div>
      </div>

      <div class="attendance-block">
        <div class="attendance-head">
          <span>Taxa de comparecimento</span>
          <strong>${summary.attendanceRate}%</strong>
        </div>
        <div class="attendance-bar">
          <div class="attendance-fill" style="width:${summary.attendanceRate}%"></div>
        </div>
      </div>
    </section>
  `
}

function buildClimatePanel(climate: AgendaOperationalClimate) {
  const maxCount = Math.max(...climate.hourlySlots.map((slot) => slot.count), 1)

  const bars = climate.hourlySlots
    .map((slot) => {
      const heightPercent = (slot.count / maxCount) * 100
      const barHeight = Math.max(28, (heightPercent / 100) * 72)
      const isPeak = slot.isPeak

      return `
        <div class="climate-col${isPeak ? ' climate-col--peak' : ''}">
          <span class="climate-col-count">${slot.count}</span>
          <div class="climate-col-track">
            <span class="climate-col-bar" style="height:${barHeight}px"></span>
          </div>
          <span class="climate-col-hour">${escapeHtml(slot.hour)}</span>
        </div>
      `
    })
    .join('')

  return `
    <section class="panel climate-panel">
      <header class="panel-header">
        <h2 class="panel-title">Clima operacional</h2>
        <p class="panel-subtitle">Planeje a equipe pelo volume do dia</p>
      </header>
      <div class="climate-chart-ui">${bars}</div>
    </section>
  `
}

function formatRatingAverage(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function buildStarDisplay(average: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const starIndex = index + 1
    const filled = average >= starIndex - 0.25
    const half = !filled && average >= starIndex - 0.75
    const className = filled ? 'star star--full' : half ? 'star star--half' : 'star star--empty'
    const symbol = filled || half ? '★' : '☆'
    return `<span class="${className}" aria-hidden="true">${symbol}</span>`
  }).join('')
}

function buildRatingsBreakdownRows(byStars: DoctorStarRatingBreakdown[]) {
  return [...byStars]
    .sort((a, b) => b.stars - a.stars)
    .map(({ stars, count }) => {
      const starLabel = '★'.repeat(stars) + '☆'.repeat(5 - stars)
      const reviewLabel =
        count === 0
          ? 'Nenhuma avaliação'
          : count === 1
            ? '1 avaliação'
            : `${count} avaliações`

      return `
        <div class="rating-breakdown-row">
          <span class="rating-breakdown-stars" aria-label="${stars} estrelas">${starLabel}</span>
          <span class="rating-breakdown-count">${reviewLabel}</span>
        </div>
      `
    })
    .join('')
}

function buildDoctorRatingsBlock(ratings: DoctorRatings) {
  return `
    <div class="doctor-ratings">
      <p class="doctor-ratings-title">Avaliações do dia</p>
      <div class="doctor-rating-summary">
        <div class="doctor-rating-average">
          <strong>${formatRatingAverage(ratings.average)}</strong>
          <span class="doctor-rating-stars">${buildStarDisplay(ratings.average)}</span>
        </div>
        <span class="doctor-rating-total">${ratings.totalReviews} avaliação${ratings.totalReviews === 1 ? '' : 'ões'} no total</span>
      </div>
      <div class="doctor-rating-breakdown">
        ${buildRatingsBreakdownRows(ratings.byStars)}
      </div>
    </div>
  `
}

function buildDoctorsSection(doctors: AgendaDoctorShiftRecord[]) {
  if (!doctors.length) {
    return `
      <section class="report-section">
        <h2 class="section-heading">Plantão médico — atendimentos por hora</h2>
        <p class="empty-note">Nenhum registro de plantão médico para este dia.</p>
      </section>
    `
  }

  const cards = doctors
    .map((doctor) => {
      const hourlyRows = doctor.hourlyAttendance
        .map(
          (slot) => `
          <tr>
            <td>${escapeHtml(slot.hour)}</td>
            <td class="hourly-count">${slot.patientCount}</td>
          </tr>
        `,
        )
        .join('')

      return `
        <article class="doctor-card">
          <div class="doctor-card-top">
            <img class="doctor-photo" src="${escapeHtml(resolveAssetUrl(doctor.avatarUrl))}" alt="" crossorigin="anonymous" />
            <div class="doctor-info">
              <h3 class="doctor-name">${escapeHtml(doctor.name)}</h3>
              <p class="doctor-specialty">${escapeHtml(doctor.specialty)}</p>
              <div class="doctor-shift-times">
                <span><strong>Entrada:</strong> ${escapeHtml(doctor.loginAt)}</span>
                <span><strong>Saída:</strong> ${escapeHtml(doctor.logoutAt)}</span>
              </div>
              <p class="doctor-total">
                <strong>${doctor.totalPatients}</strong> pacientes atendidos no plantão
              </p>
            </div>
          </div>
          ${buildDoctorRatingsBlock(doctor.ratings)}
          <div class="doctor-hourly-wrap">
            <p class="doctor-hourly-title">Pacientes por hora do plantão</p>
            <table class="doctor-hourly-table">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Pacientes</th>
                </tr>
              </thead>
              <tbody>${hourlyRows}</tbody>
            </table>
          </div>
        </article>
      `
    })
    .join('')

  return `
    <section class="report-section doctors-section">
      <h2 class="section-heading">Plantão médico — atendimentos por hora</h2>
      <p class="section-lead">Resumo de cada profissional: horário de entrada e saída, avaliações recebidas por estrelas e volume de pacientes atendidos em cada hora do plantão.</p>
      <div class="doctors-grid">${cards}</div>
    </section>
  `
}

function buildFullReportStyles() {
  const branding = resolveEntidadeExportBranding()
  const brandColor = branding.corPrimaria
  return `
    :root {
      --brand: ${brandColor};
      --brand-soft: color-mix(in srgb, ${brandColor} 12%, white);
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
      padding: 28px 32px 48px;
      background: #fff;
    }
    .no-print.print-toolbar {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      margin-bottom: 24px; padding: 14px 18px; border-radius: 14px;
      background: var(--brand-soft); border: 1px solid rgba(255, 107, 0, 0.2);
    }
    .no-print.print-toolbar p { font-size: 14px; color: #9a3412; font-weight: 500; }
    .print-actions { display: flex; gap: 10px; }
    .btn { border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: var(--brand); color: #fff; box-shadow: 0 4px 14px rgba(255, 107, 0, 0.35); }
    .btn-ghost { background: #fff; color: #374151; border: 1px solid var(--border-strong); }
    .brand-bar { height: 6px; background: var(--brand); border-radius: 999px; margin-bottom: 24px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-strong); }
    .header-logo { height: 40px; width: auto; max-width: 200px; object-fit: contain; }
    .header-right { text-align: right; }
    .doc-title { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
    .doc-date { margin-top: 6px; font-size: 14px; color: var(--muted); }
    .meta { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 13px; color: var(--muted); }
    .meta strong { color: #374151; font-weight: 600; }
    .lgpd-note { margin-top: 10px; font-size: 12px; color: var(--muted); font-style: italic; }

    .report-top-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-top: 24px;
      align-items: stretch;
    }
    .panel {
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      background: #fff;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }
    .panel-header { margin-bottom: 16px; }
    .panel-title { font-size: 18px; font-weight: 800; }
    .panel-subtitle { margin-top: 4px; font-size: 12px; color: var(--muted); }

    .resumo-total {
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border);
      font-size: 14px; color: var(--muted);
    }
    .resumo-total strong { font-size: 28px; font-weight: 800; color: var(--text); }

    .pixel-chart { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .pixel-row { display: flex; align-items: center; gap: 10px; }
    .pixel-count { width: 28px; flex-shrink: 0; font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; }
    .pixel-track { display: flex; flex: 1; gap: 3px; min-width: 0; }
    .pixel { flex: 1; height: 14px; border-radius: 3px; display: block; }
    .pixel--empty { background: #f3f4f6 !important; box-shadow: none !important; }

    .chart-legend {
      border-top: 1px solid var(--border);
      padding-top: 14px;
      margin-bottom: 16px;
    }
    .legend-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 10px; }
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 14px;
    }
    .legend-item { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
    .legend-swatch { width: 28px; height: 10px; border-radius: 3px; flex-shrink: 0; margin-top: 3px; }
    .legend-text { font-size: 12px; color: var(--muted); line-height: 1.4; }
    .legend-text strong { display: block; font-size: 13px; margin-bottom: 1px; }

    .attendance-block { border-top: 1px solid var(--border); padding-top: 14px; }
    .attendance-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: var(--muted); }
    .attendance-head strong { font-size: 24px; font-weight: 800; background: linear-gradient(to right, #10b981, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .attendance-bar { height: 10px; border-radius: 999px; background: #f3f4f6; overflow: hidden; }
    .attendance-fill { height: 100%; border-radius: 999px; background: linear-gradient(to right, #34d399, #10b981, #14b8a6); box-shadow: 0 0 10px rgba(16,185,129,0.35); }

    .climate-chart-ui { display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; margin-top: 8px; }
    .climate-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
    .climate-col-count { font-size: 10px; font-weight: 800; color: #6b7280; font-variant-numeric: tabular-nums; }
    .climate-col--peak .climate-col-count { color: var(--brand); }
    .climate-col-track { height: 72px; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
    .climate-col-bar { width: 100%; max-width: 28px; min-width: 16px; border-radius: 6px 6px 4px 4px; background: linear-gradient(to top, #9ca3af, #d1d5db); }
    .climate-col--peak .climate-col-bar { background: linear-gradient(to top, color-mix(in srgb, var(--brand) 85%, black), var(--brand), color-mix(in srgb, var(--brand) 70%, white)); box-shadow: 0 0 12px color-mix(in srgb, var(--brand) 35%, transparent); }
    .climate-col-hour { font-size: 10px; font-weight: 600; color: #6b7280; }
    .climate-col--peak .climate-col-hour { color: var(--brand); }

    .report-section { margin-top: 28px; }
    .section-heading { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
    .section-lead { font-size: 13px; color: var(--muted); margin-bottom: 16px; }
    .empty-note { font-size: 14px; color: var(--muted); padding: 24px; text-align: center; border: 1px dashed var(--border-strong); border-radius: 12px; }

    .table-wrap { border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
    .patients-table { width: 100%; border-collapse: collapse; font-size: 8px; line-height: 1.25; }
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
    .patients-table .col-time { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .patients-table .col-phone,
    .patients-table .col-type,
    .patients-table .col-status { text-align: center; }
    .patients-table .phone.unlocked { color: #0284c7; }
    .patients-table .patient-cell { display: flex; align-items: center; gap: 6px; }
    .patients-table .avatar-img,
    .patients-table .avatar-initials {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      flex-shrink: 0;
    }
    .patients-table .avatar-img { object-fit: cover; border: 1px solid var(--border); }
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

    .doctors-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .doctor-card {
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      background: #fafafa;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .doctor-card-top { display: flex; gap: 14px; padding: 16px; background: #fff; border-bottom: 1px solid var(--border); }
    .doctor-photo { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; border: 2px solid var(--border); flex-shrink: 0; }
    .doctor-name { font-size: 16px; font-weight: 800; }
    .doctor-specialty { margin-top: 2px; font-size: 13px; color: var(--brand); font-weight: 600; }
    .doctor-shift-times { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 10px; font-size: 12px; color: var(--muted); }
    .doctor-shift-times strong { color: #374151; }
    .doctor-total { margin-top: 10px; font-size: 13px; color: #374151; }
    .doctor-total strong { font-size: 20px; color: var(--text); }
    .doctor-ratings {
      padding: 14px 16px;
      background: #fffbeb;
      border-top: 1px solid #fde68a;
      border-bottom: 1px solid var(--border);
    }
    .doctor-ratings-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #b45309;
      margin-bottom: 10px;
    }
    .doctor-rating-summary {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 12px;
      margin-bottom: 12px;
    }
    .doctor-rating-average {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .doctor-rating-average strong {
      font-size: 22px;
      font-weight: 800;
      color: #92400e;
      line-height: 1;
    }
    .doctor-rating-stars { display: inline-flex; gap: 2px; font-size: 16px; line-height: 1; }
    .star--full { color: #f59e0b; }
    .star--half { color: #fbbf24; opacity: 0.85; }
    .star--empty { color: #d1d5db; }
    .doctor-rating-total { font-size: 12px; color: #92400e; font-weight: 600; }
    .doctor-rating-breakdown { display: flex; flex-direction: column; gap: 6px; }
    .rating-breakdown-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 12px;
    }
    .rating-breakdown-stars {
      letter-spacing: 1px;
      color: #f59e0b;
      font-size: 13px;
      white-space: nowrap;
    }
    .rating-breakdown-count { color: #6b7280; font-weight: 600; text-align: right; }
    .doctor-hourly-wrap { padding: 14px 16px 16px; }
    .doctor-hourly-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 10px; }
    .doctor-hourly-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .doctor-hourly-table th { text-align: left; padding: 6px 8px; color: #9ca3af; font-weight: 700; border-bottom: 1px solid var(--border); }
    .doctor-hourly-table td { padding: 7px 8px; border-bottom: 1px solid #f9fafb; }
    .doctor-hourly-table .hourly-count { text-align: right; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }

    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border-strong); display: flex; justify-content: space-between; gap: 12px; font-size: 11px; color: #78716c; }

    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { max-width: none; margin: 0; padding: 0; }
      .report-top-grid { break-inside: avoid; }
      .doctor-card { break-inside: avoid; }
      @page { size: A4 portrait; margin: 12mm; }
    }
    @media (max-width: 900px) {
      .doctors-grid { grid-template-columns: 1fr; }
    }
  `
}

function buildFullReportHtml(options: AgendaFullReportOptions) {
  const {
    appointments,
    dayLabel,
    unitLabel,
    unitRoom = 'Sala de Teleatendimento',
    summary,
    sensitiveDataUnlocked,
    operatorName = brand.operatorName,
    operationalClimate,
    doctorShifts,
  } = options

  const branding = resolveEntidadeExportBranding()
  const logoUrl = resolveExportAssetUrl(branding.logoUrl)
  const rows = appointments.map((a) => buildAppointmentRow(a, sensitiveDataUnlocked)).join('')
  const tableBody = appointments.length
    ? rows
    : `<tr><td colspan="5" class="empty-state">Nenhum agendamento para este dia.</td></tr>`

  const climatePanel = operationalClimate
    ? buildClimatePanel(operationalClimate)
    : '<section class="panel climate-panel"><p class="empty-note">Sem dados de clima operacional.</p></section>'

  return applyEntidadeCopyToExportText(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório completo — ${escapeHtml(dayLabel)}</title>
  <style>${buildFullReportStyles()}</style>
</head>
<body>
  <main class="page">
    <div class="no-print print-toolbar">
      <p>Gerando PDF do relatório completo… Esta janela fechará automaticamente após o download.</p>
    </div>

    <div class="brand-bar"></div>

    <header class="header">
      <div><img class="header-logo" src="${escapeHtml(logoUrl)}" alt="${escapeExportHtml(branding.brandName)}" crossorigin="anonymous" /></div>
      <div class="header-right">
        <h1 class="doc-title">Relatório completo da agenda</h1>
        <p class="doc-date">${escapeHtml(dayLabel)}</p>
      </div>
    </header>

    <div class="meta">
      <span><strong>${escapeHtml(unitLabel)}</strong> — ${escapeHtml(unitRoom)}</span>
      <span>Total: <strong>${summary.total}</strong> agendamentos</span>
      <span>Comparecimento: <strong>${summary.attendanceRate}%</strong></span>
      <span>Médicos no plantão: <strong>${doctorShifts.length}</strong></span>
      <span>Gerado em ${escapeHtml(formatGeneratedAt(new Date()))}</span>
      <span>Operador: <strong>${escapeHtml(operatorName)}</strong></span>
    </div>
    ${!sensitiveDataUnlocked ? '<p class="lgpd-note">CPF e telefone exibidos com mascaramento conforme a LGPD.</p>' : ''}

    <div class="report-top-grid">
      ${buildPixelChartSection(summary)}
      ${climatePanel}
    </div>

    <section class="report-section">
      <h2 class="section-heading">Agenda completa do dia</h2>
      <p class="section-lead">Todos os agendamentos registrados para a data selecionada.</p>
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
    </section>

    ${buildDoctorsSection(doctorShifts)}

    <footer class="footer">
      <span>${escapeHtml(brand.copyright)}</span>
      <span>${escapeExportHtml(branding.brandName)} · Relatório completo gerado automaticamente</span>
    </footer>
  </main>
  <script>
    window.addEventListener('load', function () {
      window.setTimeout(function () {
        if (!window.opener) {
          window.alert('Não foi possível iniciar a exportação em PDF. Permita pop-ups e tente novamente.');
          window.close();
          return;
        }
        window.opener.postMessage({ type: '${HTML_PDF_EXPORT_MESSAGE_TYPE}' }, '*');
      }, 450);
    });
  </script>
</body>
</html>`)
}

function openPrintWindow(html: string, title: string): Window | null {
  const documentHtml = html.includes('<title>')
    ? html
    : html.replace('<head>', `<head><title>${escapeHtml(title)}</title>`)

  const previewWindow = window.open('', '_blank')
  if (!previewWindow) {
    window.alert('Permita pop-ups neste site para exportar o relatório em PDF.')
    return null
  }

  previewWindow.document.open()
  previewWindow.document.write(documentHtml)
  previewWindow.document.close()
  return previewWindow
}

export function openAgendaFullReportView(options: AgendaFullReportOptions): Promise<void> {
  const title = `Relatório completo — ${options.dayLabel}`
  const filename = pdfFilenameFromLabel('relatorio-agenda', options.dayLabel)
  const html = buildFullReportHtml(options)

  return new Promise((resolve, reject) => {
    let settled = false
    let exportWindow: Window | null = null

    const finish = (result: 'resolve' | 'reject', error?: unknown) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onExportMessage)
      if (result === 'resolve') resolve()
      else reject(error ?? new Error('Falha ao exportar relatório em PDF.'))
    }

    const onExportMessage = (event: MessageEvent) => {
      if (event.data?.type !== HTML_PDF_EXPORT_MESSAGE_TYPE) return
      if (event.source !== exportWindow) return

      void (async () => {
        const targetWindow = exportWindow
        if (!targetWindow) return

        try {
          await downloadWindowAsPdf(targetWindow, { filename })
          finish('resolve')
        } catch (error) {
          finish('reject', error)
          window.alert('Não foi possível gerar o PDF do relatório.')
        } finally {
          if (!targetWindow.closed) targetWindow.close()
        }
      })()
    }

    window.addEventListener('message', onExportMessage)
    exportWindow = openPrintWindow(html, title)

    if (!exportWindow) {
      finish('reject', new Error('Pop-up bloqueado.'))
      return
    }

    window.setTimeout(() => {
      if (!settled) {
        if (exportWindow && !exportWindow.closed) exportWindow.close()
        finish('reject', new Error('Tempo esgotado ao gerar o PDF.'))
      }
    }, 120_000)
  })
}
