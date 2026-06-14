import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  fetchClientesClinicoCatalog,
  isAdminClientesApiError,
  type ClinicoCatalogResponse,
  type ClinicoSpecialtyApi,
} from '../lib/services/admin/clientes'

export type ClienteSpecialtyOption = {
  id: string
  name: string
  available: boolean
  professionIds: string[]
}

export function useAdminClientesClinicoCatalog(options?: { activeOnly?: boolean }) {
  const activeOnly = options?.activeOnly ?? true
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [catalog, setCatalog] = useState<ClinicoCatalogResponse | null>(null)
  const [specialties, setSpecialties] = useState<ClienteSpecialtyOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchClientesClinicoCatalog(token, activeOnly)
      setCatalog(data)
      setSpecialties(
        data.specialties.map((item: ClinicoSpecialtyApi) => ({
          id: item.id,
          name: item.name,
          available: item.active,
          professionIds: item.professionIds,
        })),
      )
    } catch (err) {
      const message = isAdminClientesApiError(err)
        ? err.message
        : 'Não foi possível carregar especialidades.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, activeOnly])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  return {
    catalog,
    specialties,
    professions: catalog?.professions ?? [],
    isLoading: isLoading || isBootstrapping,
    error,
    reload,
  }
}

export function getClienteSpecialtyById(
  specialties: ClienteSpecialtyOption[],
  id: string,
): ClienteSpecialtyOption | undefined {
  return specialties.find((item) => item.id === id)
}
