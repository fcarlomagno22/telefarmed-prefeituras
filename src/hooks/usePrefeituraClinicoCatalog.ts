import { useQueryClient } from '@tanstack/react-query'
import type { ConfigProfession, ConfigSpecialty } from '../types/adminConfiguracoes'
import { usePublicClinicoCatalogQuery } from '../lib/query/clinicoCatalogQuery'

export function usePrefeituraClinicoCatalog() {
  const queryClient = useQueryClient()
  const query = usePublicClinicoCatalogQuery(true)

  return {
    professions: query.data?.professions ?? [],
    specialties: query.data?.specialties ?? [],
    isLoading: query.isPending,
    error: query.isError ? 'Não foi possível carregar profissões e especialidades.' : null,
    reload: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clinico-catalog'] })
    },
  }
}

export type UbtCatalogProfession = ConfigProfession
export type UbtCatalogSpecialty = ConfigSpecialty
