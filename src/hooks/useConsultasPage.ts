import { useCallback, useEffect, useRef, useState } from 'react'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import type {
  ConsultasGenderSlice,
  ConsultasSpecialtySlice,
  ConsultasStatusSlice,
  ConsultasSummary,
} from '../data/consultasMock'
import {
  fetchUbtConsultasOverview,
  isUbtConsultasApiError,
  type UbtConsultasOverviewApi,
} from '../lib/services/ubt/consultas'
import { getDefaultConsultasPeriod } from '../utils/consultasPeriod'

const emptySummary: ConsultasSummary = {
  total: 0,
  completed: 0,
  cancelled: 0,
  inProgress: 0,
}

const emptyOverview: UbtConsultasOverviewApi = {
  summary: emptySummary,
  avgDurationMinutes: null,
  statusDistribution: [] as ConsultasStatusSlice[],
  specialtyDistribution: [] as ConsultasSpecialtySlice[],
  genderDistribution: [] as ConsultasGenderSlice[],
  filterOptions: { specialties: [], doctors: [], neighborhoods: [] },
}

export function useConsultasOverview(periodStart: string, periodEnd: string) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useUbtAuth()
  const [overview, setOverview] = useState<UbtConsultasOverviewApi>(emptyOverview)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }

    if (hasLoadedRef.current) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const data = await fetchUbtConsultasOverview(token, periodStart, periodEnd)
      setOverview(data)
      hasLoadedRef.current = true
    } catch (error) {
      const message = isUbtConsultasApiError(error)
        ? error.message
        : 'Não foi possível carregar o resumo das consultas.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [getAccessToken, periodEnd, periodStart])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      setIsRefreshing(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  return { overview, isLoading, isRefreshing, loadError, reload }
}

export function useDefaultConsultasPeriod() {
  return getDefaultConsultasPeriod()
}
