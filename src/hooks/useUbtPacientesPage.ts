import { useCallback, useEffect, useState } from 'react'
import type {
  NetworkUser,
  NetworkUsersAbout,
  networkUsersSummary,
} from '../data/networkUsersMock'
import { useOptionalUbtLgpd } from '../contexts/UbtLgpdContext'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtPacientesFiltros,
  fetchUbtPacientesRows,
  fetchUbtPacientesSummary,
  isUbtPacientesApiError,
  type ListUbtPacientesParams,
  type UbtPacientesFiltrosResponse,
} from '../lib/services/ubt/pacientes'
import {
  defaultNetworkUsersFilters,
  type NetworkUsersFilters,
} from '../utils/networkUsersFilters'

const PAGE_SIZE = 20

function mapGender(filters: NetworkUsersFilters): ListUbtPacientesParams['gender'] {
  if (filters.gender === 'Feminino') return 'feminino'
  if (filters.gender === 'Masculino') return 'masculino'
  return 'all'
}

function mapLastAppointment(filters: NetworkUsersFilters): ListUbtPacientesParams['lastAppointment'] {
  if (filters.lastAppointment === 'inactive') return 'inactive'
  if (filters.lastAppointment === 'never') return 'never'
  if (filters.lastAppointment === 'all') return 'all'
  return filters.lastAppointment
}

function mapTotalAppointments(
  filters: NetworkUsersFilters,
): ListUbtPacientesParams['totalAppointments'] {
  if (filters.totalAppointments === 'all') return 'all'
  return filters.totalAppointments
}

function mapDataQuality(filters: NetworkUsersFilters): ListUbtPacientesParams['dataQuality'] {
  if (filters.incompleteData.length > 0) return 'incomplete'
  return 'all'
}

function buildListParams(
  filters: NetworkUsersFilters,
  search: string,
  page: number,
): ListUbtPacientesParams {
  return {
    search,
    page,
    pageSize: PAGE_SIZE,
    bairros: filters.neighborhoods,
    gender: mapGender(filters),
    ageGroup: filters.ageGroup,
    newUsers: filters.newUsers,
    lastAppointment: mapLastAppointment(filters),
    totalAppointments: mapTotalAppointments(filters),
    incompleteData: filters.incompleteData,
    dataQuality: mapDataQuality(filters),
    registrationUnits: filters.registrationUnits,
    recentActivityOnly: filters.recentActivityOnly || undefined,
    sortBy: filters.sortBy,
  }
}

export function useUbtPacientesPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping, user } = useUbtAuth()
  const lgpd = useOptionalUbtLgpd()
  const [users, setUsers] = useState<NetworkUser[]>([])
  const [summary, setSummary] = useState<typeof networkUsersSummary | null>(null)
  const [about, setAbout] = useState<NetworkUsersAbout | null>(null)
  const [filtros, setFiltros] = useState<UbtPacientesFiltrosResponse | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<NetworkUsersFilters>(defaultNetworkUsersFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const filtrosData = await fetchUbtPacientesFiltros(token)
      const [summaryData, listData] = await Promise.all([
        fetchUbtPacientesSummary(token),
        fetchUbtPacientesRows(token, buildListParams(filters, search, page)),
      ])

      setSummary(summaryData.summary)
      setAbout(summaryData.about)
      setFiltros(filtrosData)
      setUsers(listData.rows)
      setPagination({
        page: listData.page,
        pageSize: listData.pageSize,
        total: listData.total,
        totalPages: listData.totalPages,
      })
    } catch (error) {
      const message = isUbtPacientesApiError(error)
        ? error.message
        : 'Não foi possível carregar os pacientes.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters, getAccessToken, page, search])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated || !lgpd) return
    void reload()
  }, [isAuthenticated, isBootstrapping, lgpd, lgpd?.sensitiveDataUnlocked, reload])

  const availableNeighborhoods = filtros?.bairros ?? []
  const availableRegistrationUnits = filtros?.registrationUnits ?? []

  const handleSetPage = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handleSetSearch = useCallback((value: string) => {
    setPage(1)
    setSearch(value)
  }, [])

  const handleSetFilters = useCallback((value: NetworkUsersFilters) => {
    setPage(1)
    setFilters(value)
  }, [])

  return {
    users,
    summary,
    about,
    filtros,
    pagination,
    search,
    setSearch: handleSetSearch,
    filters,
    setFilters: handleSetFilters,
    availableNeighborhoods,
    availableRegistrationUnits,
    unitLabel: user?.unidadeUbtNome ?? 'Unidade UBT',
    isLoading,
    loadError,
    reload,
    setPage: handleSetPage,
    sensitiveDataUnlocked: lgpd?.sensitiveDataUnlocked ?? false,
  }
}
