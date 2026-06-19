import type { WaitingQueueEntry } from '../types/waitingQueue'

const PRIORITY_WINDOW_MINUTES = 20

/** Interpreta HH:mm no dia local de referência (padrão: agora). */
export function parseAppointmentTimeToday(
  time: string,
  referenceDate: Date = new Date(),
): Date {
  const [hours, minutes] = time.split(':').map((part) => Number(part))
  const slot = new Date(referenceDate)
  slot.setHours(hours, minutes, 0, 0)
  return slot
}

/** Minutos entre o horário agendado e o momento atual (positivo = atraso). */
export function minutesFromScheduledSlot(time: string, now: Date = new Date()): number {
  const slot = parseAppointmentTimeToday(time, now)
  return Math.round((now.getTime() - slot.getTime()) / 60_000)
}

/** Horário agendado próximo (até 20 min) ou já passou (até 20 min). */
export function isAppointmentSlotPriority(time: string, now: Date = new Date()): boolean {
  const delta = minutesFromScheduledSlot(time, now)
  return delta >= -PRIORITY_WINDOW_MINUTES && delta <= PRIORITY_WINDOW_MINUTES
}

function prioritySortKey(entry: WaitingQueueEntry, now: Date): number {
  if (!entry.scheduledTime) return Number.POSITIVE_INFINITY
  const slotMs = parseAppointmentTimeToday(entry.scheduledTime, now).getTime()
  const lateMs = now.getTime() - slotMs
  if (lateMs > 0) return lateMs
  return slotMs + 1_000_000_000
}

function triagemDisplaySortKey(entry: WaitingQueueEntry, now: Date): number {
  if (entry.status === 'chamado') return -2
  if (
    entry.scheduledTime &&
    isAppointmentSlotPriority(entry.scheduledTime, now)
  ) {
    return -1
  }
  return 0
}

/** Ordenação da fila na triagem: chamados primeiro, depois prioridade de horário. */
export function sortWaitingQueue(
  entries: WaitingQueueEntry[],
  now: Date = new Date(),
): WaitingQueueEntry[] {
  return [...entries].sort((a, b) => {
    const aDisplay = triagemDisplaySortKey(a, now)
    const bDisplay = triagemDisplaySortKey(b, now)
    if (aDisplay !== bDisplay) {
      return aDisplay - bDisplay
    }

    const aPriority = a.scheduledTime
      ? isAppointmentSlotPriority(a.scheduledTime, now)
      : false
    const bPriority = b.scheduledTime
      ? isAppointmentSlotPriority(b.scheduledTime, now)
      : false

    if (aPriority !== bPriority) {
      return aPriority ? -1 : 1
    }

    if (aPriority && bPriority) {
      return prioritySortKey(a, now) - prioritySortKey(b, now)
    }

    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime()
  })
}

export function countPriorityWaiting(
  entries: WaitingQueueEntry[],
  now: Date = new Date(),
): number {
  return entries.filter(
    (entry) =>
      entry.scheduledTime && isAppointmentSlotPriority(entry.scheduledTime, now),
  ).length
}
