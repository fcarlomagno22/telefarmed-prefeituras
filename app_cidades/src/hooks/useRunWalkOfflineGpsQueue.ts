import { useCallback, useEffect, useRef, useState } from 'react'
import { appendLiveSharePoint } from '../data/runWalkLiveShareService'
import {
  enqueueRunWalkGpsPoint,
  loadRunWalkGpsQueue,
  removeRunWalkGpsPoints,
  type RunWalkQueuedGpsPoint,
} from '../data/runWalkGpsPointQueue'
import { useAppNetwork } from './useAppNetwork'

type QueueGpsPointInput = {
  sessionId: string
  latitude: number
  longitude: number
  accuracyMeters: number | null
}

type UseRunWalkOfflineGpsQueueOptions = {
  enabled: boolean
  sessionId: string | null | undefined
  shouldPublish: boolean
}

export function useRunWalkOfflineGpsQueue({
  enabled,
  sessionId,
  shouldPublish,
}: UseRunWalkOfflineGpsQueueOptions) {
  const { isConnected } = useAppNetwork()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const isSyncingRef = useRef(false)

  const refreshPendingCount = useCallback(async () => {
    const queue = await loadRunWalkGpsQueue()
    setPendingCount(queue.length)
  }, [])

  const flushQueue = useCallback(async () => {
    if (!enabled || !isConnected || isSyncingRef.current) return

    const queue = await loadRunWalkGpsQueue()
    if (queue.length === 0) {
      setPendingCount(0)
      return
    }

    isSyncingRef.current = true
    setIsSyncing(true)

    const syncedIds: string[] = []

    try {
      for (const point of queue) {
        const synced = await appendLiveSharePoint({
          sessionId: point.sessionId,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracyMeters: point.accuracyMeters,
        })

        if (!synced) break
        syncedIds.push(point.id)
      }

      if (syncedIds.length > 0) {
        await removeRunWalkGpsPoints(syncedIds)
      }
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
      await refreshPendingCount()
    }
  }, [enabled, isConnected, refreshPendingCount])

  const queueGpsPoint = useCallback(
    async (input: QueueGpsPointInput) => {
      if (!enabled || !shouldPublish) return

      if (isConnected) {
        const synced = await appendLiveSharePoint(input)
        if (synced) return
      }

      await enqueueRunWalkGpsPoint({
        sessionId: input.sessionId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMeters: input.accuracyMeters,
        recordedAt: new Date().toISOString(),
      })
      await refreshPendingCount()
    },
    [enabled, isConnected, refreshPendingCount, shouldPublish],
  )

  useEffect(() => {
    void refreshPendingCount()
  }, [refreshPendingCount])

  useEffect(() => {
    if (!enabled || !isConnected) return
    void flushQueue()
  }, [enabled, flushQueue, isConnected])

  return {
    isOffline: !isConnected,
    isSyncing,
    pendingCount,
    queueGpsPoint,
    flushQueue,
  }
}

export type { RunWalkQueuedGpsPoint }
