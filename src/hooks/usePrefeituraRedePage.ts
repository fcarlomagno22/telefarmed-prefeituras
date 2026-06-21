import { useCallback } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'
import type { DonutSlice } from '../components/credenciais/CredentialDonutChart'
import type { PrefeituraRedeUnit } from '../data/prefeituraRedeMock'
import {
  fetchPrefeituraRedeUnitDetail,
  mapApiUnitToRedeUnit,
  mapOverviewDonutSlices,
  mapOverviewKpisToCards,
  type PrefeituraRedeUnitDetailApi,
} from '../lib/services/prefeitura/rede'
import {
  getPrefeituraRedeQueryErrorMessage,
  useInvalidatePrefeituraRedeQueries,
  usePrefeituraRedeOverviewQuery,
  usePrefeituraRedeUnitsQuery,
} from '../lib/query/prefeituraRedeQueries'

export function usePrefeituraRedePage() {
  const { getAccessToken, isBootstrapping } = usePrefeituraAuth()
  const unitsQuery = usePrefeituraRedeUnitsQuery()
  const overviewQuery = usePrefeituraRedeOverviewQuery()
  const invalidateRedeQueries = useInvalidatePrefeituraRedeQueries()

  const units: PrefeituraRedeUnit[] = (unitsQuery.data ?? []).map(mapApiUnitToRedeUnit)
  const overview = overviewQuery.data

  const kpiCards: KpiStatCardItem[] = overview
    ? mapOverviewKpisToCards(overview.kpis)
    : []
  const regionSlices: DonutSlice[] = overview
    ? mapOverviewDonutSlices(overview.regionSlices)
    : []
  const stationStatusSlices: DonutSlice[] = overview
    ? mapOverviewDonutSlices(overview.stationStatusSlices)
    : []
  const regionFilterOptions = overview?.filterOptions.regions ?? [
    { value: 'todas', label: 'Todas as regiões' },
  ]
  const statusFilterOptions = overview?.filterOptions.statuses ?? [
    { value: 'todas', label: 'Todos os status' },
  ]

  const isLoading =
    isBootstrapping || unitsQuery.isPending || overviewQuery.isPending
  const loadError =
    unitsQuery.isError
      ? getPrefeituraRedeQueryErrorMessage(unitsQuery.error)
      : overviewQuery.isError
        ? getPrefeituraRedeQueryErrorMessage(overviewQuery.error)
        : null

  const reload = useCallback(async () => {
    invalidateRedeQueries()
  }, [invalidateRedeQueries])

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
