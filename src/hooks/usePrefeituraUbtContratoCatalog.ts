import { useMemo } from 'react'
import { filterCatalogByContratoEspecialidades } from '../components/prefeitura/rede/newUbt/newUbtCatalogUtils'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { usePublicClinicoCatalogQuery } from '../lib/query/clinicoCatalogQuery'
import {
  getPrefeituraContratoSpecialtyIdsErrorMessage,
  usePrefeituraContratoSpecialtyIdsQuery,
} from '../lib/query/prefeituraContratoQueries'

export function usePrefeituraUbtContratoCatalog(enabled = true) {
  const { getAccessToken } = usePrefeituraAuth()
  const catalogQuery = usePublicClinicoCatalogQuery(true)
  const contractQuery = usePrefeituraContratoSpecialtyIdsQuery(getAccessToken, enabled)

  const contractedSpecialtyIds = contractQuery.data ?? []

  const filtered = useMemo(
    () =>
      filterCatalogByContratoEspecialidades(
        catalogQuery.data?.professions ?? [],
        catalogQuery.data?.specialties ?? [],
        contractedSpecialtyIds,
      ),
    [catalogQuery.data?.professions, catalogQuery.data?.specialties, contractedSpecialtyIds],
  )

  const contractError =
    contractQuery.isError
      ? getPrefeituraContratoSpecialtyIdsErrorMessage(contractQuery.error)
      : contractedSpecialtyIds.length === 0 && contractQuery.isSuccess
        ? 'Nenhuma especialidade encontrada nos contratos ativos da entidade.'
        : null

  const reload = async () => {
    await Promise.all([catalogQuery.refetch(), contractQuery.refetch()])
  }

  return {
    professions: filtered.professions,
    specialties: filtered.specialties,
    contractedSpecialtyIds,
    isLoading: enabled && (catalogQuery.isPending || contractQuery.isPending),
    error:
      (catalogQuery.isError
        ? 'Não foi possível carregar profissões e especialidades.'
        : null) ?? contractError,
    reload,
  }
}
