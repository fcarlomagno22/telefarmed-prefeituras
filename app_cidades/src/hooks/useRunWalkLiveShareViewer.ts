import { useCallback, useEffect, useState } from 'react'
import { fetchLiveShareSessionByToken } from '../data/runWalkLiveShareService'
import type { LiveShareSessionSnapshot } from '../types/runWalkLiveShare'
import { normalizeLiveShareToken } from '../utils/runWalkLiveShareToken'
import { LIVE_SHARE_PUBLISH_INTERVAL_MS } from './useRunWalkLiveSharePublisher'

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
      const next = await fetchLiveShareSessionByToken(normalized)
      if (!next) {
        setSnapshot(null)
        setError('Sessão não encontrada. O link pode ter expirado ou a atividade ainda não começou.')
        return
      }

      setSnapshot(next)
      setLastUpdatedAt(new Date().toISOString())
    } catch {
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
