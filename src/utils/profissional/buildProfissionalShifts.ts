import { adminEscalaShiftsInitial } from '../../data/adminEscalaMock'
import type { AdminEscalaShift } from '../../types/adminEscala'
import type {
  ProfissionalShift,
  ProfissionalShiftLifecycle,
  ProfissionalShiftRole,
} from '../../types/profissionalAgenda'
import { toDateKey } from '../agendaDate'
import { PROFISSIONAL_TELEMEDICINE_LABEL } from '../../config/profissionalConfig'
import { formatShiftTimeRange } from './profissionalEscalaDisplay'

function resolveRole(shift: AdminEscalaShift, doctorId: string): ProfissionalShiftRole | null {
  if (shift.primaryDoctorId === doctorId) return 'titular'
  if (shift.backupDoctorIds.includes(doctorId)) return 'reserva'
  return null
}

function resolveLifecycle(
  shift: ProfissionalShift,
  now: Date,
  activeShiftId: string | null,
  endedShiftIds: Set<string>,
): ProfissionalShiftLifecycle {
  if (endedShiftIds.has(shift.id) || activeShiftId === shift.id) {
    const activeEnded = endedShiftIds.has(shift.id)
    if (activeEnded) return 'encerrado'
    if (activeShiftId === shift.id) return 'em_andamento'
  }

  const start = new Date(shift.startAt)
  const end = new Date(shift.endAt)
  if (now < start) return 'aguardando_inicio'
  if (now > end) return 'encerrado'
  return 'aguardando_inicio'
}

function mapEscalaShift(
  shift: AdminEscalaShift,
  role: ProfissionalShiftRole,
  now: Date,
  activeShiftId: string | null,
  endedShiftIds: Set<string>,
): ProfissionalShift {
  const dateKey = toDateKey(new Date(shift.startAt))
  const { startTime, endTime, turnLabel } = formatShiftTimeRange(shift.startAt, shift.endAt)
  const id = `prof-shift-${shift.id}`

  const base: ProfissionalShift = {
    id,
    plantaoId: shift.id,
    escalaShiftId: shift.id,
    dateKey,
    municipality: '',
    ubtLabel: '',
    specialty: shift.specialty,
    turnLabel,
    startAt: shift.startAt,
    endAt: shift.endAt,
    startTime,
    endTime,
    role,
    modality: shift.modality,
    modalityLabel: PROFISSIONAL_TELEMEDICINE_LABEL,
    lifecycle: 'aguardando_inicio',
    stats: {
      previstos: 0,
      naFila: 0,
      atendidos: 0,
      tempoMedioMin: 0,
    },
  }

  return {
    ...base,
    lifecycle: resolveLifecycle(base, now, activeShiftId, endedShiftIds),
  }
}

export function getProfissionalShiftsForDoctor(
  doctorId: string,
  options?: {
    now?: Date
    activeShiftId?: string | null
    endedShiftIds?: Set<string>
    onlyPublished?: boolean
  },
): ProfissionalShift[] {
  const now = options?.now ?? new Date()
  const activeShiftId = options?.activeShiftId ?? null
  const endedShiftIds = options?.endedShiftIds ?? new Set<string>()
  const onlyPublished = options?.onlyPublished ?? true

  const mapped = adminEscalaShiftsInitial
    .filter((shift) => !onlyPublished || shift.status === 'publicada')
    .map((shift) => {
      const role = resolveRole(shift, doctorId)
      if (!role) return null
      return mapEscalaShift(shift, role, now, activeShiftId, endedShiftIds)
    })
    .filter((shift): shift is ProfissionalShift => shift !== null)

  return mapped.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )
}

export function getProfissionalShiftById(
  shiftId: string,
  doctorId: string,
  session: { activeShiftId: string | null; endedShiftIds: Set<string> },
): ProfissionalShift | undefined {
  return getProfissionalShiftsForDoctor(doctorId, {
    activeShiftId: session.activeShiftId,
    endedShiftIds: session.endedShiftIds,
    onlyPublished: false,
  }).find((shift) => shift.id === shiftId)
}
