import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import type {
  ProfissionalAvaliacoesFilters,
  ProfissionalPatientReview,
} from '../types/profissionalAvaliacoes'
import type { ProfissionalAvaliacoesApiSummary } from '../types/profissionalAvaliacoesApi'
import {
  fetchProfissionalAvaliacoesList,
  fetchProfissionalAvaliacoesSummary,
  isProfissionalAvaliacoesApiError,
} from '../lib/services/profissional/avaliacoes'
import type { ProfissionalAvaliacoesStats } from '../utils/profissional/computeProfissionalAvaliacoesStats'
import {
  mapApiReviewToPatientReview,
  mapSummaryToAvaliacoesStats,
} from '../utils/profissional/mapProfissionalAvaliacoesApi'
import {
  readPortalPageCache,
  writePortalPageCache,
} from '../utils/portal/portalPageCache'
import { shouldBlockPortalPageWithCache } from '../utils/portal/portalPageLoading'

function buildApiQuery(filters: ProfissionalAvaliacoesFilters) {
  return {
    criticos: filters.tab === 'criticos' ? true : undefined,
    search: filters.search.trim() || undefined,
    limit: 100,
    offset: 0,
  }
}

function avaliacaoCacheKey(query: ReturnType<typeof buildApiQuery>) {
  return `profissional:avaliacao:${JSON.stringify(query)}`
}

type AvaliacaoPageCache = {
  summary: ProfissionalAvaliacoesApiSummary
  reviews: ProfissionalPatientReview[]
  totalReviews: number
}

export function useProfissionalAvaliacaoPage(filters: ProfissionalAvaliacoesFilters) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()

  const apiQuery = useMemo(() => buildApiQuery(filters), [filters])
  const cacheKey = avaliacaoCacheKey(apiQuery)
  const cached = readPortalPageCache<AvaliacaoPageCache>(cacheKey)

  const [summary, setSummary] = useState<ProfissionalAvaliacoesApiSummary | null>(
    cached?.summary ?? null,
  )
  const [reviews, setReviews] = useState<ProfissionalPatientReview[]>(cached?.reviews ?? [])
  const [totalReviews, setTotalReviews] = useState(cached?.totalReviews ?? 0)
  const [isLoading, setIsLoading] = useState(shouldBlockPortalPageWithCache(cacheKey))

  const [loadError, setLoadError] = useState<string | null>(null)

  const stats = useMemo((): ProfissionalAvaliacoesStats | null => {
    if (!summary) return null
    return mapSummaryToAvaliacoesStats(summary)
  }, [summary])

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    if (shouldBlockPortalPageWithCache(cacheKey)) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const [summaryData, listData] = await Promise.all([
        fetchProfissionalAvaliacoesSummary(token, apiQuery),
        fetchProfissionalAvaliacoesList(token, apiQuery),
      ])

      const nextReviews = listData.reviews.map(mapApiReviewToPatientReview)
      setSummary(summaryData)
      setReviews(nextReviews)
      setTotalReviews(listData.total)
      writePortalPageCache(cacheKey, {
        summary: summaryData,
        reviews: nextReviews,
        totalReviews: listData.total,
      })
    } catch (error) {
      const message = isProfissionalAvaliacoesApiError(error)
        ? error.message
        : 'Não foi possível carregar as avaliações.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [apiQuery, cacheKey, getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  return {
    summary,
    stats,
    reviews,
    totalReviews,
    isLoading,
    loadError,
    reload,
  }
}
