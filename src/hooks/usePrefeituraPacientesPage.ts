import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  PrefeituraMunicipalPatient,
  PrefeituraMunicipalPatientsAbout,
} from '../data/prefeituraMunicipalPatientsMock'
import type { PrefeituraMunicipalPatientDetail } from '../types/prefeituraPacientes'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  fetchPrefeituraPacienteById,
  fetchPrefeituraPacientesFiltros,
  fetchPrefeituraPacientesRows,
  fetchPrefeituraPacientesSummary,
  isPrefeituraPacientesApiError,
  updatePrefeituraPaciente,
  type PrefeituraPacientesFiltrosResponse,
  type PrefeituraPacientesSummaryResponse,
  type UpdatePacientePayload,
} from '../lib/services/prefeitura/pacientes'
import {
  applyPrefeituraMunicipalPatientsFilters,
  defaultPrefeituraMunicipalPatientsFilters,
  type PrefeituraMunicipalPatientsFilters,
} from '../utils/prefeituraMunicipalPatientsFilters'
import type { NetworkUserFilterContext } from '../utils/networkUsersFilters'

const PAGE_SIZE = 20

function mapSortBy(filters: PrefeituraMunicipalPatientsFilters) {
  switch (filters.sortBy) {
    case 'name_desc':
      return 'name_desc' as const
    case 'name_asc':
      return 'name_asc' as const
    default:
      return undefined
  }
}

function mapDataQuality(filters: PrefeituraMunicipalPatientsFilters) {
  if (filters.incompleteData.length > 0) return 'incomplete' as const
  return 'all' as const
}

function resolveUnidadeUbtIds(
  unitNames: string[],
  filtros: PrefeituraPacientesFiltrosResponse | null,
) {
  if (!filtros || unitNames.length === 0) return []
  const byName = new Map(filtros.ubts.map((ubt) => [ubt.nome, ubt.id]))
  return unitNames.map((name) => byName.get(name)).filter((id): id is string => Boolean(id))
}

export function usePrefeituraPacientesPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [patients, setPatients] = useState<PrefeituraMunicipalPatient[]>([])
  const [summary, setSummary] = useState<PrefeituraPacientesSummaryResponse | null>(null)
  const [about, setAbout] = useState<PrefeituraMunicipalPatientsAbout | null>(null)
  const [filtros, setFiltros] = useState<PrefeituraPacientesFiltrosResponse | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<PrefeituraMunicipalPatientsFilters>(
    defaultPrefeituraMunicipalPatientsFilters,
  )
  const [filterContext] = useState<NetworkUserFilterContext>({
    userEditsMap: {},
    annotationsMap: {},
    lastReviewedMap: {},
    contactLogsMap: {},
    changeLogsMap: {},
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const filtrosData = await fetchPrefeituraPacientesFiltros(token)
      const [summaryData, listData] = await Promise.all([
        fetchPrefeituraPacientesSummary(token),
        fetchPrefeituraPacientesRows(token, {
          search,
          page,
          pageSize: PAGE_SIZE,
          unidadeUbtIds: resolveUnidadeUbtIds(filters.firstAttendanceUnits, filtrosData),
          bairros: filters.neighborhoods,
          inactiveConsultation: filters.inactiveConsultation,
          dataQuality: mapDataQuality(filters),
          sortBy: mapSortBy(filters),
        }),
      ])

      setSummary(summaryData.summary)
      setAbout(summaryData.about)
      setFiltros(filtrosData)
      setPatients(listData.rows)
      setPagination({
        page: listData.page,
        pageSize: listData.pageSize,
        total: listData.total,
        totalPages: listData.totalPages,
      })
    } catch (error) {
      const message = isPrefeituraPacientesApiError(error)
        ? error.message
        : 'Não foi possível carregar os pacientes.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [
    filters.firstAttendanceUnits,
    filters.inactiveConsultation,
    filters.incompleteData.length,
    filters.neighborhoods,
    filters.sortBy,
    getAccessToken,
    page,
    search,
  ])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const filteredPatients = useMemo(
    () => applyPrefeituraMunicipalPatientsFilters(patients, filters, filterContext),
    [patients, filters, filterContext],
  )

  const availableNeighborhoods = useMemo(
    () => filtros?.bairros ?? [],
    [filtros?.bairros],
  )

  const availableFirstUnits = useMemo(
    () => filtros?.ubts.map((ubt) => ubt.nome) ?? [],
    [filtros?.ubts],
  )

  const handleSetPage = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handleSetSearch = useCallback((value: string) => {
    setPage(1)
    setSearch(value)
  }, [])

  const handleSetFilters = useCallback((value: PrefeituraMunicipalPatientsFilters) => {
    setPage(1)
    setFilters(value)
  }, [])

  const upsertPatient = useCallback((patient: PrefeituraMunicipalPatient) => {
    setPatients((current) => {
      const index = current.findIndex((item) => item.id === patient.id)
      if (index < 0) return [patient, ...current]
      const next = [...current]
      next[index] = { ...next[index], ...patient }
      return next
    })
  }, [])

  const loadPatientDetail = useCallback(
    async (id: string): Promise<PrefeituraMunicipalPatientDetail | null> => {
      const token = getAccessToken()
      if (!token) return null

      try {
        const detail = await fetchPrefeituraPacienteById(token, id)
        upsertPatient(detail)
        return detail
      } catch {
        return null
      }
    },
    [getAccessToken, upsertPatient],
  )

  const savePatientEdits = useCallback(
    async (id: string, payload: UpdatePacientePayload) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }
      const detail = await updatePrefeituraPaciente(token, id, payload)
      upsertPatient(detail)
      return detail
    },
    [getAccessToken, upsertPatient],
  )

  return {
    patients: filteredPatients,
    summary,
    about,
    filtros,
    pagination,
    search,
    setSearch: handleSetSearch,
    filters,
    setFilters: handleSetFilters,
    availableNeighborhoods,
    availableFirstUnits,
    isLoading,
    loadError,
    reload,
    setPage: handleSetPage,
    loadPatientDetail,
    savePatientEdits,
    upsertPatient,
  }
}
