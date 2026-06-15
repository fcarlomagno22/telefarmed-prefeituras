import {
  POS_CONSULTA_CHECKIN_INTERVAL_DAYS,
  POS_CONSULTA_PLAN_TOTAL_DAYS,
  getPosConsultaTotalCheckins,
} from '../config/posConsulta'
import type { StoredPosConsultaResponse } from './postConsultationStorage'
import type {
  AppointmentPosConsultaCheckinItem,
  AppointmentPosConsultaPlan,
} from '../types/appointmentPostConsultation'
import type { PosConsultaCheckinRespostas } from '../types/posConsulta'
import { StoredAppointment } from '../types/myAppointments'
import { getAppointmentDateTime } from '../utils/myAppointments'

const TOTAL_CHECKINS = getPosConsultaTotalCheckins()

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateTimeLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function extractFirstName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) return 'Paciente'
  return trimmed.split(/\s+/)[0] ?? 'Paciente'
}

function resolveRequestedMeasurements(checkinNumber: number) {
  const items: Array<'blood_pressure' | 'blood_glucose'> = ['blood_pressure']
  if (checkinNumber % 2 === 0) {
    items.push('blood_glucose')
  }
  return items
}

export function buildCheckinSummary(respostas: PosConsultaCheckinRespostas): string {
  const parts: string[] = []

  if (respostas.evolucaoComparacao === 'melhorou') parts.push('Evolução positiva')
  else if (respostas.evolucaoComparacao === 'igual') parts.push('Estável')
  else if (respostas.evolucaoComparacao === 'piorou') parts.push('Piorou')

  if (respostas.intensidadeSintoma !== null) {
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

type SeedCheckin = Omit<
  AppointmentPosConsultaCheckinItem,
  'requestedMeasurements' | 'token' | 'scheduledDateLabel'
> & {
  scheduledDateLabel?: string | null
}

function buildCheckinToken(protocol: string, checkinNumber: number) {
  return `pc-${protocol}-${checkinNumber}`
}

function buildSeedCheckins(
  protocol: string,
  consultationDate: Date,
  seeds: SeedCheckin[],
): AppointmentPosConsultaCheckinItem[] {
  return seeds.map((seed) => ({
    ...seed,
    token: buildCheckinToken(protocol, seed.checkinNumber),
    requestedMeasurements: resolveRequestedMeasurements(seed.checkinNumber),
    scheduledDateLabel:
      seed.scheduledDateLabel ??
      formatDateLabel(addDays(consultationDate, seed.planDayNumber - 1)),
  }))
}

function getActivePlanSeed(
  appointment: StoredAppointment,
  patientName: string,
): AppointmentPosConsultaPlan {
  const consultationDate = getAppointmentDateTime(appointment)
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const daysSinceConsultation = Math.max(
    1,
    Math.floor((today.getTime() - consultationDate.getTime()) / (24 * 60 * 60 * 1000)) + 1,
  )
  const planDayNumber = Math.min(daysSinceConsultation, POS_CONSULTA_PLAN_TOTAL_DAYS)

  const checkins = buildSeedCheckins(appointment.protocol, consultationDate, [
    {
      id: `${appointment.protocol}-chk-1`,
      checkinNumber: 1,
      planDayNumber: 2,
      status: 'respondido',
      respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 2)),
      evolucaoComparacao: 'melhorou',
      intensidadeSintoma: 5,
      medicacaoAdesao: 'sim',
      summary: 'Tosse reduziu · medicação em dia · intensidade 5/10',
      respostas: {
        evolucaoComparacao: 'melhorou',
        intensidadeSintoma: 5,
        medicacaoAdesao: 'sim',
        medicacaoAdesaoMotivo: '',
        bloodPressureSystolic: { value: 122, notMeasured: false },
        bloodPressureDiastolic: { value: 78, notMeasured: false },
        bloodGlucose: { value: null, notMeasured: true },
        alertSigns: {
          dispneia: false,
          dor_toracica: false,
          febre_persistente: false,
          sangramento: false,
          confusao_mental: false,
        },
      },
    },
    {
      id: `${appointment.protocol}-chk-2`,
      checkinNumber: 2,
      planDayNumber: 4,
      status: 'respondido',
      respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 4)),
      evolucaoComparacao: 'melhorou',
      intensidadeSintoma: 3,
      medicacaoAdesao: 'sim',
      summary: 'Quase assintomática · medicação em dia · intensidade 3/10',
      respostas: {
        evolucaoComparacao: 'melhorou',
        intensidadeSintoma: 3,
        medicacaoAdesao: 'sim',
        medicacaoAdesaoMotivo: '',
        bloodPressureSystolic: { value: 118, notMeasured: false },
        bloodPressureDiastolic: { value: 76, notMeasured: false },
        bloodGlucose: { value: 98, notMeasured: false },
        alertSigns: {
          dispneia: false,
          dor_toracica: false,
          febre_persistente: false,
          sangramento: false,
          confusao_mental: false,
        },
      },
    },
    {
      id: `${appointment.protocol}-chk-3`,
      checkinNumber: 3,
      planDayNumber: 6,
      status: 'pendente',
      summary: undefined,
    },
    {
      id: `${appointment.protocol}-chk-4`,
      checkinNumber: 4,
      planDayNumber: 8,
      status: 'agendado',
    },
    {
      id: `${appointment.protocol}-chk-5`,
      checkinNumber: 5,
      planDayNumber: 10,
      status: 'agendado',
    },
    {
      id: `${appointment.protocol}-chk-6`,
      checkinNumber: 6,
      planDayNumber: 12,
      status: 'agendado',
    },
    {
      id: `${appointment.protocol}-chk-7`,
      checkinNumber: 7,
      planDayNumber: 14,
      status: 'agendado',
    },
  ])

  const respondedCount = checkins.filter((item) => item.status === 'respondido').length
  const available = checkins.find((item) => item.status === 'pendente')

  return {
    appointmentId: appointment.id,
    appointmentProtocol: appointment.protocol,
    status: 'ativo',
    planDayNumber,
    planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
    totalCheckins: TOTAL_CHECKINS,
    respondedCount,
    nextCheckinLabel: available
      ? formatDateLabel(addDays(consultationDate, (available.planDayNumber ?? 6) - 1))
      : null,
    patientFirstName: extractFirstName(patientName),
    specialtyName: appointment.specialtyName,
    doctorName: appointment.selectedDoctorName,
    checkins,
    availableCheckinId: available?.id ?? null,
  }
}

