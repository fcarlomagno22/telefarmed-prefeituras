import { useQuery } from '@tanstack/react-query'
import { fetchPublicClinicoCatalog } from '../services/configuracoes'
import { queryKeys } from './keys'
import { CATALOG_GC_MS, CATALOG_STALE_MS } from './timings'

export function usePublicClinicoCatalogQuery(activeOnly = true) {
  return useQuery({
    queryKey: queryKeys.clinicoCatalog(activeOnly),
    queryFn: () => fetchPublicClinicoCatalog(activeOnly),
    staleTime: CATALOG_STALE_MS,
    gcTime: CATALOG_GC_MS,
  })
}
