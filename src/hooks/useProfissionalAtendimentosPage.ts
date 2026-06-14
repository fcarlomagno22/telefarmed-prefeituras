import { useCallback, useEffect, useState } from 'react'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import {
  fetchProfissionalAtendimentosList,
  isProfissionalAtendimentosApiError,
} from '../lib/services/profissional/atendimentos'
import type {
  ProfissionalAttendanceRecord,
  ProfissionalAtendimentosFilters,
} from '../types/profissionalAtendimentos'
import { defaultProfissionalAtendimentosFilters } from '../utils/profissional/filterProfissionalAtendimentos'
import { getDefaultProfissionalAtendimentosPeriod } from '../utils/consultasPeriod'
import {
  readPortalPageCache,
  writePortalPageCache,
} from '../utils/portal/portalPageCache'
import { shouldBlockPortalPageWithCache } from '../utils/portal/portalPageLoading'

const defaultPeriod = getDefaultProfissionalAtendimentosPeriod()

type AtendimentosPageCache = {
  records: ProfissionalAttendanceRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

function atendimentosCacheKey(
  filters: ProfissionalAtendimentosFilters,
  page: number,
  pageSize: number,
) {
  return `profissional:atendimentos:${JSON.stringify({ filters, page, pageSize })}`
}

export function useProfissionalAtendimentosPage(
  filters: ProfissionalAtendimentosFilters,
  page: number,
  pageSize = 10,
) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()
  const cacheKey = atendimentosCacheKey(filters, page, pageSize)
  const cached = readPortalPageCache<AtendimentosPageCache>(cacheKey)

  const [records, setRecords] = useState<ProfissionalAttendanceRecord[]>(cached?.records ?? [])
  const [pagination, setPagination] = useState(
    cached?.pagination ?? {
      page: 1,
      pageSize,
      total: 0,
      totalPages: 1,
    },
  )
  const [isLoading, setIsLoading] = useState(shouldBlockPortalPageWithCache(cacheKey))
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    if (shouldBlockPortalPageWithCache(cacheKey)) {
      setIsLoading(true)
    }
    setLoadError(null)
    try {
      const result = await fetchProfissionalAtendimentosList(token, filters, page, pageSize)
      setRecords(result.records)
      setPagination(result.pagination)
      writePortalPageCache(cacheKey, {
        records: result.records,
        pagination: result.pagination,
      })
    } catch (error) {
      const message = isProfissionalAtendimentosApiError(error)
        ? error.message
        : 'Não foi possível carregar os atendimentos.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey, filters, getAccessToken, page, pageSize])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  return { records, pagination, isLoading, loadError, reload }
}

export function createDefaultProfissionalAtendimentosFilters(): ProfissionalAtendimentosFilters {
  return {
    ...defaultProfissionalAtendimentosFilters,
    periodStart: defaultPeriod.start,
    periodEnd: defaultPeriod.end,
  }
}
