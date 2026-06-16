import { useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  RunWalkLiveShareViewerContent,
  useLiveShareViewerPolling,
} from '../components/runWalkLiveShare/RunWalkLiveShareViewerContent'
import { brand } from '../config/brand'
import { isLiveShareDemoToken } from '../data/runWalkLiveSharePublicMock'
import {
  fetchLiveShareSession,
  isRunWalkLiveSharePublicApiError,
} from '../lib/services/public/runWalkLiveShare'

function normalizeToken(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function isValidToken(value: string): boolean {
  if (isLiveShareDemoToken(value)) return true
  const normalized = normalizeToken(value)
  return normalized.length >= 6 && normalized.length <= 12
}

export function RunWalkLiveSharePublicPage() {
  const { token = '' } = useParams<{ token: string }>()
  const normalizedToken = isLiveShareDemoToken(token) ? 'demo' : normalizeToken(token)
  const hasValidToken = isValidToken(token)

  const fetchSession = useCallback(async (shareToken: string) => {
    try {
      return await fetchLiveShareSession(shareToken)
    } catch (error) {
      if (isRunWalkLiveSharePublicApiError(error)) throw error
      throw new Error('Não foi possível carregar o acompanhamento.')
    }
  }, [])

  const { session, loading, error, lastUpdatedAt, refresh } = useLiveShareViewerPolling(
    normalizedToken,
    fetchSession,
  )

  useEffect(() => {
    document.title = `${brand.appName} — Acompanhar ao vivo`
    return () => {
      document.title = brand.appName
    }
  }, [])

  if (!hasValidToken) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0c] px-6 text-center text-white">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-red-300">Link inválido</h1>
          <p className="text-sm text-white/70">
            Este link de acompanhamento não é válido. Peça para a pessoa compartilhar novamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <RunWalkLiveShareViewerContent
      token={normalizedToken}
      session={session}
      loading={loading}
      error={error}
      lastUpdatedAt={lastUpdatedAt}
      onRefresh={() => {
        void refresh()
      }}
    />
  )
}
