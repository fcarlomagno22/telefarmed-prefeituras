import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendLiveSharePoints,
  isRemoteLiveShareSession,
} from '../data/runWalkLiveShareService'
import {
  enqueueRunWalkGpsPoint,
  flushRunWalkGpsQueue,
  loadRunWalkGpsQueue,
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
    if (!enabled || !isConnected || isSyncingRef.current) return 0
    if (!isRemoteLiveShareSession(sessionId)) return 0

    isSyncingRef.current = true
    setIsSyncing(true)

    try {
      const synced = await flushRunWalkGpsQueue(async (chunk) => {
        const points = await appendLiveSharePoints(
          chunk.map((point) => ({
            sessionId: point.sessionId,
            latitude: point.latitude,
            longitude: point.longitude,
            accuracyMeters: point.accuracyMeters,
            recordedAt: point.recordedAt,
          })),
        )
        return points.length
      })

      return synced
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
      await refreshPendingCount()
    }
  }, [enabled, isConnected, refreshPendingCount, sessionId])

  const queueGpsPoint = useCallback(
    async (input: QueueGpsPointInput) => {
      if (!enabled || !shouldPublish || !isRemoteLiveShareSession(input.sessionId)) return

      await enqueueRunWalkGpsPoint({
        sessionId: input.sessionId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMeters: input.accuracyMeters,
        recordedAt: new Date().toISOString(),
      })
      await refreshPendingCount()
    },
    [enabled, refreshPendingCount, shouldPublish],
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
