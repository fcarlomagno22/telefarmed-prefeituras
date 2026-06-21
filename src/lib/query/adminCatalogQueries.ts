import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchClientesClinicoCatalog,
  fetchClientesContratoCatalog,
  isAdminClientesApiError,
  type ClinicoCatalogResponse,
  type ClinicoSpecialtyApi,
} from '../services/admin/clientes'
import { queryKeys } from './keys'
import { CATALOG_GC_MS, CATALOG_STALE_MS } from './timings'

export function useAdminClinicoCatalogQuery(
  getAccessToken: () => string | null,
  enabled: boolean,
  activeOnly = true,
) {
  return useQuery({
    queryKey: queryKeys.adminClinicoCatalog(activeOnly),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchClientesClinicoCatalog(token, activeOnly)
    },
    enabled,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  })
}

export function useAdminContratoCatalogQuery(
  getAccessToken: () => string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.contratoCatalog(),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchClientesContratoCatalog(token)
    },
    enabled,
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  })
}

export function mapAdminClinicoSpecialtyOptions(data: ClinicoCatalogResponse | undefined) {
  return (data?.specialties ?? []).map((item: ClinicoSpecialtyApi) => ({
    id: item.id,
    name: item.name,
    available: item.active,
    professionIds: item.professionIds,
  }))
}

export function getAdminClinicoCatalogErrorMessage(error: unknown): string {
  if (isAdminClientesApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível carregar especialidades.'
}

export function getAdminContratoCatalogErrorMessage(error: unknown): string {
  if (isAdminClientesApiError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível carregar os tipos de contrato.'
}

export function useInvalidateAdminCatalogQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateClinico: () =>
      void queryClient.invalidateQueries({ queryKey: ['admin-clinico-catalog'] }),
    invalidateContrato: () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.contratoCatalog() }),
  }
}
