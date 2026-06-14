import type { ProfissionalAgendaPlantaoApi } from '../../lib/services/profissional/agenda'
import type {
  ProfissionalShift,
  ProfissionalShiftLifecycle,
  ProfissionalQueuePatient,
} from '../../types/profissionalAgenda'

function mapModality(modality: ProfissionalAgendaPlantaoApi['modality']): ProfissionalShift['modality'] {
  return modality === 'presencial' ? 'presencial_ubt' : 'tele'
}

function resolveLifecycle(
  shift: Pick<ProfissionalShift, 'id' | 'startAt' | 'endAt'>,
  now: Date,
  activeShiftId: string | null,
  endedShiftIds: Set<string>,
): ProfissionalShiftLifecycle {
  if (endedShiftIds.has(shift.id) || activeShiftId === shift.id) {
    if (endedShiftIds.has(shift.id)) return 'encerrado'
    if (activeShiftId === shift.id) return 'em_andamento'
  }

  const start = new Date(shift.startAt)
  const end = new Date(shift.endAt)
  if (now < start) return 'aguardando_inicio'
  if (now > end) return 'encerrado'
  return 'aguardando_inicio'
}

export function mapPlantaoApiToProfissionalShift(
  plantao: ProfissionalAgendaPlantaoApi,
  options?: {
    now?: Date
    activeShiftId?: string | null
    endedShiftIds?: Set<string>
  },
): ProfissionalShift {
  const now = options?.now ?? new Date()
  const activeShiftId = options?.activeShiftId ?? null
  const endedShiftIds = options?.endedShiftIds ?? new Set<string>()

  const base: ProfissionalShift = {
    id: plantao.shiftId,
    plantaoId: plantao.plantaoId,
    escalaShiftId: plantao.escalaSlotId,
    dateKey: plantao.dateKey,
    municipality: plantao.municipality,
    ubtLabel: plantao.ubtLabel,
    specialty: plantao.specialty,
    turnLabel: plantao.turnLabel,
    startAt: plantao.startAt,
    endAt: plantao.endAt,
    startTime: plantao.startTime,
    endTime: plantao.endTime,
    role: plantao.role,
    modality: mapModality(plantao.modality),
    modalityLabel: plantao.modalityLabel,
    lifecycle: 'aguardando_inicio',
    stats: plantao.stats,
  }

  return {
    ...base,
    lifecycle: resolveLifecycle(base, now, activeShiftId, endedShiftIds),
  }
}

export function mapConsultaApiToQueuePatient(
  consulta: ProfissionalQueuePatient,
): ProfissionalQueuePatient {
  return {
    id: consulta.id,
    agendaConsultaId: consulta.agendaConsultaId,
    shiftId: consulta.shiftId,
    patientName: consulta.patientName,
    patientAge: consulta.patientAge,
    patientCpf: consulta.patientCpf,
    specialty: consulta.specialty,
    serviceType: consulta.serviceType,
    triageReason: consulta.triageReason,
    ubtName: consulta.ubtName,
    scheduledTime: consulta.scheduledTime,
    origin: consulta.origin,
    arrivedAt: consulta.arrivedAt,
    status: consulta.status,
    recallCount: consulta.recallCount,
    calledAt: consulta.calledAt,
    attendanceId: consulta.attendanceId,
  }
}

export function mapPlantoesApiToProfissionalShifts(
  plantoes: ProfissionalAgendaPlantaoApi[],
  options?: {
    now?: Date
    activeShiftId?: string | null
    endedShiftIds?: Set<string>
  },
): ProfissionalShift[] {
  return plantoes
    .map((plantao) => mapPlantaoApiToProfissionalShift(plantao, options))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}