function getClosedPlanSeed(
  appointment: StoredAppointment,
  patientName: string,
  variant: 'full' | 'partial',
): AppointmentPosConsultaPlan {
  const consultationDate = getAppointmentDateTime(appointment)

  const respondedSeeds: SeedCheckin[] =
    variant === 'full'
      ? [
          {
            id: `${appointment.protocol}-chk-1`,
            checkinNumber: 1,
            planDayNumber: 2,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 2)),
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 4,
            medicacaoAdesao: 'sim',
            summary: 'Pressão controlada · medicação em dia',
          },
          {
            id: `${appointment.protocol}-chk-2`,
            checkinNumber: 2,
            planDayNumber: 4,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 4)),
            evolucaoComparacao: 'igual',
            intensidadeSintoma: 3,
            medicacaoAdesao: 'parcial',
            summary: 'Estável · esqueceu dose em 1 dia',
          },
          {
            id: `${appointment.protocol}-chk-3`,
            checkinNumber: 3,
            planDayNumber: 6,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 6)),
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 2,
            medicacaoAdesao: 'sim',
            summary: 'Melhorou · medicação em dia',
          },
          {
            id: `${appointment.protocol}-chk-4`,
            checkinNumber: 4,
            planDayNumber: 8,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 8)),
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 1,
            medicacaoAdesao: 'sim',
            summary: 'Quase assintomático',
          },
          {
            id: `${appointment.protocol}-chk-5`,
            checkinNumber: 5,
            planDayNumber: 10,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 10)),
            evolucaoComparacao: 'igual',
            intensidadeSintoma: 1,
            medicacaoAdesao: 'sim',
            summary: 'Estável · sem queixas',
          },
          {
            id: `${appointment.protocol}-chk-6`,
            checkinNumber: 6,
            planDayNumber: 12,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 12)),
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 0,
            medicacaoAdesao: 'sim',
            summary: 'Assintomático',
          },
          {
            id: `${appointment.protocol}-chk-7`,
            checkinNumber: 7,
            planDayNumber: 14,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 14)),
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 0,
            medicacaoAdesao: 'sim',
            summary: 'Acompanhamento concluído sem intercorrências',
          },
        ]
      : [
          {
            id: `${appointment.protocol}-chk-1`,
            checkinNumber: 1,
            planDayNumber: 2,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 2)),
            evolucaoComparacao: 'igual',
            intensidadeSintoma: 4,
            medicacaoAdesao: 'sim',
            summary: 'Estável · medicação em dia',
          },
          {
            id: `${appointment.protocol}-chk-2`,
            checkinNumber: 2,
            planDayNumber: 4,
            status: 'respondido',
            respondedAtLabel: formatDateTimeLabel(addDays(consultationDate, 4)),
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 2,
            medicacaoAdesao: 'sim',
            summary: 'Melhorou · sem dor abdominal',
          },
          {
            id: `${appointment.protocol}-chk-3`,
            checkinNumber: 3,
            planDayNumber: 6,
            status: 'expirado',
            scheduledDateLabel: formatDateLabel(addDays(consultationDate, 5)),
          },
          {
            id: `${appointment.protocol}-chk-4`,
            checkinNumber: 4,
            planDayNumber: 8,
            status: 'expirado',
            scheduledDateLabel: formatDateLabel(addDays(consultationDate, 7)),
          },
          {
            id: `${appointment.protocol}-chk-5`,
            checkinNumber: 5,
            planDayNumber: 10,
            status: 'agendado',
            scheduledDateLabel: formatDateLabel(addDays(consultationDate, 9)),
          },
          {
            id: `${appointment.protocol}-chk-6`,
            checkinNumber: 6,
            planDayNumber: 12,
            status: 'agendado',
            scheduledDateLabel: formatDateLabel(addDays(consultationDate, 11)),
          },
          {
            id: `${appointment.protocol}-chk-7`,
            checkinNumber: 7,
            planDayNumber: 14,
            status: 'agendado',
            scheduledDateLabel: formatDateLabel(addDays(consultationDate, 13)),
          },
        ]

  const checkins = buildSeedCheckins(appointment.protocol, consultationDate, respondedSeeds)
  const respondedCount = checkins.filter((item) => item.status === 'respondido').length

  return {
    appointmentId: appointment.id,
    appointmentProtocol: appointment.protocol,
    status: 'encerrado',
    planDayNumber: POS_CONSULTA_PLAN_TOTAL_DAYS,
    planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
    totalCheckins: TOTAL_CHECKINS,
    respondedCount,
    nextCheckinLabel: null,
    patientFirstName: extractFirstName(patientName),
    specialtyName: appointment.specialtyName,
    doctorName: appointment.selectedDoctorName,
    checkins,
    availableCheckinId: null,
  }
}

