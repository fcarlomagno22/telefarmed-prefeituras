import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOptionalPrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { useOptionalUbtAuth } from '../contexts/UbtAuthContext'
import {
  downloadPrefeituraRelatorioCsv,
  fetchPrefeituraRelatorioData,
  fetchPrefeituraRelatorioMeta,
  isPrefeituraRelatoriosApiError,
} from '../lib/mockServices/prefeitura/relatorios'
import {
  downloadUbtRelatorioCsv,
  fetchUbtRelatorioData,
  fetchUbtRelatorioMeta,
  isUbtRelatoriosApiError,
} from '../lib/mockServices/ubt/relatorios'
import type { RelatorioMeta, RelatoriosFiltersInput, RelatoriosPortal } from '../types/relatorios'

const DEFAULT_FILTERS: RelatoriosFiltersInput = {
  periodStart: '',
  periodEnd: '',
  unit: 'all',
  operator: 'all',
  station: 'all',
  specialty: 'all',
  status: 'all',
  generalSearch: '',
}

export function useRelatoriosCategoryPage(portal: RelatoriosPortal, categoryId: string) {
  const ubtAuth = useOptionalUbtAuth()
  const prefeituraAuth = useOptionalPrefeituraAuth()

  const getAccessToken = useCallback(() => {
    if (portal === 'ubt') return ubtAuth?.getAccessToken() ?? null
    return prefeituraAuth?.getAccessToken() ?? null
  }, [portal, prefeituraAuth, ubtAuth])

  const isAuthenticated =
    portal === 'ubt' ? (ubtAuth?.isAuthenticated ?? false) : (prefeituraAuth?.isAuthenticated ?? false)

  const isBootstrapping =
    portal === 'ubt' ? (ubtAuth?.isBootstrapping ?? true) : (prefeituraAuth?.isBootstrapping ?? true)

  const [meta, setMeta] = useState<RelatorioMeta | null>(null)
  const [draftFilters, setDraftFilters] = useState<RelatoriosFiltersInput>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<RelatoriosFiltersInput>(DEFAULT_FILTERS)
  const [rows, setRows] = useState<Record<string, string | number | null>[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 1 })
  const [kpis, setKpis] = useState<Array<{ key: string; label: string; value: string; suffix: string }>>([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) {
      setIsLoadingMeta(false)
      return
    }

    const token = getAccessToken()
    if (!token) {
      setIsLoadingMeta(false)
      return
    }

    setIsLoadingMeta(true)
    void (async () => {
      try {
        const loadedMeta =
          portal === 'ubt'
            ? await fetchUbtRelatorioMeta(token, categoryId)
            : await fetchPrefeituraRelatorioMeta(token, categoryId)
        setMeta(loadedMeta)
        const initialFilters: RelatoriosFiltersInput = {
          ...DEFAULT_FILTERS,
          periodStart: loadedMeta.defaultPeriod.start,
          periodEnd: loadedMeta.defaultPeriod.end,
        }
        setDraftFilters(initialFilters)
        setAppliedFilters(initialFilters)
        setLoadError(null)
      } catch (error) {
        const message =
          portal === 'ubt'
            ? isUbtRelatoriosApiError(error)
              ? error.message
              : 'Não foi possível carregar os filtros do relatório.'
            : isPrefeituraRelatoriosApiError(error)
              ? error.message
              : 'Não foi possível carregar os filtros do relatório.'
        setLoadError(message)
      } finally {
        setIsLoadingMeta(false)
      }
    })()
  }, [categoryId, getAccessToken, isAuthenticated, isBootstrapping, portal])

  const reloadData = useCallback(
    async (filters: RelatoriosFiltersInput) => {
      const token = getAccessToken()
      if (!token) return

      setIsLoadingData(true)
      try {
        const data =
          portal === 'ubt'
            ? await fetchUbtRelatorioData(token, categoryId, filters)
            : await fetchPrefeituraRelatorioData(token, categoryId, filters)
        setRows(data.rows)
        setPagination(data.pagination)
        setKpis(data.kpis)
        setLoadError(null)
      } catch (error) {
        const message =
          portal === 'ubt'
            ? isUbtRelatoriosApiError(error)
              ? error.message
              : 'Não foi possível carregar os dados do relatório.'
            : isPrefeituraRelatoriosApiError(error)
              ? error.message
              : 'Não foi possível carregar os dados do relatório.'
        setLoadError(message)
      } finally {
        setIsLoadingData(false)
      }
    },
    [categoryId, getAccessToken, portal],
  )

  useEffect(() => {
    if (isLoadingMeta || !meta) return
    void reloadData({ ...appliedFilters, generalSearch: draftFilters.generalSearch })
  }, [appliedFilters, draftFilters.generalSearch, isLoadingMeta, meta, reloadData])

  const updateDraft = useCallback(
    <K extends keyof RelatoriosFiltersInput>(key: K, value: RelatoriosFiltersInput[K]) => {
      setDraftFilters((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...draftFilters, page: 1 })
  }, [draftFilters])

  const clearFilters = useCallback(() => {
    if (!meta) return
    const reset: RelatoriosFiltersInput = {
      ...DEFAULT_FILTERS,
      periodStart: meta.defaultPeriod.start,
      periodEnd: meta.defaultPeriod.end,
    }
    setDraftFilters(reset)
    setAppliedFilters(reset)
  }, [meta])

  const setPage = useCallback(
    (page: number) => {
      const next = { ...appliedFilters, page }
      setAppliedFilters(next)
    },
    [appliedFilters],
  )

  const exportCsv = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return
    const filters = { ...appliedFilters, generalSearch: draftFilters.generalSearch }
    if (portal === 'ubt') {
      await downloadUbtRelatorioCsv(token, categoryId, filters)
    } else {
      await downloadPrefeituraRelatorioCsv(token, categoryId, filters)
    }
  }, [appliedFilters, categoryId, draftFilters.generalSearch, getAccessToken, portal])

  const fetchAllRows = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return []
    const filters = { ...appliedFilters, generalSearch: draftFilters.generalSearch, all: true }
    const data =
      portal === 'ubt'
        ? await fetchUbtRelatorioData(token, categoryId, filters)
        : await fetchPrefeituraRelatorioData(token, categoryId, filters)
    return data.rows
  }, [appliedFilters, categoryId, draftFilters.generalSearch, getAccessToken, portal])

  const exportRows = useMemo(
    () => rows,
    [rows],
  )

  return {
    meta,
    draftFilters,
    appliedFilters,
    rows: exportRows,
    pagination,
    kpis,
    isLoadingMeta,
    isLoadingData,
    loadError,
    updateDraft,
    applyFilters,
    clearFilters,
    setPage,
    exportCsv,
    fetchAllRows,
    reloadData,
  }
}
