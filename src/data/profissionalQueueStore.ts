import { PROFISSIONAL_SESSION_UNIT_LABEL } from '../config/profissionalConfig'
import type {
  ProfissionalEndShiftSummary,
  ProfissionalQueuePatient,
  ProfissionalQueuePatientStatus,
  ProfissionalShift,
} from '../types/profissionalAgenda'
import { sortProfissionalQueue } from '../utils/profissional/sortProfissionalQueue'

const QUEUE_STORAGE_KEY = 'telefarmed:profissional-queue-v1'
const ACTIVE_SHIFT_KEY = 'telefarmed:profissional-active-shift-v1'
const ACTIVE_ATTENDANCE_KEY = 'telefarmed:profissional-active-attendance-v1'
export const PROFISSIONAL_ATTENDANCE_ORIGIN_KEY = 'telefarmed:attendance-origin'
export const PROFISSIONAL_ATTENDANCE_ORIGIN_VALUE = 'profissional'
export const PROFISSIONAL_QUEUE_UPDATED_EVENT = 'telefarmed:profissional-queue-updated'

const MAX_RECALLS = 2

export type ProfissionalActiveShiftSession = {
  shiftId: string
  plantaoId?: string
  enteredAt: string
  endedAt?: string
  summary?: ProfissionalEndShiftSummary
}

function loadAllQueues(): Record<string, ProfissionalQueuePatient[]> {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, ProfissionalQueuePatient[]>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveAllQueues(queues: Record<string, ProfissionalQueuePatient[]>) {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queues))
  window.dispatchEvent(new CustomEvent(PROFISSIONAL_QUEUE_UPDATED_EVENT))
}

/** Apenas um paciente pode estar "Na sala de espera" (`chamado`) por plantão. */
function enforceSinglePatientInRoom(
  patients: ProfissionalQueuePatient[],
): ProfissionalQueuePatient[] {
  const inRoom = patients.filter((patient) => patient.status === 'chamado')
  if (inRoom.length <= 1) return patients

  const keeper = inRoom.reduce((latest, patient) => {
    const latestAt = latest.calledAt ? new Date(latest.calledAt).getTime() : 0
    const patientAt = patient.calledAt ? new Date(patient.calledAt).getTime() : 0
    return patientAt >= latestAt ? patient : latest
  })

  return patients.map((patient) => {
    if (patient.status !== 'chamado' || patient.id === keeper.id) return patient
    const { calledAt: _calledAt, ...rest } = patient
    return { ...rest, status: 'aguardando' }
  })
}

function arrivedMinutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString()
}

function offsetTime(now: Date, minutes: number): string {
  const slot = new Date(now)
  slot.setMinutes(slot.getMinutes() + minutes)
  return `${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`
}

function buildSeedQueue(shift: ProfissionalShift, now = new Date()): ProfissionalQueuePatient[] {
  return [
    {
      id: `${shift.id}-q1`,
      shiftId: shift.id,
      patientName: 'Patricia Souza Lima',
      patientAge: 34,
      patientCpf: '901.234.567-89',
      specialty: shift.specialty,
      serviceType: shift.specialty,
      triageReason: 'Consulta de retorno — queixa de dor pélvica.',
      ubtName: PROFISSIONAL_SESSION_UNIT_LABEL,
      scheduledTime: offsetTime(now, -10),
      origin: 'agendado',
      arrivedAt: arrivedMinutesAgo(now, 18),
      status: 'chamado',
      recallCount: 0,
      calledAt: arrivedMinutesAgo(now, 4),
    },
    {
      id: `${shift.id}-q2`,
      shiftId: shift.id,
      patientName: 'Ricardo Almeida Nunes',
      patientAge: 52,
      patientCpf: '345.678.901-23',
      specialty: shift.specialty,
      serviceType: 'Clínico geral',
      triageReason: 'Encaixe — hipertensão, revisão de medicação.',
      ubtName: PROFISSIONAL_SESSION_UNIT_LABEL,
      scheduledTime: offsetTime(now, 5),
      origin: 'agendado',
      arrivedAt: arrivedMinutesAgo(now, 8),
      status: 'aguardando',
      recallCount: 0,
    },
    {
      id: `${shift.id}-q3`,
      shiftId: shift.id,
      patientName: 'Helena Borges Costa',
      patientAge: 8,
      patientCpf: '567.890.123-45',
      specialty: shift.specialty,
      serviceType: 'Pediatria',
      triageReason: 'Febre há 24 h — encaminhamento da UBT.',
      ubtName: PROFISSIONAL_SESSION_UNIT_LABEL,
      origin: 'espontaneo',
      arrivedAt: arrivedMinutesAgo(now, 35),
      status: 'aguardando',
      recallCount: 0,
    },
    {
      id: `${shift.id}-q4`,
      shiftId: shift.id,
      patientName: 'Marcos Antônio Silva',
      patientAge: 41,
      patientCpf: '234.567.890-12',
      specialty: shift.specialty,
      serviceType: shift.specialty,
      triageReason: 'Agendado — exame de rotina e sintomas respiratórios.',
      ubtName: PROFISSIONAL_SESSION_UNIT_LABEL,
      scheduledTime: offsetTime(now, 25),
      origin: 'agendado',
      arrivedAt: arrivedMinutesAgo(now, 5),
      status: 'aguardando',
      recallCount: 0,
    },
    {
      id: `${shift.id}-q5`,
      shiftId: shift.id,
      patientName: 'Fernanda Lima Rocha',
      patientAge: 29,
      patientCpf: '678.901.234-56',
      specialty: shift.specialty,
      serviceType: shift.specialty,
      triageReason: 'Atendimento concluído no turno anterior (demo).',
      ubtName: PROFISSIONAL_SESSION_UNIT_LABEL,
      scheduledTime: offsetTime(now, -45),
      origin: 'agendado',
      arrivedAt: arrivedMinutesAgo(now, 55),
      status: 'finalizado',
      recallCount: 0,
    },
  ]
}

