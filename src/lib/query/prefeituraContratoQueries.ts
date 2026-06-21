import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchPrefeituraActiveContratoEspecialidadeIds,
  isPrefeituraContratoApiError,
} from '../services/prefeitura/contrato'
import { queryKeys } from './keys'
import { UNITS_GC_MS, UNITS_STALE_MS } from './timings'

export function usePrefeituraContratoSpecialtyIdsQuery(
  getAccessToken: () => string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.prefeituraContratoSpecialtyIds(),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchPrefeituraActiveContratoEspecialidadeIds(token)
    },
    enabled,
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  })
}

export function getPrefeituraContratoSpecialtyIdsErrorMessage(error: unknown): string {
  if (isPrefeituraContratoApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível carregar as especialidades contratadas.'
}

export function useInvalidatePrefeituraContratoSpecialtyIds() {
  const queryClient = useQueryClient()
  return () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.prefeituraContratoSpecialtyIds() })
}