const PLANS_BY_PROTOCOL: Record<
  string,
  (appointment: StoredAppointment, patientName: string) => AppointmentPosConsultaPlan
> = {
  'TF-2026-33812': getActivePlanSeed,
  'TF-2026-29177': (appointment, patientName) =>
    getClosedPlanSeed(appointment, patientName, 'full'),
  'TF-2026-18403': (appointment, patientName) =>
    getClosedPlanSeed(appointment, patientName, 'partial'),
}

function mergeStoredResponses(
  plan: AppointmentPosConsultaPlan,
  stored: StoredPosConsultaResponse[],
): AppointmentPosConsultaPlan {
  const storedByCheckin = new Map(stored.map((item) => [item.checkinId, item]))

  const checkins = plan.checkins.map((checkin) => {
    const saved = storedByCheckin.get(checkin.id)
    if (!saved) return checkin

    const respondedAt = new Date(saved.respondedAtIso)
    return {
      ...checkin,
      status: 'respondido' as const,
      respondedAtLabel: formatDateTimeLabel(respondedAt),
      evolucaoComparacao: saved.respostas.evolucaoComparacao ?? undefined,
      intensidadeSintoma: saved.respostas.intensidadeSintoma,
      medicacaoAdesao: saved.respostas.medicacaoAdesao,
      summary: buildCheckinSummary(saved.respostas),
      respostas: saved.respostas,
      nextCheckinLabel: formatDateLabel(
        addDays(respondedAt, POS_CONSULTA_CHECKIN_INTERVAL_DAYS),
      ),
    }
  })

  const respondedCount = checkins.filter((item) => item.status === 'respondido').length
  const available = checkins.find((item) => item.status === 'pendente')

  let nextPending = checkins.find((item) => item.status === 'agendado')
  if (available) {
    nextPending = available
  }

  return {
    ...plan,
    checkins,
    respondedCount,
    availableCheckinId: available?.id ?? null,
    nextCheckinLabel: nextPending?.scheduledDateLabel ?? null,
    status:
      plan.status === 'ativo' && !available && respondedCount >= plan.totalCheckins
        ? 'encerrado'
        : plan.status,
  }
}

export function getMockAppointmentPostConsultationPlan(
  appointment: StoredAppointment,
  patientName: string,
  storedResponses: StoredPosConsultaResponse[] = [],
): AppointmentPosConsultaPlan {
  const builder = PLANS_BY_PROTOCOL[appointment.protocol]
  if (!builder) {
    return {
      appointmentId: appointment.id,
      appointmentProtocol: appointment.protocol,
      status: 'indisponivel',
      planDayNumber: 0,
      planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
      totalCheckins: TOTAL_CHECKINS,
      respondedCount: 0,
      nextCheckinLabel: null,
      patientFirstName: extractFirstName(patientName),
      specialtyName: appointment.specialtyName,
      doctorName: appointment.selectedDoctorName,
      checkins: [],
      availableCheckinId: null,
    }
  }

  const base = builder(appointment, patientName)
  const protocolStored = storedResponses.filter(
    (item) => item.appointmentProtocol === appointment.protocol,
  )
  return mergeStoredResponses(base, protocolStored)
}