const DEMO_QUEUE_ID_PATTERN = /-q\d+$/

/** Pacientes fictícios do tour/demo — nunca devem aparecer com API ativa. */
export function isDemoQueuePatient(patient: ProfissionalQueuePatient): boolean {
  return DEMO_QUEUE_ID_PATTERN.test(patient.id)
}

export function stripDemoQueuePatients(
  patients: ProfissionalQueuePatient[],
): ProfissionalQueuePatient[] {
  return patients.filter((patient) => !isDemoQueuePatient(patient))
}

export function purgeDemoQueuePatients(shiftId: string) {
  const queues = loadAllQueues()
  const current = queues[shiftId]
  if (!current?.some(isDemoQueuePatient)) return
  queues[shiftId] = stripDemoQueuePatients(current)
  saveAllQueues(queues)
}

/** Apenas tour guiado — dados fictícios locais. */
export function ensureProfissionalQueueSeeded(shift: ProfissionalShift) {
  const queues = loadAllQueues()
  if (queues[shift.id]?.length) return
  queues[shift.id] = buildSeedQueue(shift)
  saveAllQueues(queues)
}

const LOCAL_PRIORITY_STATUSES: ProfissionalQueuePatientStatus[] = [
  'chamado',
  'em_atendimento',
  'finalizado',
  'nao_compareceu',
  'desistiu',
]

export function syncProfissionalQueueFromApi(
  shiftId: string,
  apiPatients: ProfissionalQueuePatient[],
) {
  const queues = loadAllQueues()
  const existing = stripDemoQueuePatients(queues[shiftId] ?? [])

  const byId = new Map(existing.map((patient) => [patient.id, patient]))
  const merged = apiPatients.map((apiPatient) => {
    const local =
      byId.get(apiPatient.id) ??
      (apiPatient.agendaConsultaId ? byId.get(apiPatient.agendaConsultaId) : undefined)
    if (!local) return apiPatient
    const keepLocalStatus = LOCAL_PRIORITY_STATUSES.includes(local.status)
    return {
      ...local,
      ...apiPatient,
      id: apiPatient.id,
      status: keepLocalStatus ? local.status : apiPatient.status,
      recallCount: local.recallCount,
      calledAt: local.calledAt,
      attendanceId: local.attendanceId ?? apiPatient.attendanceId,
    }
  })

  queues[shiftId] = enforceSinglePatientInRoom(merged)
  saveAllQueues(queues)
}

export function persistProfissionalQueue(
  shiftId: string,
  patients: ProfissionalQueuePatient[],
) {
  const queues = loadAllQueues()
  queues[shiftId] = enforceSinglePatientInRoom(patients)
  saveAllQueues(queues)
}

export function syncAllProfissionalQueuesFromApi(
  consultas: ProfissionalQueuePatient[],
  shiftIds?: string[],
) {
  const byShift = new Map<string, ProfissionalQueuePatient[]>()
  for (const consulta of consultas) {
    const list = byShift.get(consulta.shiftId) ?? []
    list.push(consulta)
    byShift.set(consulta.shiftId, list)
  }

  const targets = shiftIds ?? [...byShift.keys()]
  for (const shiftId of targets) {
    purgeDemoQueuePatients(shiftId)
    syncProfissionalQueueFromApi(shiftId, byShift.get(shiftId) ?? [])
  }
}

export function getProfissionalQueue(
  shiftId: string,
  options?: { includeDemo?: boolean },
): ProfissionalQueuePatient[] {
  const queues = loadAllQueues()
  const raw = queues[shiftId] ?? []
  const patients = options?.includeDemo ? raw : stripDemoQueuePatients(raw)
  return sortProfissionalQueue(enforceSinglePatientInRoom(patients))
}

