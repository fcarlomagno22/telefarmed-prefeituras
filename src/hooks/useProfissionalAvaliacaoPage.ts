import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { queryKeys } from '../lib/query/keys'
import { PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS } from '../lib/query/timings'

function buildApiQuery(filters: ProfissionalAvaliacoesFilters) {
  return {
    criticos: filters.tab === 'criticos' ? true : undefined,
    search: filters.search.trim() || undefined,
    limit: 100,
    offset: 0,
  }
}

type AvaliacaoPageData = {
  summary: ProfissionalAvaliacoesApiSummary
  reviews: ProfissionalPatientReview[]
  totalReviews: number
}

export function useProfissionalAvaliacaoPage(filters: ProfissionalAvaliacoesFilters) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()

  const apiQuery = useMemo(() => buildApiQuery(filters), [filters])

  const query = useQuery({
    queryKey: queryKeys.profissionalAvaliacao(apiQuery),
    queryFn: async (): Promise<AvaliacaoPageData> => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      const [summaryData, listData] = await Promise.all([
        fetchProfissionalAvaliacoesSummary(token, apiQuery),
        fetchProfissionalAvaliacoesList(token, apiQuery),
      ])

      return {
        summary: summaryData,
        reviews: listData.reviews.map(mapApiReviewToPatientReview),
        totalReviews: listData.total,
      }
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  const stats = useMemo((): ProfissionalAvaliacoesStats | null => {
    if (!query.data?.summary) return null
    return mapSummaryToAvaliacoesStats(query.data.summary)
  }, [query.data?.summary])

  return {
    summary: query.data?.summary ?? null,
    stats,
    reviews: query.data?.reviews ?? [],
    totalReviews: query.data?.totalReviews ?? 0,
    isLoading: query.isPending,
    loadError: query.isError
      ? isProfissionalAvaliacoesApiError(query.error)
        ? query.error.message
        : 'Não foi possível carregar as avaliações.'
      : null,
    reload: async () => {
      await query.refetch()
    },
  }
}
