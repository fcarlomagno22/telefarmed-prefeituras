import { useCallback, useEffect, useState } from 'react'
import type { ConfigProfession, ConfigSpecialty } from '../types/adminConfiguracoes'
import { fetchPublicClinicoCatalog } from '../lib/services/configuracoes'
import type { ClinicoCatalogResponse } from '../lib/services/configuracoes'

export function usePrefeituraClinicoCatalog() {
  const [catalog, setCatalog] = useState<ClinicoCatalogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchPublicClinicoCatalog(true)
      setCatalog(data)
    } catch {
      setError('Não foi possível carregar profissões e especialidades.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    professions: catalog?.professions ?? [],
    specialties: catalog?.specialties ?? [],
    isLoading,
    error,
    reload,
  }
}

export type UbtCatalogProfession = ConfigProfession
export type UbtCatalogSpecialty = ConfigSpecialty