export function updateProfissionalQueuePatient(
  shiftId: string,
  patientId: string,
  patch: Partial<ProfissionalQueuePatient>,
) {
  const queues = loadAllQueues()
  const list = queues[shiftId] ?? []
  queues[shiftId] = enforceSinglePatientInRoom(
    list.map((patient) => {
      if (patient.id === patientId) {
        return { ...patient, ...patch }
      }
      if (patch.status === 'chamado' && patient.status === 'chamado') {
        const { calledAt: _calledAt, ...rest } = patient
        return { ...rest, status: 'aguardando' }
      }
      return patient
    }),
  )
  saveAllQueues(queues)
}

export function computeShiftStatsFromQueue(
  patients: ProfissionalQueuePatient[],
): ProfissionalShift['stats'] {
  const previstos = patients.length
  const naFila = patients.filter(
    (patient) => patient.status === 'aguardando' || patient.status === 'chamado',
  ).length
  const atendidos = patients.filter(
    (patient) => patient.status === 'finalizado',
  ).length
  const finished = patients.filter((patient) => patient.status === 'finalizado')
  const tempoMedioMin = 0

  return { previstos, naFila, atendidos, tempoMedioMin }
}

export function readActiveShiftSession(): ProfissionalActiveShiftSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SHIFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ProfissionalActiveShiftSession
  } catch {
    return null
  }
}

export function writeActiveShiftSession(session: ProfissionalActiveShiftSession | null) {
  if (!session) {
    localStorage.removeItem(ACTIVE_SHIFT_KEY)
  } else {
    localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(session))
  }
  window.dispatchEvent(new CustomEvent(PROFISSIONAL_QUEUE_UPDATED_EVENT))
}

export function enterProfissionalShift(shiftId: string, plantaoId?: string) {
  writeActiveShiftSession({
    shiftId,
    plantaoId,
    enteredAt: new Date().toISOString(),
  })
}

export function endProfissionalShift(summary: ProfissionalEndShiftSummary) {
  const current = readActiveShiftSession()
  if (!current) return
  writeActiveShiftSession({
    ...current,
    endedAt: new Date().toISOString(),
    summary,
  })
  clearActiveAttendanceId()
}

export function readActiveAttendanceId(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_ATTENDANCE_KEY)
  } catch {
    return null
  }
}

export function writeActiveAttendanceId(attendanceId: string | null) {
  try {
    if (attendanceId) {
      sessionStorage.setItem(ACTIVE_ATTENDANCE_KEY, attendanceId)
    } else {
      sessionStorage.removeItem(ACTIVE_ATTENDANCE_KEY)
    }
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(PROFISSIONAL_QUEUE_UPDATED_EVENT))
}

export function clearActiveAttendanceId() {
  writeActiveAttendanceId(null)
}

export function markProfissionalAttendanceOrigin() {
  try {
    sessionStorage.setItem(
      PROFISSIONAL_ATTENDANCE_ORIGIN_KEY,
      PROFISSIONAL_ATTENDANCE_ORIGIN_VALUE,
    )
  } catch {
    // ignore
  }
}

export function clearProfissionalAttendanceOrigin() {
  try {
    sessionStorage.removeItem(PROFISSIONAL_ATTENDANCE_ORIGIN_KEY)
  } catch {
    // ignore
  }
}

export function isProfissionalAttendanceOrigin(): boolean {
  try {
    return (
      sessionStorage.getItem(PROFISSIONAL_ATTENDANCE_ORIGIN_KEY) ===
      PROFISSIONAL_ATTENDANCE_ORIGIN_VALUE
    )
  } catch {
    return false
  }
}

function findQueuePatientByAttendanceId(attendanceId: string): {
  shiftId: string
  patientId: string
} | null {
  const queues = loadAllQueues()
  for (const [shiftId, list] of Object.entries(queues)) {
    const patient = list.find((item) => item.attendanceId === attendanceId)
    if (patient) return { shiftId, patientId: patient.id }
  }
  return null
}

/** Marca o paciente como atendido (`finalizado` na fila, exibido como "Atendido"). */
export function completeProfissionalQueueAttendance(attendanceId: string): boolean {
  const located = findQueuePatientByAttendanceId(attendanceId)
  if (!located) return false

  updateProfissionalQueuePatient(located.shiftId, located.patientId, {
    status: 'finalizado',
    attendanceId: undefined,
  })
  clearActiveAttendanceId()
  clearProfissionalAttendanceOrigin()
  return true
}

export function getEndedShiftIds(): Set<string> {
  const session = readActiveShiftSession()
  if (session?.endedAt) return new Set([session.shiftId])
  return new Set()
}

export function canRecallPatient(patient: ProfissionalQueuePatient): boolean {
  return patient.recallCount < MAX_RECALLS
}

export function patchPatientStatus(
  shiftId: string,
  patientId: string,
  status: ProfissionalQueuePatientStatus,
  extra?: Partial<ProfissionalQueuePatient>,
) {
  const patch: Partial<ProfissionalQueuePatient> = { status, ...extra }
  if (status === 'chamado' && !patch.calledAt) {
    patch.calledAt = new Date().toISOString()
  }
  updateProfissionalQueuePatient(shiftId, patientId, patch)
}
