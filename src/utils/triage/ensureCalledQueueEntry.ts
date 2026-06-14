import {
  chamarUbtFilaPaciente,
  chamarUbtFilaProximo,
  fetchUbtFilaLive,
  isUbtTriagemApiError,
} from '../../lib/services/ubt/triagem'
import type { WaitingQueueEntry } from '../../types/waitingQueue'

const RESUMABLE_STATUSES = new Set<WaitingQueueEntry['status']>(['chamado', 'em_atendimento'])

export async function ensureCalledQueueEntry(
  accessToken: string,
  entry: WaitingQueueEntry,
): Promise<WaitingQueueEntry> {
  if (entry.status === 'aguardando') {
    try {
      const called = await chamarUbtFilaPaciente(accessToken, entry.id)
      return { ...entry, ...called, status: 'chamado' }
    } catch (error) {
      if (isUbtTriagemApiError(error) && error.status === 409) {
        const live = await fetchUbtFilaLive(accessToken)
        const current = live.entries.find((row) => row.id === entry.id)
        if (current && RESUMABLE_STATUSES.has(current.status)) {
          return { ...entry, ...current }
        }
      }
      throw error
    }
  }

  if (RESUMABLE_STATUSES.has(entry.status)) {
    return entry
  }

  throw new Error('Somente pacientes aguardando podem ser chamados.')
}

export async function callNextQueueEntry(accessToken: string): Promise<WaitingQueueEntry> {
  try {
    const called = await chamarUbtFilaProximo(accessToken)
    return { ...called, status: 'chamado' }
  } catch (error) {
    if (isUbtTriagemApiError(error) && error.status === 409) {
      const live = await fetchUbtFilaLive(accessToken)
      const current = live.entries.find((row) => RESUMABLE_STATUSES.has(row.status))
      if (current) return current
    }
    throw error
  }
}
