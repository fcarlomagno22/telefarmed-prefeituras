import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUbtOptions } from '../services/admin/credenciais'
import { fetchPrefeituraUbtOptions } from '../services/prefeitura/credenciais'
import { queryKeys } from './keys'
import { UNITS_GC_MS, UNITS_STALE_MS } from './timings'

export function usePrefeituraUbtOptionsQuery(getAccessToken: () => string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.prefeituraUbtOptions(),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchPrefeituraUbtOptions(token)
    },
    enabled,
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  })
}

export function useAdminUbtOptionsQuery(getAccessToken: () => string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminUbtOptions(),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchUbtOptions(token)
    },
    enabled,
    staleTime: UNITS_STALE_MS,
    gcTime: UNITS_GC_MS,
  })
}

export function useInvalidatePrefeituraUbtOptions() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: queryKeys.prefeituraUbtOptions() })
}

export function useInvalidateAdminUbtOptions() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: queryKeys.adminUbtOptions() })
}
