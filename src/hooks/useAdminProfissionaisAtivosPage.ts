import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import type { AdminDoctor } from '../types/adminMedicos'
import {
  createProfissionalAtivo,
  fetchAtivosSummary,
  fetchProfissionaisAtivosRows,
  fetchProfissionalAtivoDetail,
  inactivateProfissionalAtivo,
  isAdminProfissionaisAtivosApiError,
  reactivateProfissionalAtivo,
  updateProfissionalAtivo,
  type AtivosSummaryResponse,
} from '../lib/services/admin/profissionaisAtivos'

const SEARCH_DEBOUNCE_MS = 300

export function useAdminProfissionaisAtivosPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [doctors, setDoctors] = useState<AdminDoctor[]>([])
  const [summary, setSummary] = useState<AtivosSummaryResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [allocationFilter, setAllocationFilter] = useState<'all' | 'nacional' | 'por_contrato'>(
    'all',
  )
  const [professionFilter, setProfessionFilter] = useState<
    'all' | 'Médicos' | 'Psicólogos' | 'Nutricionistas' | 'Fonoaudiólogos'
  >('all')
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
      const listParams = {
        search: debouncedSearch || undefined,
        status: 'all' as const,
        allocation: allocationFilter,
        profession: professionFilter,
      }
      const [summaryData, rows] = await Promise.all([
        fetchAtivosSummary(token),
        fetchProfissionaisAtivosRows(token, listParams),
      ])
      setSummary(summaryData)
      setDoctors(rows)
    } catch (error) {
      const message = isAdminProfissionaisAtivosApiError(error)
        ? error.message
        : 'Não foi possível carregar os profissionais.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [allocationFilter, debouncedSearch, getAccessToken, professionFilter])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const upsertDoctor = useCallback((doctor: AdminDoctor) => {
    setDoctors((current) => current.map((item) => (item.id === doctor.id ? doctor : item)))
  }, [])

  const addDoctor = useCallback((doctor: AdminDoctor) => {
    setDoctors((current) => [doctor, ...current])
  }, [])

  const loadDetail = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      if (!token) return null
      const detail = await fetchProfissionalAtivoDetail(token, id)
      upsertDoctor(detail)
      return detail
    },
    [getAccessToken, upsertDoctor],
  )

  const saveDoctor = useCallback(
    async (doctor: AdminDoctor) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const updated = await updateProfissionalAtivo(token, doctor.id, {
        phone: doctor.phone,
        specialty: doctor.specialty,
        onCallLabel: doctor.onCallLabel,
      })
      upsertDoctor(updated)
      const summaryData = await fetchAtivosSummary(token)
      setSummary(summaryData)
      return updated
    },
    [getAccessToken, upsertDoctor],
  )

  const inactivateDoctor = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const updated = await inactivateProfissionalAtivo(token, id)
      upsertDoctor(updated)
      const summaryData = await fetchAtivosSummary(token)
      setSummary(summaryData)
      return updated
    },
    [getAccessToken, upsertDoctor],
  )

  const reactivateDoctor = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const updated = await reactivateProfissionalAtivo(token, id)
      upsertDoctor(updated)
      const summaryData = await fetchAtivosSummary(token)
      setSummary(summaryData)
      return updated
    },
    [getAccessToken, upsertDoctor],
  )

  const createDoctor = useCallback(
    async (payload: Record<string, unknown>) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      const created = await createProfissionalAtivo(token, payload)
      await reload()
      return created
    },
    [getAccessToken, reload],
  )

  return {
    doctors,
    summary,
    searchQuery,
    setSearchQuery,
    allocationFilter,
    setAllocationFilter,
    professionFilter,
    setProfessionFilter,
    isLoading,
    loadError,
    reload,
    loadDetail,
    saveDoctor,
    inactivateDoctor,
    reactivateDoctor,
    createDoctor,
    upsertDoctor,
  }
}
