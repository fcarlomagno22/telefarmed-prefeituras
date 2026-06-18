import { useCallback, useEffect, useMemo, useState } from 'react'
import { filterCatalogByContratoEspecialidades } from '../components/prefeitura/rede/newUbt/newUbtCatalogUtils'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  fetchPrefeituraActiveContratoEspecialidadeIds,
  isPrefeituraContratoApiError,
} from '../lib/services/prefeitura/contrato'
import { usePrefeituraClinicoCatalog } from './usePrefeituraClinicoCatalog'

export function usePrefeituraUbtContratoCatalog(enabled = true) {
  const { getAccessToken } = usePrefeituraAuth()
  const {
    professions: catalogProfessions,
    specialties: catalogSpecialties,
    isLoading: catalogLoading,
    error: catalogError,
    reload: reloadCatalog,
  } = usePrefeituraClinicoCatalog()

  const [contractLoading, setContractLoading] = useState(true)
  const [contractError, setContractError] = useState<string | null>(null)
  const [contractedSpecialtyIds, setContractedSpecialtyIds] = useState<string[]>([])

  const reloadContracts = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setContractedSpecialtyIds([])
      setContractError('Sessão expirada. Faça login novamente.')
      setContractLoading(false)
      return
    }

    setContractLoading(true)
    setContractError(null)

    try {
      const ids = await fetchPrefeituraActiveContratoEspecialidadeIds(token)
      setContractedSpecialtyIds(ids)
      if (ids.length === 0) {
        setContractError('Nenhuma especialidade encontrada nos contratos ativos da entidade.')
      }
    } catch (error) {
      const message = isPrefeituraContratoApiError(error)
        ? error.message
        : 'Não foi possível carregar as especialidades contratadas.'
      setContractedSpecialtyIds([])
      setContractError(message)
    } finally {
      setContractLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (!enabled) {
      setContractLoading(false)
      return
    }
    void reloadContracts()
  }, [enabled, reloadContracts])

  const filtered = useMemo(
    () =>
      filterCatalogByContratoEspecialidades(
        catalogProfessions,
        catalogSpecialties,
        contractedSpecialtyIds,
      ),
    [catalogProfessions, catalogSpecialties, contractedSpecialtyIds],
  )

  const reload = useCallback(async () => {
    await Promise.all([reloadCatalog(), reloadContracts()])
  }, [reloadCatalog, reloadContracts])

  return {
    professions: filtered.professions,
    specialties: filtered.specialties,
    contractedSpecialtyIds,
    isLoading: catalogLoading || contractLoading,
    error: catalogError ?? contractError,
    reload,
  }
}
