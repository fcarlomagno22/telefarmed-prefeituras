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
  PostConsultationPlanEntry,
} from '../types/appointmentPostConsultation'
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

export function getPlanStatusColors(status: AppointmentPosConsultaPlan['status']) {
  if (status === 'ativo') {
    return {
      text: '#7dd3fc',
      background: 'rgba(14, 165, 233, 0.14)',
      border: 'rgba(14, 165, 233, 0.35)',
    }
  }
  if (status === 'encerrado') {
    return {
      text: colorsMuted(),
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
    }
  }
  return {
    text: '#fcd34d',
    background: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
  }
}

function colorsMuted() {
  return '#94a3b8'
}

export function getEvolucaoBadge(evolucao: PosConsultaCheckinRespostas['evolucaoComparacao']) {
  if (evolucao === 'melhorou') {
    return { label: 'Melhorou', text: '#6ee7b7', background: 'rgba(16, 185, 129, 0.14)' }
  }
  if (evolucao === 'piorou') {
    return { label: 'Piorou', text: '#fda4af', background: 'rgba(244, 63, 94, 0.14)' }
  }
  if (evolucao === 'igual') {
    return { label: 'Estável', text: '#7dd3fc', background: 'rgba(14, 165, 233, 0.14)' }
  }
  return null
}

export { POS_CONSULTA_PLAN_TOTAL_DAYS, buildCheckinSummary }
