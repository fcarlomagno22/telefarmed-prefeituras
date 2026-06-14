import { useCallback, useEffect, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  fetchPrefeituraContratoAtivo,
  fetchPrefeituraContratoById,
  fetchPrefeituraContratos,
  isPrefeituraContratoApiError,
  mapApiContratoToRecord,
} from '../lib/services/prefeitura/contrato'
import type {
  PrefeituraContratoEspecialidade,
  PrefeituraContratoOption,
  PrefeituraContratoRecord,
  PrefeituraContratoUtilizacao,
} from '../types/prefeituraContrato'
import type { PrefeituraPackageUsageView } from '../utils/prefeituraConsultationPackage'

export function usePrefeituraContratoPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [contractOptions, setContractOptions] = useState<PrefeituraContratoOption[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [contract, setContract] = useState<PrefeituraContratoRecord | null>(null)
  const [utilizacao, setUtilizacao] = useState<PrefeituraContratoUtilizacao | null>(null)
  const [packageUsage, setPackageUsage] = useState<PrefeituraPackageUsageView | null>(null)
  const [especialidades, setEspecialidades] = useState<PrefeituraContratoEspecialidade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isContractLoading, setIsContractLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const applyContratoDetail = useCallback(
    (mapped: ReturnType<typeof mapApiContratoToRecord>, contratoId: string) => {
      setContract(mapped.record)
      setUtilizacao(mapped.utilizacao)
      setEspecialidades(mapped.especialidades)
      setPackageUsage(mapped.packageUsage ?? null)
      setSelectedContractId(contratoId)
    },
    [],
  )

  const loadContractDetail = useCallback(
    async (contratoId: string) => {
      const token = getAccessToken()
      if (!token) return

      setIsContractLoading(true)
      setLoadError(null)

      try {
        const detail = await fetchPrefeituraContratoById(token, contratoId)
        applyContratoDetail(mapApiContratoToRecord(detail), contratoId)
      } catch (error) {
        const message = isPrefeituraContratoApiError(error)
          ? error.message
          : 'Não foi possível carregar o contrato.'
        setLoadError(message)
      } finally {
        setIsContractLoading(false)
      }
    },
    [applyContratoDetail, getAccessToken],
  )

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const [options, active] = await Promise.all([
        fetchPrefeituraContratos(token),
        fetchPrefeituraContratoAtivo(token),
      ])

      setContractOptions(options)

      if (active) {
        applyContratoDetail(mapApiContratoToRecord(active), active.id)
      } else if (options.length > 0) {
        await loadContractDetail(options[0].id)
      } else {
        setContract(null)
        setUtilizacao(null)
        setPackageUsage(null)
        setEspecialidades([])
        setSelectedContractId(null)
      }
    } catch (error) {
      const message = isPrefeituraContratoApiError(error)
        ? error.message
        : 'Não foi possível carregar os contratos.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [applyContratoDetail, getAccessToken, loadContractDetail])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const selectContract = useCallback(
    (contratoId: string) => {
      if (contratoId === selectedContractId) return
      void loadContractDetail(contratoId)
    },
    [loadContractDetail, selectedContractId],
  )

  return {
    contractOptions,
    selectedContractId,
    contract,
    utilizacao,
    packageUsage,
    especialidades,
    isLoading,
    isContractLoading,
    loadError,
    reload,
    selectContract,
  }
}
