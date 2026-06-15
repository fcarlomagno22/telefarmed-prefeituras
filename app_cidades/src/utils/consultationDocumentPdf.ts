import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { CONSULTATION_DOCUMENT_PALETTES } from '../theme/consultationDocumentColors'
import {
  ConsultationCertificatePayload,
  ConsultationDocumentPdf,
  ConsultationExamPayload,
  ConsultationPrescriptionPayload,
} from '../types/appointmentDocuments'
import { StoredAppointment } from '../types/myAppointments'
import { getAppointmentDateTime } from './myAppointments'
import { formatScheduleDayLabel } from './scheduleDate'
import { resolvePdfLogoDataUri } from './pdfBrandLogo'

type ConsultationPdfMeta = {
  patientName?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatBrDate(value: string): string {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatCertificateDays(daysOff: number): string {
  if (daysOff <= 0) return 'Sem afastamento'
  if (daysOff === 1) return '1 dia de afastamento'
  return `${daysOff} dias de afastamento`
}

function buildBaseStyles(accent: string, accentSoft: string) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #fff;
      line-height: 1.45;
      padding: 28px 32px 40px;
    }
    .brand-bar {
      height: 6px;
      border-radius: 999px;
      background: linear-gradient(135deg, ${accent} 0%, ${accentSoft} 100%);
      margin-bottom: 22px;
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      padding-bottom: 18px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 22px;
    }
    .logo { height: 36px; width: auto; max-width: 180px; object-fit: contain; }
    .doc-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .doc-meta { margin-top: 6px; font-size: 13px; color: #6b7280; }
    .panel {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 16px;
      background: #fafafa;
    }
    .panel-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: ${accent};
      margin-bottom: 10px;
    }
    .row { margin-bottom: 8px; font-size: 14px; color: #374151; }
    .row strong { color: #111827; }
    .item {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .item:last-child { border-bottom: none; padding-bottom: 0; }
    .item-title { font-size: 15px; font-weight: 700; color: #111827; }
    .item-meta { margin-top: 4px; font-size: 13px; color: #6b7280; }
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.5;
    }
    .signature {
      margin-top: 28px;
      padding-top: 18px;
      border-top: 1px dashed #d1d5db;
      font-size: 13px;
      color: #374151;
    }
  `
}

function buildHeaderHtml(
  document: ConsultationDocumentPdf,
  appointment: StoredAppointment,
  patientName: string | undefined,
  logoSrc: string,
) {
  const appointmentDate = formatScheduleDayLabel(getAppointmentDateTime(appointment))
  const signedPrefix = document.kind === 'prescription' ? 'Assinada' : 'Assinado'

  return `
    <div class="brand-bar"></div>
    <div class="header">
      ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="Telefarmed" />` : '<div></div>'}
      <div style="text-align:right;">
        <div class="doc-title">${escapeHtml(document.title)}</div>
        <div class="doc-meta">${appointmentDate} · ${escapeHtml(appointment.selectedDoctorName)}</div>
        <div class="doc-meta">Protocolo ${escapeHtml(appointment.protocol)}</div>
        <div class="doc-meta">PDF • ${signedPrefix} às ${escapeHtml(document.signedAt)}</div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-title">Paciente</div>
      <div class="row"><strong>Nome:</strong> ${escapeHtml(patientName ?? 'Paciente')}</div>
      <div class="row"><strong>Especialidade:</strong> ${escapeHtml(appointment.specialtyName)}</div>
      <div class="row"><strong>Unidade:</strong> ${escapeHtml(appointment.selectedUbtName)}</div>
    </div>
  `
}

function buildPrescriptionBody(payload: ConsultationPrescriptionPayload) {
  const medications = payload.medications
    .map(
      (item) => `
        <div class="item">
          <div class="item-title">${escapeHtml(item.name)}</div>
          <div class="item-meta">${escapeHtml(item.dosage)} · ${escapeHtml(item.instructions)}</div>
        </div>
      `,
    )
    .join('')

  return `
    <div class="panel">
      <div class="panel-title">Medicamentos prescritos</div>
      ${medications}
      ${
        payload.validUntil
          ? `<div class="row" style="margin-top:12px;"><strong>Validade:</strong> ${formatBrDate(payload.validUntil)}</div>`
          : ''
      }
      ${
        payload.notes
          ? `<div class="row"><strong>Orientações:</strong> ${escapeHtml(payload.notes)}</div>`
          : ''
      }
    </div>
  `
}

function buildExamBody(payload: ConsultationExamPayload) {
  const exams = payload.exams
    .map(
      (item) => `
        <div class="item">
          <div class="item-title">${escapeHtml(item.name)}</div>
          <div class="item-meta">${escapeHtml(item.category)}</div>
          ${
            item.instructions
              ? `<div class="item-meta">${escapeHtml(item.instructions)}</div>`
              : ''
          }
        </div>
      `,
    )
    .join('')

  return `
    <div class="panel">
      <div class="panel-title">Exames solicitados</div>
      ${exams}
    </div>
  `
}

function buildCertificateBody(payload: ConsultationCertificatePayload) {
  return `
    <div class="panel">
      <div class="panel-title">Dados do documento</div>
      <div class="row"><strong>Tipo:</strong> ${formatCertificateDays(payload.daysOff)}</div>
      ${
        payload.startDate
          ? `<div class="row"><strong>Data de referência:</strong> ${formatBrDate(payload.startDate)}</div>`
          : ''
      }
      <div class="row"><strong>Motivo:</strong> ${escapeHtml(payload.reason)}</div>
      ${payload.cid ? `<div class="row"><strong>CID:</strong> ${escapeHtml(payload.cid)}</div>` : ''}
    </div>
  `
}

function buildConsultationDocumentHtml(
  document: ConsultationDocumentPdf,
  appointment: StoredAppointment,
  meta: ConsultationPdfMeta,
  logoSrc: string,
) {
  const palette = CONSULTATION_DOCUMENT_PALETTES[document.kind]
  const accent = palette.iconGradient[1]
  const accentSoft = palette.iconGradient[2]

  const body =
    document.kind === 'prescription'
      ? buildPrescriptionBody(document.payload as ConsultationPrescriptionPayload)
      : document.kind === 'exam'
        ? buildExamBody(document.payload as ConsultationExamPayload)
        : buildCertificateBody(document.payload as ConsultationCertificatePayload)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>${buildBaseStyles(accent, accentSoft)}</style>
</head>
<body>
  ${buildHeaderHtml(document, appointment, meta.patientName, logoSrc)}
  ${body}
  <div class="signature">
    Documento emitido eletronicamente durante a consulta por vídeo.<br />
    Médico(a): ${escapeHtml(appointment.selectedDoctorName)} · ${escapeHtml(appointment.specialtyName)}
  </div>
  <div class="footer">
    Telefarmed · Documento gerado para download pelo paciente. Em produção, este arquivo corresponde ao PDF assinado pelo profissional.
  </div>
</body>
</html>`
}

async function createConsultationDocumentPdf(
  document: ConsultationDocumentPdf,
  appointment: StoredAppointment,
  meta: ConsultationPdfMeta = {},
) {
  let logoSrc = ''
  try {
    logoSrc = await resolvePdfLogoDataUri()
  } catch {
    logoSrc = ''
  }

  const html = buildConsultationDocumentHtml(document, appointment, meta, logoSrc)
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: 595,
    height: 842,
  })

  return uri
}

export async function downloadConsultationDocumentPdf(
  document: ConsultationDocumentPdf,
  appointment: StoredAppointment,
  meta: ConsultationPdfMeta = {},
) {
  const uri = await createConsultationDocumentPdf(document, appointment, meta)
  const canShare = await Sharing.isAvailableAsync()

  if (!canShare) {
    throw new Error('Download indisponível neste dispositivo.')
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: document.downloadLabel,
  })
}
