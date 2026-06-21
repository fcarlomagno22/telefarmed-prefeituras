import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import type { ProfissionalEscalaDisponivel } from '../types/profissionalEscalaDisponivel'
import type { ProfissionalEscalaFilters } from '../types/profissionalEscalaDisponivel'
import {
  cancelarProfissionalEscalaInscricao,
  cancelarProfissionalEscalaPlantao,
  fetchProfissionalEscalaDisponiveis,
  fetchProfissionalEscalaSummary,
  fetchProfissionalMeusPlantoes,
  inscreverProfissionalEscalaSlot,
  isProfissionalEscalaApiError,
  type ProfissionalEscalaSummaryApi,
} from '../lib/services/profissional/escala'
import { normalizeProfissionalEscalaShifts } from '../utils/profissional/normalizeProfissionalEscalaShift'
import { filterPlantoesAtivosParaProfissional } from '../utils/profissional/profissionalPlantaoEncerrado'
import { queryKeys } from '../lib/query/keys'
import { PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS } from '../lib/query/timings'

type EscalaPageCache = {
  availableShifts: ProfissionalEscalaDisponivel[]
  reservedShifts: ProfissionalEscalaDisponivel[]
  summary: ProfissionalEscalaSummaryApi | null
}

type EscalaDateFilters = Pick<ProfissionalEscalaFilters, 'dateFrom' | 'dateTo'>

function resolveEscalaDateQuery(filters?: EscalaDateFilters) {
  const dateFrom = filters?.dateFrom?.trim() || undefined
  const dateTo = filters?.dateTo?.trim() || undefined
  return { dateFrom, dateTo }
}

async function fetchEscalaPage(
  token: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<EscalaPageCache> {
  const [disponiveis, plantoes, summaryData] = await Promise.all([
    fetchProfissionalEscalaDisponiveis(token, { dateFrom, dateTo }),
    fetchProfissionalMeusPlantoes(token),
    fetchProfissionalEscalaSummary(token),
  ])

  const nextReserved = plantoes.map((plantao) => ({
    ...plantao,
    status: 'reservado_mim' as const,
  }))

  const activeDisponiveis = filterPlantoesAtivosParaProfissional(disponiveis)
  const activeReserved = filterPlantoesAtivosParaProfissional(nextReserved)

  return {
    availableShifts: normalizeProfissionalEscalaShifts(activeDisponiveis),
    reservedShifts: normalizeProfissionalEscalaShifts(activeReserved),
    summary: summaryData,
  }
}

export function useProfissionalEscalaPage(dateFilters?: EscalaDateFilters) {
  const { getAccessToken, isAuthenticated, isBootstrapping, user } = useProfissionalAuth()
  const queryClient = useQueryClient()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const profileSpecialty = user?.specialty ?? ''
  const { dateFrom, dateTo } = resolveEscalaDateQuery(dateFilters)

  const query = useQuery({
    queryKey: queryKeys.profissionalEscala(dateFrom, dateTo),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchEscalaPage(token, dateFrom, dateTo)
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  const reload = useCallback(async () => {
    await query.refetch()
  }, [query])

  const claimShift = useCallback(
    async (slotId: string) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      setIsClaiming(true)
      try {
        await inscreverProfissionalEscalaSlot(token, slotId)
        await queryClient.invalidateQueries({ queryKey: queryKeys.profissionalEscala() })
        return true
      } finally {
        setIsClaiming(false)
      }
    },
    [getAccessToken, queryClient],
  )

  const cancelShift = useCallback(
    async (shift: ProfissionalEscalaDisponivel) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      setIsCancelling(true)
      try {
        if (shift.plantaoId) {
          await cancelarProfissionalEscalaPlantao(token, shift.plantaoId)
        } else if (shift.inscricaoId) {
          await cancelarProfissionalEscalaInscricao(token, shift.inscricaoId)
        } else {
          throw new Error('Não foi possível identificar a reserva para cancelamento.')
        }
        await queryClient.invalidateQueries({ queryKey: queryKeys.profissionalEscala() })
        return true
      } finally {
        setIsCancelling(false)
      }
    },
    [getAccessToken, queryClient],
  )

  const availableShifts = query.data?.availableShifts ?? []
  const reservedShifts = query.data?.reservedShifts ?? []
  const summary = query.data?.summary ?? null

  const allShiftsForKpi = useMemo(
    () => [...availableShifts, ...reservedShifts],
    [availableShifts, reservedShifts],
  )

  return {
    user,
    profileSpecialty,
    availableShifts,
    reservedShifts,
    allShiftsForKpi,
    summary,
    isLoading: query.isPending,
    loadError: query.isError
      ? isProfissionalEscalaApiError(query.error)
        ? query.error.message
        : 'Não foi possível carregar os plantões.'
      : null,
    isClaiming,
    isCancelling,
    reload,
    claimShift,
    cancelShift,
  }
}
