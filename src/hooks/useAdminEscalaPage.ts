import { useCallback, useEffect, useMemo, useState } from 'react'
import { cancelAdminEscalaPlantao } from '../lib/services/admin/escala'
import type { AdminEscalaShift } from '../types/adminEscala'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { useAdminPageAccess } from './useAdminPageAccess'
import { getAdminEscalaCatalog, setAdminEscalaCatalog } from '../data/adminEscalaCatalog'
import {
  acceptAdminEscalaInscricao,
  deleteAdminEscalaShifts,
  fetchAdminEscalaCatalog,
  fetchAdminEscalaInscricoes,
  fetchAdminEscalaShifts,
  fetchAdminEscalaSummary,
  isAdminEscalaApiError,
  rejectAdminEscalaInscricao,
  saveAdminEscalaBatch,
  type BatchSavePayload,
  type EscalaInscricaoApi,
  type EscalaSummaryApi,
} from '../lib/services/admin/escala'
import {
  buildAdminEscalaMarketplaceQuery,
  marketplaceNeedsClientFilter,
} from '../utils/escala/buildAdminEscalaMarketplaceQuery'
import {
  defaultAdminEscalaOpenFilters,
  filterAdminEscalaShifts,
  type AdminEscalaOpenFilters,
} from '../utils/escala/filterAdminEscalaOpenShifts'
import { normalizeAdminEscalaShifts } from '../utils/escala/normalizeAdminEscalaShift'

export function useAdminEscalaPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const { pageAccess } = useAdminPageAccess('gestaoEscala')

  const [shifts, setShifts] = useState<AdminEscalaShift[]>([])
  const [marketplaceShifts, setMarketplaceShifts] = useState<AdminEscalaShift[]>([])
  const [marketplaceFilters, setMarketplaceFilters] = useState<AdminEscalaOpenFilters>(() =>
    defaultAdminEscalaOpenFilters(),
  )
  const [pendingInscricoes, setPendingInscricoes] = useState<EscalaInscricaoApi[]>([])
  const [summary, setSummary] = useState<EscalaSummaryApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarketplaceLoading, setIsMarketplaceLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadMarketplaceShifts = useCallback(
    async (filters: AdminEscalaOpenFilters) => {
      const token = getAccessToken()
      if (!token) return

      setIsMarketplaceLoading(true)
      setMarketplaceFilters(filters)

      try {
        const catalog = getAdminEscalaCatalog()
        const query = buildAdminEscalaMarketplaceQuery(filters, catalog)
        const rows = await fetchAdminEscalaShifts(token, query)
        const normalized = normalizeAdminEscalaShifts(rows)
        setMarketplaceShifts(
          marketplaceNeedsClientFilter(filters)
            ? filterAdminEscalaShifts(normalized, filters)
            : normalized,
        )
      } catch (error) {
        const message = isAdminEscalaApiError(error)
          ? error.message
          : 'Não foi possível filtrar os plantões.'
        setLoadError(message)
      } finally {
        setIsMarketplaceLoading(false)
      }
    },
    [getAccessToken],
  )

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const [shiftsData, summaryData, catalogData, inscricoesData] = await Promise.all([
        fetchAdminEscalaShifts(token),
        fetchAdminEscalaSummary(token),
        fetchAdminEscalaCatalog(token),
        fetchAdminEscalaInscricoes(token, { status: 'pendente' }),
      ])

      setShifts(normalizeAdminEscalaShifts(shiftsData))
      setSummary(summaryData)
      setAdminEscalaCatalog(catalogData)
      setPendingInscricoes(inscricoesData)
    } catch (error) {
      const message = isAdminEscalaApiError(error)
        ? error.message
        : 'Não foi possível carregar a gestão de escala.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      setAdminEscalaCatalog(null)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const saveBatch = useCallback(
    async (payload: BatchSavePayload) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      const result = await saveAdminEscalaBatch(token, payload)
      await reload()
      return result
    },
    [getAccessToken, reload],
  )

  const deleteShifts = useCallback(
    async (shiftIds: string[]) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      const result = await deleteAdminEscalaShifts(token, shiftIds)
      await reload()
      return result
    },
    [getAccessToken, reload],
  )

  const suspendShifts = useCallback(
    async (shiftIds: string[], motivoCancelamento = 'Suspenso pelo administrador.') => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      for (const shiftId of [...new Set(shiftIds)]) {
        await cancelAdminEscalaPlantao(token, shiftId, motivoCancelamento)
      }
      await reload()
    },
    [getAccessToken, reload],
  )

  const acceptInscricao = useCallback(
    async (inscricaoId: string) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      await acceptAdminEscalaInscricao(token, inscricaoId)
      await reload()
    },
    [getAccessToken, reload],
  )

  const rejectInscricao = useCallback(
    async (inscricaoId: string, motivoRejeicao: string) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      await rejectAdminEscalaInscricao(token, inscricaoId, motivoRejeicao)
      await reload()
    },
    [getAccessToken, reload],
  )

  const specialtyFilterOptions = useMemo(() => {
    const specialties = getAdminEscalaCatalog()?.specialties ?? []
    const active = specialties.filter((item) => item.active)
    const source = active.length > 0 ? active : specialties
    return [
      { value: 'all', label: 'Especialidade: Todas' },
      ...source.map((item) => ({ value: item.name, label: item.name })),
    ]
  }, [shifts, summary])

  return {
    shifts,
    marketplaceShifts,
    marketplaceFilters,
    pendingInscricoes,
    summary,
    isLoading,
    isMarketplaceLoading,
    loadError,
    reload,
    loadMarketplaceShifts,
    saveBatch,
    deleteShifts,
    suspendShifts,
    acceptInscricao,
    rejectInscricao,
    specialtyFilterOptions,
    canView: pageAccess.canView,
    canInsert: pageAccess.canInsert,
    canEdit: pageAccess.canEdit,
    canDelete: pageAccess.canDelete,
  }
}
