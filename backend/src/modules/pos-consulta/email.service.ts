import {
  buildPosConsultaCheckinEmailHtml,
  buildPosConsultaCheckinEmailSubject,
  buildPosConsultaCheckinEmailText,
  type PosConsultaCheckinEmailVariables,
} from '../../lib/email/posConsultaEmailTemplate.js'
import { resolveUbtUrlForUnidade } from '../../lib/tenant/transactionalUrls.js'
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
  unidadeUbtId?: string
}

async function buildPosConsultaCheckinUrl(token: string, unidadeUbtId?: string): Promise<string> {
  const path = `/acompanhamento/${encodeURIComponent(token)}`
  if (unidadeUbtId) {
    return resolveUbtUrlForUnidade(unidadeUbtId, path)
  }
  const base = resolvePublicAppUrl()
  return `${base.replace(/\/$/, '')}/ubt${path}`
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

function buildEmailVariables(
  input: SendPosConsultaCheckinEmailInput,
  checkinUrl: string,
): PosConsultaCheckinEmailVariables {
  return {
    patientFirstName: input.patientFirstName,
    specialtyName: input.specialtyName,
    planDayNumber: input.planDayNumber,
    planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
    checkinNumber: input.checkinNumber,
    totalCheckins: getPosConsultaTotalCheckins(),
    doctorName: input.doctorName,
    checkinUrl,
    sentAtLabel: formatSentAtLabel(),
  }
}

export { buildPosConsultaCheckinEmailSubject }

export function buildPosConsultaCheckinEmailHtmlFromInput(
  input: SendPosConsultaCheckinEmailInput,
  checkinUrl: string,
): string {
  return buildPosConsultaCheckinEmailHtml(buildEmailVariables(input, checkinUrl))
}

export async function sendPosConsultaCheckinEmail(input: SendPosConsultaCheckinEmailInput): Promise<void> {
  const checkinUrl = await buildPosConsultaCheckinUrl(input.checkinToken, input.unidadeUbtId)
  const variables = buildEmailVariables(input, checkinUrl)
  await sendMail({
    to: input.to,
    subject: buildPosConsultaCheckinEmailSubject(input.checkinNumber),
    html: buildPosConsultaCheckinEmailHtml(variables),
    text: buildPosConsultaCheckinEmailText(variables),
  })
}

export async function posConsultaCheckinPublicUrl(
  token: string,
  unidadeUbtId?: string,
): Promise<string> {
  return buildPosConsultaCheckinUrl(token, unidadeUbtId)
}
