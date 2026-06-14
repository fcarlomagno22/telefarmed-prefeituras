import { useCallback, useEffect, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import type { DonutSlice } from '../components/credenciais/CredentialDonutChart'
import type { PrefeituraRedeUnit } from '../data/prefeituraRedeMock'
import {
  fetchPrefeituraRedeOverview,
  fetchPrefeituraRedeUnitDetail,
  fetchPrefeituraRedeUnits,
  isPrefeituraRedeApiError,
  mapApiUnitToRedeUnit,
  mapOverviewDonutSlices,
  mapOverviewKpisToCards,
  type PrefeituraRedeUnitDetailApi,
} from '../lib/services/prefeitura/rede'

export function usePrefeituraRedePage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [units, setUnits] = useState<PrefeituraRedeUnit[]>([])
  const [kpiCards, setKpiCards] = useState<KpiStatCardItem[]>([])
  const [regionSlices, setRegionSlices] = useState<DonutSlice[]>([])
  const [stationStatusSlices, setStationStatusSlices] = useState<DonutSlice[]>([])
  const [regionFilterOptions, setRegionFilterOptions] = useState<
    Array<{ value: string; label: string }>
  >([{ value: 'todas', label: 'Todas as regiões' }])
  const [statusFilterOptions, setStatusFilterOptions] = useState<
    Array<{ value: string; label: string }>
  >([{ value: 'todas', label: 'Todos os status' }])
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
      const [overview, unitRows] = await Promise.all([
        fetchPrefeituraRedeOverview(token),
        fetchPrefeituraRedeUnits(token),
      ])

      setKpiCards(mapOverviewKpisToCards(overview.kpis))
      setRegionSlices(mapOverviewDonutSlices(overview.regionSlices))
      setStationStatusSlices(mapOverviewDonutSlices(overview.stationStatusSlices))
      setRegionFilterOptions(overview.filterOptions.regions)
      setStatusFilterOptions(overview.filterOptions.statuses)
      setUnits(unitRows.map(mapApiUnitToRedeUnit))
    } catch (error) {
      const message = isPrefeituraRedeApiError(error)
        ? error.message
        : 'Não foi possível carregar a rede de UBTs.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const loadUnitDetail = useCallback(
    async (unitId: string): Promise<PrefeituraRedeUnitDetailApi | null> => {
      const token = getAccessToken()
      if (!token) return null
      try {
        return await fetchPrefeituraRedeUnitDetail(token, unitId)
      } catch {
        return null
      }
    },
    [getAccessToken],
  )

  return {
    units,
    kpiCards,
    regionSlices,
    stationStatusSlices,
    regionFilterOptions,
    statusFilterOptions,
    isLoading,
    loadError,
    reload,
    loadUnitDetail,
  }
}
