import type { AppointmentStatus, DayAppointment } from './agendaMock'

export type WaitingQueueOrigin = 'agendado' | 'espontaneo'

export type WaitingQueueEntry = {
  id: string
  appointmentId?: string
  patientName: string
  patientCpf: string
  patientPhone?: string
  serviceType: string
  /** Horário da consulta (HH:mm), quando agendado. */
  scheduledTime?: string
  origin: WaitingQueueOrigin
  arrivedAt: string
  status: AppointmentStatus
}

const STORAGE_KEY = 'telefarmed_waiting_queue_v3'
export const WAITING_QUEUE_UPDATED_EVENT = 'telefarmed:waiting-queue-updated'

function loadQueue(): WaitingQueueEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<WaitingQueueEntry>[]
    if (!Array.isArray(parsed)) return []
    const normalized = parsed
      .map((entry) => ({
        ...entry,
        status: entry.status ?? 'aguardando',
      }))
      .filter((entry) => entry.status === 'aguardando') as WaitingQueueEntry[]

    if (normalized.length !== parsed.length) {
      saveQueue(normalized)
    }

    return normalized
  } catch {
    return []
  }
}

function saveQueue(entries: WaitingQueueEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  window.dispatchEvent(new CustomEvent(WAITING_QUEUE_UPDATED_EVENT))
}

function offsetTime(now: Date, minutes: number): string {
  const slot = new Date(now)
  slot.setMinutes(slot.getMinutes() + minutes)
  return `${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`
}

function arrivedMinutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString()
}

function buildDynamicDemoQueue(now = new Date()): WaitingQueueEntry[] {
  return [
    {
      id: 'demo-wq-1',
      patientName: 'Patricia Souza Lima',
      patientCpf: '901.234.567-89',
      patientPhone: '(11) 95432-1098',
      serviceType: 'Ginecologia',
      scheduledTime: offsetTime(now, -12),
      origin: 'agendado',
      arrivedAt: arrivedMinutesAgo(now, 22),
      status: 'aguardando',
    },
    {
      id: 'demo-wq-2',
      patientName: 'Ricardo Almeida Nunes',
      patientCpf: '345.678.901-23',
      patientPhone: '(11) 94321-0987',
      serviceType: 'Clínico geral',
      scheduledTime: offsetTime(now, -5),
      origin: 'agendado',
      arrivedAt: arrivedMinutesAgo(now, 28),
      status: 'aguardando',
    },
    {
      id: 'demo-wq-3',
      patientName: 'Helena Borges Costa',
      patientCpf: '567.890.123-45',
      patientPhone: '(11) 93210-9876',
      serviceType: 'Pediatria',
      origin: 'espontaneo',
      arrivedAt: arrivedMinutesAgo(now, 41),
      status: 'aguardando',
    },
    {
      id: 'demo-wq-4',
      patientName: 'Marcos Antônio Silva',
      patientCpf: '234.567.890-12',
      patientPhone: '(11) 92109-8765',
      serviceType: 'Dermatologia',
      scheduledTime: offsetTime(now, -18),
      origin: 'agendado',
      arrivedAt: arrivedMinutesAgo(now, 14),
      status: 'aguardando',
    },
  ]
}

export function ensureWaitingQueueSeeded() {
  const current = loadQueue()
  if (current.length > 0) return
  saveQueue(buildDynamicDemoQueue())
}

export function getWaitingQueueEntries(): WaitingQueueEntry[] {
  ensureWaitingQueueSeeded()
  return loadQueue()
}

export function enqueueWalkInReception(appointment: DayAppointment) {
  if (appointment.status !== 'aguardando') return

  const queue = loadQueue()
  if (queue.some((entry) => entry.appointmentId === appointment.id)) {
    return
  }

  queue.push({
    id: `wq-${appointment.id}`,
    appointmentId: appointment.id,
    patientName: appointment.patientName,
    patientCpf: appointment.patientCpf,
    patientPhone: appointment.patientPhone,
    serviceType: appointment.serviceType,
    origin: 'espontaneo',
    arrivedAt: new Date().toISOString(),
    status: 'aguardando',
  })
  saveQueue(queue)
}

export function enqueueWaitingPatientFromAppointment(appointment: DayAppointment) {
  if (appointment.status !== 'aguardando') return

  const queue = loadQueue()
  if (queue.some((entry) => entry.appointmentId === appointment.id)) {
    return
  }

  queue.push({
    id: `wq-${appointment.id}`,
    appointmentId: appointment.id,
    patientName: appointment.patientName,
    patientCpf: appointment.patientCpf,
    patientPhone: appointment.patientPhone,
    serviceType: appointment.serviceType,
    scheduledTime: appointment.time,
    origin: 'agendado',
    arrivedAt: new Date().toISOString(),
    status: 'aguardando',
  })
  saveQueue(queue)
}

export function removeWaitingQueueEntry(entryId: string) {
  const queue = loadQueue().filter((entry) => entry.id !== entryId)
  saveQueue(queue)
}
