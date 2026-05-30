import type { ProfissionalQueuePatient } from '../../types/profissionalAgenda'
import { isAppointmentSlotPriority } from '../waitingQueueSort'

const STATUS_ORDER: Record<ProfissionalQueuePatient['status'], number> = {
  em_atendimento: 0,
  chamado: 1,
  aguardando: 2,
  finalizado: 3,
  nao_compareceu: 4,
  desistiu: 5,
}

export function sortProfissionalQueue(
  patients: ProfissionalQueuePatient[],
  now: Date = new Date(),
): ProfissionalQueuePatient[] {
  return [...patients].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (statusDiff !== 0) return statusDiff

    if (a.status !== 'aguardando' && b.status !== 'aguardando') {
      return new Date(b.arrivedAt).getTime() - new Date(a.arrivedAt).getTime()
    }

    const aPriority =
      a.scheduledTime && isAppointmentSlotPriority(a.scheduledTime, now)
    const bPriority =
      b.scheduledTime && isAppointmentSlotPriority(b.scheduledTime, now)
    if (aPriority !== bPriority) return aPriority ? -1 : 1

    if (a.scheduledTime && b.scheduledTime) {
      return a.scheduledTime.localeCompare(b.scheduledTime)
    }

    return new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime()
  })
}

export function countProfissionalQueueWaiting(
  patients: ProfissionalQueuePatient[],
): number {
  return patients.filter(
    (patient) =>
      patient.status === 'aguardando' ||
      patient.status === 'chamado' ||
      patient.status === 'em_atendimento',
  ).length
}

export type ProfissionalQueuePartition = {
  active: ProfissionalQueuePatient[]
  attended: ProfissionalQueuePatient[]
}

export function partitionProfissionalQueue(
  patients: ProfissionalQueuePatient[],
  now: Date = new Date(),
): ProfissionalQueuePartition {
  const active: ProfissionalQueuePatient[] = []
  const attended: ProfissionalQueuePatient[] = []

  for (const patient of patients) {
    if (
      patient.status === 'finalizado' ||
      patient.status === 'nao_compareceu' ||
      patient.status === 'desistiu'
    ) {
      attended.push(patient)
    } else {
      active.push(patient)
    }
  }

  return {
    active: sortProfissionalQueue(active, now),
    attended: sortProfissionalQueue(attended, now),
  }
}
