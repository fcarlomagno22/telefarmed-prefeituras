import { useQuery } from '@tanstack/react-query'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import {
  fetchProfissionalAtendimentosList,
  isProfissionalAtendimentosApiError,
} from '../lib/services/profissional/atendimentos'
import type {
  ProfissionalAttendanceRecord,
  ProfissionalAtendimentosFilters,
} from '../types/profissionalAtendimentos'
import { defaultProfissionalAtendimentosFilters } from '../utils/profissional/filterProfissionalAtendimentos'
import { getDefaultProfissionalAtendimentosPeriod } from '../utils/consultasPeriod'
import { queryKeys } from '../lib/query/keys'
import { PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS } from '../lib/query/timings'

const defaultPeriod = getDefaultProfissionalAtendimentosPeriod()

export function useProfissionalAtendimentosPage(
  filters: ProfissionalAtendimentosFilters,
  page: number,
  pageSize = 10,
) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()

  const query = useQuery({
    queryKey: queryKeys.profissionalAtendimentos(filters, page, pageSize),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchProfissionalAtendimentosList(token, filters, page, pageSize)
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  return {
    records: query.data?.records ?? [],
    pagination: query.data?.pagination ?? {
      page: 1,
      pageSize,
      total: 0,
      totalPages: 1,
    },
    isLoading: query.isPending,
    loadError: query.isError
      ? isProfissionalAtendimentosApiError(query.error)
        ? query.error.message
        : 'Não foi possível carregar os atendimentos.'
      : null,
    reload: async () => {
      await query.refetch()
    },
  }
}

export function createDefaultProfissionalAtendimentosFilters(): ProfissionalAtendimentosFilters {
  return {
    ...defaultProfissionalAtendimentosFilters,
    periodStart: defaultPeriod.start,
    periodEnd: defaultPeriod.end,
  }
}
