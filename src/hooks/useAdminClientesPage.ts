import { useCallback, useEffect, useState } from 'react'
import type { AdminClienteRow, AdminClienteStatus } from '../types/adminClientes'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  fetchClientesEntidades,
  fetchClientesSummary,
  isAdminClientesApiError,
  type ClientesSummaryResponse,
} from '../lib/services/admin/clientes'

const SEARCH_DEBOUNCE_MS = 300

export function useAdminClientesPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [rows, setRows] = useState<AdminClienteRow[]>([])
  const [summary, setSummary] = useState<ClientesSummaryResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminClienteStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const [summaryData, entidades] = await Promise.all([
        fetchClientesSummary(token),
        fetchClientesEntidades(token, {
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
      ])
      setSummary(summaryData)
      setRows(entidades)
    } catch (error) {
      const message = isAdminClientesApiError(error)
        ? error.message
        : 'Não foi possível carregar os clientes.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, getAccessToken, statusFilter])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const upsertRow = useCallback((row: AdminClienteRow) => {
    setRows((current) => {
      const index = current.findIndex((item) => item.id === row.id)
      if (index < 0) return [row, ...current]
      const next = [...current]
      next[index] = row
      return next
    })
  }, [])

  const removeRow = useCallback((entidadeId: string) => {
    setRows((current) => current.filter((item) => item.id !== entidadeId))
  }, [])

  return {
    rows,
    setRows,
    upsertRow,
    removeRow,
    summary,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isLoading: isLoading || isBootstrapping,
    loadError,
    reload,
  }
}
