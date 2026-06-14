import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import type {
  AdminCandidaturaDocumentStatus,
  AdminProfissionalCandidatura,
} from '../types/adminProfissionais'
import {
  approveCandidatura,
  fetchCandidaturaDetail,
  fetchCandidaturasRows,
  fetchCandidaturasSummary,
  isAdminProfissionaisApiError,
  rejectCandidatura,
  requestCandidaturaCorrection,
  reviewCandidaturaDocument,
  type CandidaturasSummaryResponse,
} from '../lib/services/admin/profissionais'

export function useAdminProfissionaisPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [rows, setRows] = useState<AdminProfissionalCandidatura[]>([])
  const [summary, setSummary] = useState<CandidaturasSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const hasLoadedOnceRef = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350)
    return () => window.clearTimeout(timer)
  }, [search])

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    if (!hasLoadedOnceRef.current) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const [summaryData, rowsData] = await Promise.all([
        fetchCandidaturasSummary(token),
        fetchCandidaturasRows(token, { search: debouncedSearch, status: statusFilter }),
      ])
      setSummary(summaryData)
      setRows(rowsData)
      hasLoadedOnceRef.current = true
    } catch (error) {
      const message = isAdminProfissionaisApiError(error)
        ? error.message
        : 'Não foi possível carregar as candidaturas.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, debouncedSearch, statusFilter])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      hasLoadedOnceRef.current = false
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const upsertRow = useCallback((row: AdminProfissionalCandidatura) => {
    setRows((current) => current.map((item) => (item.id === row.id ? row : item)))
  }, [])

  const loadDetail = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      if (!token) return null
      const detail = await fetchCandidaturaDetail(token, id)
      upsertRow(detail)
      return detail
    },
    [getAccessToken, upsertRow],
  )

  const reviewDocument = useCallback(
    async (
      candidaturaId: string,
      documentoId: string,
      status: AdminCandidaturaDocumentStatus,
      motivoReprovacao?: string,
    ) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const updated = await reviewCandidaturaDocument(token, candidaturaId, documentoId, {
        status,
        motivoReprovacao,
      })
      upsertRow(updated)
      return updated
    },
    [getAccessToken, upsertRow],
  )

  const approve = useCallback(
    async (candidaturaId: string) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const result = await approveCandidatura(token, candidaturaId)
      upsertRow(result.candidatura)
      return result
    },
    [getAccessToken, upsertRow],
  )

  const reject = useCallback(
    async (candidaturaId: string, motivo: string) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const updated = await rejectCandidatura(token, candidaturaId, motivo)
      upsertRow(updated)
      return updated
    },
    [getAccessToken, upsertRow],
  )

  const requestCorrection = useCallback(
    async (candidaturaId: string, mensagem: string, documentoIds: string[]) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const updated = await requestCandidaturaCorrection(token, candidaturaId, {
        mensagem,
        documentoIds,
      })
      upsertRow(updated)
      return updated
    },
    [getAccessToken, upsertRow],
  )

  const candidaturasPendentes = useMemo(() => {
    if (summary) return summary.pendente + summary.em_analise + summary.incompleto
    return rows.filter(
      (row) =>
        row.status === 'pendente' || row.status === 'em_analise' || row.status === 'incompleto',
    ).length
  }, [rows, summary])

  return {
    rows,
    summary,
    isLoading,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    reload,
    loadDetail,
    reviewDocument,
    approve,
    reject,
    requestCorrection,
    upsertRow,
    candidaturasPendentes,
  }
}
