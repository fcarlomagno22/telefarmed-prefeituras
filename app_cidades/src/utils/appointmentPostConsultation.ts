import {
  POS_CONSULTA_CHECKIN_INTERVAL_DAYS,
  POS_CONSULTA_PLAN_TOTAL_DAYS,
} from '../config/posConsulta'
import { getMockAppointmentPostConsultationPlan } from '../data/mockAppointmentPostConsultation'
import { fetchMyAppointments } from '../data/mockMyAppointments'
import {
  loadPosConsultaResponses,
  savePosConsultaResponse,
} from '../data/postConsultationStorage'
import type {
  AppointmentPosConsultaCheckinItem,
  AppointmentPosConsultaPlan,
  AppointmentPosConsultaPlanStatus,
  PostConsultationPlanEntry,
} from '../types/appointmentPostConsultation'
import { colors } from '../theme/colors'
import type {
  PosConsultaCheckinContext,
  PosConsultaCheckinRespostas,
  PosConsultaSubmitResult,
} from '../types/posConsulta'
import { StoredAppointment } from '../types/myAppointments'
import { buildCheckinSummary } from '../data/mockAppointmentPostConsultation'
import { getAppointmentDateTime } from './myAppointments'

const MOCK_DELAY_MS = 320

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function formatNextCheckinLabel(daysFromNow: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export async function fetchPatientPostConsultationPlans(
  patientCpf: string,
  patientName: string,
): Promise<PostConsultationPlanEntry[]> {
  await delay(MOCK_DELAY_MS)

  const appointments = await fetchMyAppointments(patientCpf)
  const stored = await loadPosConsultaResponses(patientCpf)
  const completed = appointments.filter((item) => item.status === 'completed')

  const entries = completed
    .map((appointment) => ({
      appointment,
      plan: getMockAppointmentPostConsultationPlan(appointment, patientName, stored),
    }))
    .filter((entry) => entry.plan.status !== 'indisponivel')

  return entries.sort((a, b) => {
    if (a.plan.status === 'ativo' && b.plan.status !== 'ativo') return -1
    if (b.plan.status === 'ativo' && a.plan.status !== 'ativo') return 1
    return (
      getAppointmentDateTime(b.appointment).getTime() -
      getAppointmentDateTime(a.appointment).getTime()
    )
  })
}

export function splitPostConsultationPlans(entries: PostConsultationPlanEntry[]) {
  return {
    active: entries.filter((entry) => entry.plan.status === 'ativo'),
    closed: entries.filter((entry) => entry.plan.status === 'encerrado'),
  }
}

export type PostConsultationHero =
  | {
      kind: 'pending'
      entry: PostConsultationPlanEntry
      checkin: AppointmentPosConsultaCheckinItem
    }
  | {
      kind: 'waiting'
      entry: PostConsultationPlanEntry
    }

export function getPostConsultationHero(
  entries: PostConsultationPlanEntry[],
): PostConsultationHero | null {
  for (const entry of entries) {
    if (entry.plan.status !== 'ativo' || !entry.plan.availableCheckinId) continue

    const checkin = entry.plan.checkins.find(
      (item) => item.id === entry.plan.availableCheckinId,
    )
    if (checkin) {
      return { kind: 'pending', entry, checkin }
    }
  }

  const waiting = entries.find((entry) => entry.plan.status === 'ativo')
  if (waiting) {
    return { kind: 'waiting', entry: waiting }
  }

  return null
}

export async function fetchAppointmentPostConsultationPlan(
  appointment: StoredAppointment,
  patientCpf: string,
  patientName: string,
): Promise<AppointmentPosConsultaPlan> {
  await delay(MOCK_DELAY_MS)
  const stored = await loadPosConsultaResponses(patientCpf)
  return getMockAppointmentPostConsultationPlan(appointment, patientName, stored)
}

export function buildPosConsultaCheckinContext(
  plan: AppointmentPosConsultaPlan,
  checkin: AppointmentPosConsultaCheckinItem,
): PosConsultaCheckinContext {
  const publicStatus =
    checkin.status === 'respondido'
      ? 'respondido'
      : checkin.status === 'expirado'
        ? 'expirado'
        : 'pendente'

  return {
    token: checkin.token ?? `${plan.appointmentProtocol}-${checkin.checkinNumber}`,
    status: publicStatus,
    patientFirstName: plan.patientFirstName,
    specialtyName: plan.specialtyName,
    doctorName: plan.doctorName,
    planDayNumber: checkin.planDayNumber,
    planTotalDays: plan.planTotalDays,
    checkinNumber: checkin.checkinNumber,
    totalCheckins: plan.totalCheckins,
    nextCheckinLabel: checkin.nextCheckinLabel ?? plan.nextCheckinLabel,
    requestedMeasurements: checkin.requestedMeasurements ?? ['blood_pressure'],
    respostas: checkin.respostas,
    respondidoEmLabel: checkin.respondedAtLabel,
  }
}

export async function submitAppointmentPostConsultationCheckin(
  appointment: StoredAppointment,
  patientCpf: string,
  checkin: AppointmentPosConsultaCheckinItem,
  respostas: PosConsultaCheckinRespostas,
): Promise<PosConsultaSubmitResult> {
  await delay(MOCK_DELAY_MS)

  if (checkin.status === 'expirado') {
    throw new Error('Este check-in expirou. Aguarde o próximo contato da equipe.')
  }

  if (checkin.status === 'respondido') {
    throw new Error('Este check-in já foi respondido.')
  }

  if (checkin.status !== 'pendente') {
    throw new Error('Este check-in ainda não está disponível para resposta.')
  }

  await savePosConsultaResponse({
    checkinId: checkin.id,
    appointmentProtocol: appointment.protocol,
    patientCpf,
    respostas,
    respondedAtIso: new Date().toISOString(),
  })

  return {
    nextCheckinLabel: formatNextCheckinLabel(POS_CONSULTA_CHECKIN_INTERVAL_DAYS),
  }
}

export function getPlanStatusLabel(status: AppointmentPosConsultaPlan['status']) {
  if (status === 'ativo') return 'Ativo'
  if (status === 'encerrado') return 'Encerrado'
  return 'Sem acompanhamento'
}

export function getPlanStatusColors(
  status: AppointmentPosConsultaPlanStatus,
  featured = false,
) {
  const white = colors.cardBg

  if (status === 'ativo') {
    return {
      text: '#0369a1',
      background: 'rgba(14, 165, 233, 0.12)',
      border: 'rgba(14, 165, 233, 0.24)',
      cardGradient: featured
        ? ([white, white, 'rgba(14, 165, 233, 0.08)'] as const)
        : ([white, white, 'rgba(14, 165, 233, 0.06)'] as const),
      cardBorder: 'rgba(14, 165, 233, 0.16)',
    }
  }

  if (status === 'encerrado') {
    return {
      text: '#52525b',
      background: 'rgba(0, 0, 0, 0.05)',
      border: 'rgba(0, 0, 0, 0.1)',
      cardGradient: [white, white, 'rgba(0, 0, 0, 0.03)'] as const,
      cardBorder: colors.surfaceBorder,
    }
  }

  return {
    text: '#b45309',
    background: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.24)',
    cardGradient: [white, white, 'rgba(245, 158, 11, 0.06)'] as const,
    cardBorder: 'rgba(245, 158, 11, 0.16)',
  }
}

export function getEvolucaoBadge(evolucao: PosConsultaCheckinRespostas['evolucaoComparacao']) {
  if (evolucao === 'melhorou') {
    return { label: 'Melhorou', text: '#047857', background: 'rgba(16, 185, 129, 0.12)' }
  }
  if (evolucao === 'piorou') {
    return { label: 'Piorou', text: '#b91c1c', background: 'rgba(244, 63, 94, 0.1)' }
  }
  if (evolucao === 'igual') {
    return { label: 'Estável', text: '#0369a1', background: 'rgba(14, 165, 233, 0.12)' }
  }
  return null
}

export { POS_CONSULTA_PLAN_TOTAL_DAYS, buildCheckinSummary }
