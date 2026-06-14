import { useCallback, useEffect, useMemo, useState } from 'react'
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
import {
  readPortalPageCache,
  writePortalPageCache,
} from '../utils/portal/portalPageCache'
import { shouldBlockPortalPageWithCache } from '../utils/portal/portalPageLoading'

const ESCALA_CACHE_KEY = 'profissional:escala'

type EscalaPageCache = {
  availableShifts: ProfissionalEscalaDisponivel[]
  reservedShifts: ProfissionalEscalaDisponivel[]
  summary: ProfissionalEscalaSummaryApi | null
}

function escalaCacheKey(dateFrom?: string, dateTo?: string) {
  return `${ESCALA_CACHE_KEY}:${dateFrom ?? ''}:${dateTo ?? ''}`
}

type EscalaDateFilters = Pick<ProfissionalEscalaFilters, 'dateFrom' | 'dateTo'>

function resolveEscalaDateQuery(filters?: EscalaDateFilters) {
  const dateFrom = filters?.dateFrom?.trim() || undefined
  const dateTo = filters?.dateTo?.trim() || undefined
  return { dateFrom, dateTo }
}

export function useProfissionalEscalaPage(dateFilters?: EscalaDateFilters) {
  const { getAccessToken, isAuthenticated, isBootstrapping, user } = useProfissionalAuth()
  const [availableShifts, setAvailableShifts] = useState<ProfissionalEscalaDisponivel[]>(() => {
    return readPortalPageCache<EscalaPageCache>(escalaCacheKey())?.availableShifts ?? []
  })
  const [reservedShifts, setReservedShifts] = useState<ProfissionalEscalaDisponivel[]>(() => {
    return readPortalPageCache<EscalaPageCache>(escalaCacheKey())?.reservedShifts ?? []
  })
  const [summary, setSummary] = useState<ProfissionalEscalaSummaryApi | null>(() => {
    return readPortalPageCache<EscalaPageCache>(escalaCacheKey())?.summary ?? null
  })
  const [isLoading, setIsLoading] = useState(() => shouldBlockPortalPageWithCache(escalaCacheKey()))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const profileSpecialty = user?.specialty ?? ''
  const { dateFrom, dateTo } = resolveEscalaDateQuery(dateFilters)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    const cacheKey = escalaCacheKey(dateFrom, dateTo)
    const cached = readPortalPageCache<EscalaPageCache>(cacheKey)

    if (cached) {
      setAvailableShifts(cached.availableShifts)
      setReservedShifts(cached.reservedShifts)
      setSummary(cached.summary)
    }

    if (shouldBlockPortalPageWithCache(cacheKey)) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const [disponiveis, plantoes, summaryData] = await Promise.all([
        fetchProfissionalEscalaDisponiveis(token, { dateFrom, dateTo }),
        fetchProfissionalMeusPlantoes(token),
        fetchProfissionalEscalaSummary(token),
      ])

      const nextReserved = plantoes.map((plantao) => ({
        ...plantao,
        status: 'reservado_mim' as const,
      }))

      setAvailableShifts(normalizeProfissionalEscalaShifts(disponiveis))
      setReservedShifts(normalizeProfissionalEscalaShifts(nextReserved))
      setSummary(summaryData)
      writePortalPageCache(cacheKey, {
        availableShifts: normalizeProfissionalEscalaShifts(disponiveis),
        reservedShifts: normalizeProfissionalEscalaShifts(nextReserved),
        summary: summaryData,
      })
    } catch (error) {
      const message = isProfissionalEscalaApiError(error)
        ? error.message
        : 'Não foi possível carregar os plantões.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo, getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const claimShift = useCallback(
    async (slotId: string) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      setIsClaiming(true)
      try {
        await inscreverProfissionalEscalaSlot(token, slotId)
        await reload()
        return true
      } finally {
        setIsClaiming(false)
      }
    },
    [getAccessToken, reload],
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
        await reload()
        return true
      } finally {
        setIsCancelling(false)
      }
    },
    [getAccessToken, reload],
  )

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
    isLoading,
    loadError,
    isClaiming,
    isCancelling,
    reload,
    claimShift,
    cancelShift,
  }
}
