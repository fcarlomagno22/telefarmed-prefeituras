import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  computeMockPrefeituraPackageUsage,
  fetchPrefeituraDashboardOverview,
  isPrefeituraDashboardApiError,
  mapOverviewToDashboardView,
  type PrefeituraDashboardView,
} from '../lib/services/prefeitura/dashboard'
import { fetchPrefeituraUtilizacaoCiclo } from '../lib/services/prefeitura/contrato'
import { fetchPrefeituraRedeUnitDetail } from '../lib/services/prefeitura/rede'
import { isBackendApiEnabled } from '../lib/api/config'

export function usePrefeituraDashboardPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [period, setPeriod] = useState('hoje')
  const [region, setRegion] = useState('todas')
  const [ubt, setUbt] = useState('todas')
  const [dashboard, setDashboard] = useState<PrefeituraDashboardView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const filterKey = `${period}-${region}-${ubt}`

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const overview = await fetchPrefeituraDashboardOverview(token, {
        period,
        regionKey: region,
        unidadeUbtId: ubt !== 'todas' ? ubt : undefined,
      })
      const view = mapOverviewToDashboardView(overview, filterKey)
      const packageUsage = isBackendApiEnabled()
        ? await fetchPrefeituraUtilizacaoCiclo(token, {
            regionKey: region !== 'todas' ? region : undefined,
            unidadeUbtId: ubt !== 'todas' ? ubt : undefined,
          })
        : computeMockPrefeituraPackageUsage({
            period,
            regionKey: region,
            unidadeUbtId: ubt !== 'todas' ? ubt : undefined,
          })

      setDashboard({ ...view, packageUsage })
    } catch (error) {
      const message = isPrefeituraDashboardApiError(error)
        ? error.message
        : 'Não foi possível carregar o dashboard.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, period, region, ubt, filterKey])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const ubtFilterOptions = useMemo(() => {
    if (dashboard?.filterOptions.ubt) return dashboard.filterOptions.ubt
    return [{ value: 'todas', label: 'Todas as UBTs' }]
  }, [dashboard?.filterOptions.ubt])

  useEffect(() => {
    if (ubt === 'todas') return
    if (!ubtFilterOptions.some((option) => option.value === ubt)) {
      setUbt('todas')
    }
  }, [ubt, ubtFilterOptions])

  const loadUnitDetail = useCallback(
    async (unitId: string) => {
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
    period,
    setPeriod,
    region,
    setRegion,
    ubt,
    setUbt,
    dashboard,
    isLoading,
    loadError,
    reload,
    ubtFilterOptions,
    loadUnitDetail,
    filterOptions: dashboard?.filterOptions ?? {
      period: [
        { value: 'hoje', label: 'Hoje' },
        { value: '7d', label: 'Últimos 7 dias' },
        { value: '30d', label: 'Últimos 30 dias' },
      ],
      region: [{ value: 'todas', label: 'Todas' }],
      ubt: [{ value: 'todas', label: 'Todas as UBTs' }],
    },
  }
}
