import { useCallback, useEffect, useState } from 'react'
import { LIVE_SHARE_PUBLISH_INTERVAL_MS } from '../constants/runWalkLiveShare'
import { fetchLocalLiveShareSessionByToken } from '../data/runWalkLiveShareService'
import {
  fetchPublicLiveShareSession,
  isRunWalkLiveSharePublicApiError,
} from '../lib/api/public/runWalkLiveShare'
import type { LiveShareSessionSnapshot } from '../types/runWalkLiveShare'
import { normalizeLiveShareToken } from '../utils/runWalkLiveShareToken'

type UseRunWalkLiveShareViewerOptions = {
  token: string
  enabled: boolean
}

export function useRunWalkLiveShareViewer({ token, enabled }: UseRunWalkLiveShareViewerOptions) {
  const [snapshot, setSnapshot] = useState<LiveShareSessionSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const normalized = normalizeLiveShareToken(token)
    if (!normalized) {
      setSnapshot(null)
      setError('Link de acompanhamento inválido.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const local = await fetchLocalLiveShareSessionByToken(normalized)
      if (local) {
        setSnapshot(local)
        setLastUpdatedAt(new Date().toISOString())
        return
      }

      const next = await fetchPublicLiveShareSession(normalized)
      setSnapshot(next)
      setLastUpdatedAt(new Date().toISOString())
    } catch (caught) {
      setSnapshot(null)
      if (isRunWalkLiveSharePublicApiError(caught)) {
        setError(caught.message)
        return
      }
      setError('Não foi possível carregar a localização.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!enabled || !normalizeLiveShareToken(token)) {
      setSnapshot(null)
      setError(null)
      return
    }

    void refresh()

    const timer = setInterval(() => {
      void refresh()
    }, LIVE_SHARE_PUBLISH_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [enabled, refresh, token])

  return {
    snapshot,
    isLoading,
    error,
    lastUpdatedAt,
    refresh,
    refreshIntervalMs: LIVE_SHARE_PUBLISH_INTERVAL_MS,
  }
}
