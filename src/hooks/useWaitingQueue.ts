import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  WAITING_QUEUE_UPDATED_EVENT,
  getWaitingQueueEntries,
  removeWaitingQueueEntry,
  type WaitingQueueEntry,
} from '../data/waitingQueueStore'
import { countPriorityWaiting, sortWaitingQueue } from '../utils/waitingQueueSort'

export function useWaitingQueue() {
  const [entries, setEntries] = useState<WaitingQueueEntry[]>(() => getWaitingQueueEntries())
  const [now, setNow] = useState(() => new Date())

  const refresh = useCallback(() => {
    setEntries(getWaitingQueueEntries())
    setNow(new Date())
  }, [])

  useEffect(() => {
    refresh()

    function handleUpdate() {
      refresh()
    }

    window.addEventListener(WAITING_QUEUE_UPDATED_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)

    const tick = window.setInterval(() => setNow(new Date()), 30_000)

    return () => {
      window.removeEventListener(WAITING_QUEUE_UPDATED_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
      window.clearInterval(tick)
    }
  }, [refresh])

  const waitingEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'aguardando'),
    [entries],
  )

  const ordered = useMemo(
    () => sortWaitingQueue(waitingEntries, now),
    [waitingEntries, now],
  )
  const priorityCount = useMemo(
    () => countPriorityWaiting(waitingEntries, now),
    [waitingEntries, now],
  )

  const removeEntry = useCallback((entryId: string) => {
    removeWaitingQueueEntry(entryId)
    refresh()
  }, [refresh])

  return {
    ordered,
    priorityCount,
    now,
    removeEntry,
    refresh,
  }
}
