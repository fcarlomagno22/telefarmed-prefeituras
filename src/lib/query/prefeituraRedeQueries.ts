import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePrefeituraAuth } from '../../contexts/PrefeituraAuthContext'
import {
  fetchPrefeituraRedeOverview,
  fetchPrefeituraRedeUnits,
  isPrefeituraRedeApiError,
} from '../services/prefeitura/rede'
import { queryKeys } from './keys'
import { UNITS_GC_MS, UNITS_STALE_MS } from './timings'

export function usePrefeituraRedeUnitsQuery() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()

  return useQuery({
    queryKey: queryKeys.prefeituraUnits(),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchPrefeituraRedeUnits(token)
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  })
}

export function usePrefeituraRedeOverviewQuery() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()

  return useQuery({
    queryKey: queryKeys.prefeituraRedeOverview(),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchPrefeituraRedeOverview(token)
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  })
}

export function useInvalidatePrefeituraRedeQueries() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.prefeituraUnits() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.prefeituraRedeOverview() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.prefeituraUbtOptions() })
  }
}

export function getPrefeituraRedeQueryErrorMessage(error: unknown): string {
  if (isPrefeituraRedeApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível carregar a rede de UBTs.'
}
