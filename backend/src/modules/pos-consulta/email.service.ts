import {
  buildPosConsultaCheckinEmailHtml,
  buildPosConsultaCheckinEmailSubject,
  buildPosConsultaCheckinEmailText,
  type PosConsultaCheckinEmailVariables,
} from '../../lib/email/posConsultaEmailTemplate.js'
import { resolvePublicAppUrl } from '../../lib/codigoVerificacaoDocumento.js'
import { sendMail } from '../../lib/email/smtp.js'
import {
  getPosConsultaTotalCheckins,
  POS_CONSULTA_PLAN_TOTAL_DAYS,
  POS_CONSULTA_TIMEZONE,
} from './config.js'

export type SendPosConsultaCheckinEmailInput = {
  to: string
  patientFirstName: string
  doctorName: string
  specialtyName: string
  checkinToken: string
  checkinNumber: number
  planDayNumber: number
}

function buildPosConsultaCheckinUrl(token: string): string {
  const base = resolvePublicAppUrl()
  return `${base.replace(/\/$/, '')}/ubt/acompanhamento/${encodeURIComponent(token)}`
}

function formatSentAtLabel(sentAt = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: POS_CONSULTA_TIMEZONE,
  })
    .format(sentAt)
    .replace(',', ' às')
}

function buildEmailVariables(input: SendPosConsultaCheckinEmailInput): PosConsultaCheckinEmailVariables {
  return {
    patientFirstName: input.patientFirstName,
    specialtyName: input.specialtyName,
    planDayNumber: input.planDayNumber,
    planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
    checkinNumber: input.checkinNumber,
    totalCheckins: getPosConsultaTotalCheckins(),
    doctorName: input.doctorName,
    checkinUrl: buildPosConsultaCheckinUrl(input.checkinToken),
    sentAtLabel: formatSentAtLabel(),
  }
}

export { buildPosConsultaCheckinEmailSubject }

export function buildPosConsultaCheckinEmailHtmlFromInput(
  input: SendPosConsultaCheckinEmailInput,
): string {
  return buildPosConsultaCheckinEmailHtml(buildEmailVariables(input))
}

export async function sendPosConsultaCheckinEmail(input: SendPosConsultaCheckinEmailInput): Promise<void> {
  const variables = buildEmailVariables(input)
  await sendMail({
    to: input.to,
    subject: buildPosConsultaCheckinEmailSubject(input.checkinNumber),
    html: buildPosConsultaCheckinEmailHtml(variables),
    text: buildPosConsultaCheckinEmailText(variables),
  })
}

export function posConsultaCheckinPublicUrl(token: string): string {
  return buildPosConsultaCheckinUrl(token)
}
