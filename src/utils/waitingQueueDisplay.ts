import type { WaitingQueueEntry } from '../data/waitingQueueStore'
import { minutesFromScheduledSlot } from './waitingQueueSort'

export function formatQueueArrivalTime(arrivedAt: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(arrivedAt))
}

export function formatScheduledDelayLabel(
  scheduledTime: string,
  now: Date = new Date(),
): string | null {
  const delta = minutesFromScheduledSlot(scheduledTime, now)
  if (delta > 0) return `${delta} min de atraso`
  if (delta === 0) return 'no horário'
  return null
}

export function buildQueueEntryMeta(
  entry: WaitingQueueEntry,
  now: Date,
): { primary: string; secondary?: string } {
  if (entry.origin === 'espontaneo') {
    return {
      primary: `Chegou às ${formatQueueArrivalTime(entry.arrivedAt)} · ${entry.serviceType}`,
    }
  }

  const delay = entry.scheduledTime
    ? formatScheduledDelayLabel(entry.scheduledTime, now)
    : null

  return {
    primary: [
      entry.scheduledTime ? `Horário ${entry.scheduledTime}` : 'Sem horário',
      entry.serviceType,
    ].join(' · '),
    secondary: delay ?? undefined,
  }
}
