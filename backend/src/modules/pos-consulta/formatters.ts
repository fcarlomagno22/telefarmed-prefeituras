import {
  POS_CONSULTA_CHECKIN_INTERVAL_DAYS,
  POS_CONSULTA_PLAN_TOTAL_DAYS,
  POS_CONSULTA_TIMEZONE,
  getPosConsultaTotalCheckins,
  posConsultaCheckinDayNumber,
} from './config.js'
import type { PosConsultaCheckinRespostasInput } from './schemas.js'

const APP_LOCALE = 'pt-BR'

export function formatPosConsultaDateLabel(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const date = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: POS_CONSULTA_TIMEZONE,
  }).format(date)
}

export function formatPosConsultaDateTimeLabel(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const date = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: POS_CONSULTA_TIMEZONE,
  }).format(date)
}

export function extractPatientFirstName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Paciente'
  return trimmed.split(/\s+/)[0] ?? 'Paciente'
}

export function resolveRequestedMeasurements(numeroCheckin: number): Array<'blood_pressure' | 'blood_glucose'> {
  const items: Array<'blood_pressure' | 'blood_glucose'> = ['blood_pressure']
  if (numeroCheckin % 2 === 0) {
    items.push('blood_glucose')
  }
  return items
}

export function resolveNextCheckinLabel(
  agendadoPara: string | null,
  numeroCheckin: number,
  totalCheckins: number,
): string | null {
  if (!agendadoPara || numeroCheckin >= totalCheckins) return null
  const date = new Date(`${agendadoPara}T12:00:00`)
  date.setDate(date.getDate() + POS_CONSULTA_CHECKIN_INTERVAL_DAYS)
  return formatPosConsultaDateLabel(date)
}

export function mapCheckinStatusToPublic(
  status: string,
  expiraEm: string | null,
): 'pendente' | 'respondido' | 'expirado' {
  if (status === 'respondido') return 'respondido'
  if (status === 'expirado') return 'expirado'
  if (status === 'enviado' && expiraEm && new Date(expiraEm).getTime() < Date.now()) {
    return 'expirado'
  }
  return 'pendente'
}

export function buildCheckinSummary(
  respostas: PosConsultaCheckinRespostasInput,
  evolucao: string | null,
): string {
  const parts: string[] = []

  if (evolucao === 'melhorou') parts.push('Evolução positiva')
  else if (evolucao === 'igual') parts.push('Estável')
  else if (evolucao === 'piorou') parts.push('Piorou')

  if (respostas.intensidadeSintoma != null) {
    parts.push(`intensidade ${respostas.intensidadeSintoma}/10`)
  }

  if (respostas.medicacaoAdesao === 'sim') parts.push('medicação em dia')
  else if (respostas.medicacaoAdesao === 'parcial') parts.push('adesão parcial à medicação')
  else if (respostas.medicacaoAdesao === 'nao') parts.push('medicação não tomada')

  const alerts = Object.entries(respostas.alertSigns)
    .filter(([, active]) => active)
    .map(([key]) => key.replace(/_/g, ' '))
  if (alerts.length > 0) {
    parts.push(`sinais de alerta: ${alerts.join(', ')}`)
  }

  return parts.join(' · ') || 'Check-in respondido'
}

export function mapConsultaStatusToHistorico(status: string): 'concluido' | 'interrompido' {
  return status === 'interrompida' ? 'interrompido' : 'concluido'
}

export {
  POS_CONSULTA_PLAN_TOTAL_DAYS,
  POS_CONSULTA_CHECKIN_INTERVAL_DAYS,
  getPosConsultaTotalCheckins,
  posConsultaCheckinDayNumber,
}
