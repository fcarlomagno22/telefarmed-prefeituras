import { useCallback, useEffect, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  fetchPrefeituraConsultasOverview,
  fetchPrefeituraConsultasUnitDetail,
  isPrefeituraConsultasApiError,
  type PrefeituraConsultasOverviewApi,
  type PrefeituraConsultasUnitDetailApi,
} from '../lib/services/prefeitura/consultas'
import { getDefaultPrefeituraConsultasPeriod } from '../utils/consultasPeriod'

export function usePrefeituraConsultasPage(
  periodStart: string,
  periodEnd: string,
  unitFilter: string,
  regionFilter: string,
) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [overview, setOverview] = useState<PrefeituraConsultasOverviewApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await fetchPrefeituraConsultasOverview(token, {
        periodStart,
        periodEnd,
        unidadeUbtId:
          unitFilter && unitFilter !== 'todas' ? unitFilter : undefined,
        regionKey: regionFilter && regionFilter !== 'todas' ? regionFilter : undefined,
      })
      setOverview(data)
    } catch (error) {
      const message = isPrefeituraConsultasApiError(error)
        ? error.message
        : 'Não foi possível carregar as consultas municipais.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, periodEnd, periodStart, regionFilter, unitFilter])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const loadUnitDetail = useCallback(
    async (unitId: string): Promise<PrefeituraConsultasUnitDetailApi | null> => {
      const token = getAccessToken()
      if (!token) return null
      try {
        return await fetchPrefeituraConsultasUnitDetail(token, unitId, periodStart, periodEnd)
      } catch {
        return null
      }
    },
    [getAccessToken, periodEnd, periodStart],
  )

  return { overview, isLoading, loadError, reload, loadUnitDetail }
}

export function useDefaultPrefeituraConsultasPeriod() {
  return getDefaultPrefeituraConsultasPeriod()
}
