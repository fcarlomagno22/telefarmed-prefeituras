import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import { fetchUbtFilaLive, isUbtTriagemApiError } from '../lib/services/ubt/triagem'
import type { WaitingQueueEntry } from '../types/waitingQueue'
import { countPriorityWaiting, sortWaitingQueue } from '../utils/waitingQueueSort'

export function useWaitingQueue() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useUbtAuth()
  const [entries, setEntries] = useState<WaitingQueueEntry[]>([])
  const [priorityCount, setPriorityCount] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setEntries([])
      setPriorityCount(0)
      setIsLoading(false)
      return
    }

    try {
      const fila = await fetchUbtFilaLive(token)
      setEntries(fila.entries)
      setPriorityCount(fila.priorityCount)
      setNow(new Date(fila.serverTime))
      setLoadError(null)
    } catch (error) {
      const message = isUbtTriagemApiError(error)
        ? error.message
        : 'Não foi possível carregar a fila de espera.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      setEntries([])
      return
    }

    void refresh()
    const poll = window.setInterval(() => void refresh(), 15_000)
    const tick = window.setInterval(() => setNow(new Date()), 30_000)
    return () => {
      window.clearInterval(poll)
      window.clearInterval(tick)
    }
  }, [isAuthenticated, isBootstrapping, refresh])

  const waitingEntries = useMemo(
    () => entries.filter((entry) => entry.status === 'aguardando'),
    [entries],
  )

  const ordered = useMemo(
    () => sortWaitingQueue(waitingEntries, now),
    [waitingEntries, now],
  )

  const computedPriorityCount = useMemo(
    () => (priorityCount > 0 ? priorityCount : countPriorityWaiting(waitingEntries, now)),
    [priorityCount, waitingEntries, now],
  )

  return {
    ordered,
    priorityCount: computedPriorityCount,
    now,
    refresh,
    isLoading,
    loadError,
  }
}
