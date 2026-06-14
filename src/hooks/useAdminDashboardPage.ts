import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  fetchAdminDashboardOverview,
  isAdminDashboardApiError,
  mapOverviewToAdminDashboardView,
  type AdminDashboardFiltersParams,
} from '../lib/services/admin/dashboard'
import type { AdminDashboardView } from '../utils/adminDashboardFilters'

export function useAdminDashboardPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [filters, setFilters] = useState<AdminDashboardFiltersParams>({
    period: 'hoje',
    state: 'all',
    city: 'all',
    contract: 'all',
    health: 'all',
  })
  const [dashboard, setDashboard] = useState<AdminDashboardView | null>(null)
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
      const overview = await fetchAdminDashboardOverview(token, filters)
      setDashboard(mapOverviewToAdminDashboardView(overview))
    } catch (error) {
      const message = isAdminDashboardApiError(error)
        ? error.message
        : 'Não foi possível carregar o dashboard.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const setPeriod = useCallback((period: string) => {
    setFilters((current) => ({ ...current, period }))
  }, [])

  const setState = useCallback((state: string) => {
    setFilters((current) => ({ ...current, state, city: 'all' }))
  }, [])

  const setCity = useCallback((city: string) => {
    setFilters((current) => ({ ...current, city }))
  }, [])

  const setContract = useCallback((contract: string) => {
    setFilters((current) => ({ ...current, contract }))
  }, [])

  const setHealth = useCallback((health: string) => {
    setFilters((current) => ({ ...current, health }))
  }, [])

  return {
    dashboard,
    filters,
    isLoading,
    loadError,
    reload,
    setPeriod,
    setState,
    setCity,
    setContract,
    setHealth,
  }
}
