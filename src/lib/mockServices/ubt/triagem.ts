import { nextConsultations } from '../../../data/dashboardMock'
import { getTriagemEspecialidadesForDate } from '../../../data/triagemEspecialidadesMock'
import { waitingQueueInitialEntries } from '../../../data/waitingQueueMock'
import type { WaitingQueueEntry } from '../../../types/waitingQueue'
import { parseDateKey, toDateKey } from '../../../utils/agendaDate'
import { mockDelay } from '../delay'

export class UbtTriagemApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtTriagemApiError'
    this.status = status
    this.code = code
  }
}

export type FilaLiveApiResponse = {
  fila: {
    entries: WaitingQueueEntry[]
    priorityCount: number
    serverTime: string
  }
}

const queueState: WaitingQueueEntry[] = structuredClone(waitingQueueInitialEntries)
let nextQueueCounter = 1000

function clone<T>(value: T): T {
  return structuredClone(value)
}

function nowIso() {
  return new Date().toISOString()
}

function computePriorityCount(entries: WaitingQueueEntry[]) {
  return entries.filter((entry) => entry.status === 'chamado').length
}

function findEntryById(filaId: string): WaitingQueueEntry {
  const entry = queueState.find((item) => item.id === filaId)
  if (!entry) {
    throw new UbtTriagemApiError('Entrada de fila nao encontrada.', 404, 'FILA_NOT_FOUND')
  }
  return entry
}

function firstWaitingEntry(): WaitingQueueEntry | null {
  return queueState.find((item) => item.status === 'aguardando') ?? null
}

export function isUbtTriagemApiError(error: unknown): error is UbtTriagemApiError {
  return error instanceof UbtTriagemApiError
}

export type UbtTriagemEspecialidadeCatalog = {
  contratoId: string | null
  date: string
  specialties: Array<{
    id: string
    name: string
    availableSlots: number
    available: boolean
  }>
}

export async function fetchUbtTriagemEspecialidadeCatalog(_accessToken: string, date?: string) {
  void _accessToken
  const parsedDate = date ? parseDateKey(date) : new Date()
  const specialties = getTriagemEspecialidadesForDate(parsedDate)
  const catalog: UbtTriagemEspecialidadeCatalog = {
    contratoId: 'mock-contrato-ubt',
    date: date ?? toDateKey(parsedDate),
    specialties,
  }
  return mockDelay(catalog)
}

export async function fetchUbtFilaLive(_accessToken: string) {
  void _accessToken
  return mockDelay({
    entries: clone(queueState),
    priorityCount: computePriorityCount(queueState),
    serverTime: nowIso(),
  })
}

export async function checkInUbtFila(_accessToken: string, agendaConsultaId: string) {
  const existing = queueState.find((entry) => entry.appointmentId === agendaConsultaId)
  if (existing) return mockDelay(clone(existing))

  const consultation = nextConsultations.find((item) => `agenda-mock-${item.id}` === agendaConsultaId)
  const entry: WaitingQueueEntry = {
    id: `fila-checkin-${nextQueueCounter++}`,
    pacienteId: consultation ? `pac-mock-${consultation.id}` : undefined,
    appointmentId: agendaConsultaId,
    patientName: consultation?.patient ?? 'Paciente sem nome',
    patientCpf: '999.999.999-99',
    patientPhone: '(11) 99999-9999',
    serviceType: consultation?.specialty ?? 'Clinica Geral',
    specialtyId: consultation?.specialty.toLowerCase().replace(/\s+/g, '-') ?? 'clinica-geral',
    scheduledTime: consultation?.time,
    origin: 'agendado',
    arrivedAt: nowIso(),
    status: 'aguardando',
  }
  queueState.push(entry)
  return mockDelay(clone(entry))
}

export async function chamarUbtFilaPaciente(_accessToken: string, filaId: string) {
  void _accessToken
  for (const item of queueState) {
    if (item.id !== filaId && item.status === 'chamado') {
      item.status = 'aguardando'
    }
  }
  const entry = findEntryById(filaId)
  entry.status = 'chamado'
  return mockDelay(clone(entry))
}

export async function chamarUbtFilaProximo(_accessToken: string) {
  void _accessToken
  const next = firstWaitingEntry()
  if (!next) {
    throw new UbtTriagemApiError('Nao ha pacientes aguardando na fila.', 409, 'FILA_EMPTY')
  }
  return chamarUbtFilaPaciente('', next.id)
}

export type FilaStatusUpdate = 'em_atendimento' | 'finalizado' | 'desistiu'

export async function updateUbtFilaStatus(
  _accessToken: string,
  filaId: string,
  status: FilaStatusUpdate,
) {
  const entry = findEntryById(filaId)
  entry.status = status
  return mockDelay(clone(entry))
}
