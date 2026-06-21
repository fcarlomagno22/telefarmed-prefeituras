import { useMemo } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  getAdminClinicoCatalogErrorMessage,
  mapAdminClinicoSpecialtyOptions,
  useAdminClinicoCatalogQuery,
} from '../lib/query/adminCatalogQueries'

export type ClienteSpecialtyOption = {
  id: string
  name: string
  available: boolean
  professionIds: string[]
}

export function useAdminClientesClinicoCatalog(options?: { activeOnly?: boolean }) {
  const activeOnly = options?.activeOnly ?? true
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()

  const query = useAdminClinicoCatalogQuery(
    getAccessToken,
    isAuthenticated && !isBootstrapping,
    activeOnly,
  )

  const specialties = useMemo(
    () => mapAdminClinicoSpecialtyOptions(query.data),
    [query.data],
  )

  return {
    catalog: query.data ?? null,
    specialties,
    professions: query.data?.professions ?? [],
    isLoading: query.isPending || isBootstrapping,
    error: query.isError ? getAdminClinicoCatalogErrorMessage(query.error) : null,
    reload: async () => {
      await query.refetch()
    },
  }
}

export function getClienteSpecialtyById(
  specialties: ClienteSpecialtyOption[],
  id: string,
): ClienteSpecialtyOption | undefined {
  return specialties.find((item) => item.id === id)
}
