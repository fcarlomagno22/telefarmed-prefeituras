import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import type {
  ProfissionalCompetenceClosure,
  ProfissionalBillingShift,
  ProfissionalPrestadorEmpresa,
} from '../types/profissionalFinanceiro'
import type {
  ProfissionalFinanceiroRepasse,
  ProfissionalFinanceiroRepasseDetail,
  ProfissionalFinanceiroSummary,
  UpdateProfissionalFinanceiroDadosPagamentoInput,
} from '../types/profissionalFinanceiroApi'
import {
  fetchProfissionalFinanceiroDadosPagamento,
  fetchProfissionalFinanceiroRepasseDetail,
  fetchProfissionalFinanceiroRepasses,
  fetchProfissionalFinanceiroSummary,
  isProfissionalFinanceiroApiError,
  submitProfissionalFinanceiroFechamento,
  updateProfissionalFinanceiroDadosPagamento,
} from '../lib/services/profissional/financeiro'
import type { ProfissionalFinanceiroStats } from '../utils/profissional/computeProfissionalFinanceiroStats'
import {
  dadosPagamentoToEmpresa,
  extratoToBillingShifts,
  fechamentoApiToClosure,
  forecastRowsFromRepasses,
  mergeClosureWithFechamento,
  repassesToClosures,
  resolveCompetenceBounds,
  statsFromBillingShifts,
} from '../utils/profissional/mapProfissionalFinanceiroApi'
import { competenceKeyFromDate } from '../utils/profissional/profissionalCompetence'
import { queryClient as globalQueryClient } from '../lib/query/client'
import { queryKeys } from '../lib/query/keys'
import { PORTAL_PAGE_GC_MS, PORTAL_PAGE_STALE_MS } from '../lib/query/timings'

type FinanceiroBaseCache = {
  summary: ProfissionalFinanceiroSummary
  repasses: ProfissionalFinanceiroRepasse[]
  empresa: ProfissionalPrestadorEmpresa
}

export function readDefaultProfissionalFinanceiroCompetenceKey(): string {
  const repasses =
    globalQueryClient.getQueryData<FinanceiroBaseCache>(queryKeys.profissionalFinanceiroBase())
      ?.repasses ?? []
  if (repasses.length === 0) return ''

  const current = competenceKeyFromDate(new Date())
  const bounds = resolveCompetenceBounds(repasses)
  if (bounds.length === 0) return current
  if (current < bounds[0]) return bounds[0]
  if (current > bounds[bounds.length - 1]) return bounds[bounds.length - 1]
  return current
}

export function useProfissionalFinanceiroPage(competenceKey: string) {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useProfissionalAuth()
  const queryClient = useQueryClient()
  const [isSavingPagamento, setIsSavingPagamento] = useState(false)
  const [isSavingFechamento, setIsSavingFechamento] = useState(false)

  const baseQuery = useQuery({
    queryKey: queryKeys.profissionalFinanceiroBase(),
    queryFn: async (): Promise<FinanceiroBaseCache> => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      const [summaryData, repassesData, dadosPagamento] = await Promise.all([
        fetchProfissionalFinanceiroSummary(token),
        fetchProfissionalFinanceiroRepasses(token, { limit: 120 }),
        fetchProfissionalFinanceiroDadosPagamento(token),
      ])

      return {
        summary: summaryData,
        repasses: repassesData,
        empresa: dadosPagamentoToEmpresa(dadosPagamento),
      }
    },
    enabled: isAuthenticated && !isBootstrapping,
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  const detailQuery = useQuery({
    queryKey: queryKeys.profissionalFinanceiroDetail(competenceKey),
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')
      return fetchProfissionalFinanceiroRepasseDetail(token, competenceKey)
    },
    enabled: isAuthenticated && !isBootstrapping && Boolean(competenceKey),
    staleTime: PORTAL_PAGE_STALE_MS,
    gcTime: PORTAL_PAGE_GC_MS,
  })

  const summary = baseQuery.data?.summary ?? null
  const repasses = baseQuery.data?.repasses ?? []
  const empresa = baseQuery.data?.empresa ?? null
  const detail = detailQuery.data ?? null

  const competenceBounds = useMemo(() => resolveCompetenceBounds(repasses), [repasses])

  const closures = useMemo(() => {
    const base = repassesToClosures(repasses)
    if (detail?.fechamento) {
      return mergeClosureWithFechamento(base, detail.fechamento)
    }
    return base
  }, [repasses, detail?.fechamento])

  const monthShifts = useMemo(
    (): ProfissionalBillingShift[] =>
      detail ? extratoToBillingShifts(detail.extrato, competenceKey) : [],
    [detail, competenceKey],
  )

  const stats = useMemo((): ProfissionalFinanceiroStats => {
    if (monthShifts.length > 0) {
      return statsFromBillingShifts(monthShifts)
    }
    const repasse = repasses.find((r) => r.competencia === competenceKey)
    if (repasse) {
      return {
        totalShifts: repasse.qtdConsultas + (repasse.qtdPrevistas ?? 0),
        realizedCount: repasse.qtdConsultas,
        scheduledCount: repasse.qtdPrevistas ?? 0,
        canceledCount: 0,
        forecastCents: repasse.valorCentavos,
        potentialCents: repasse.valorCentavos + (repasse.valorPrevistoCentavos ?? 0),
      }
    }
    return {
      totalShifts: 0,
      realizedCount: 0,
      scheduledCount: 0,
      canceledCount: 0,
      forecastCents: 0,
      potentialCents: 0,
    }
  }, [monthShifts, repasses, competenceKey])

  const forecastRows = useMemo(() => forecastRowsFromRepasses(repasses), [repasses])

  const reloadBase = useCallback(async () => {
    await baseQuery.refetch()
  }, [baseQuery])

  const reloadDetail = useCallback(async () => {
    await detailQuery.refetch()
  }, [detailQuery])

  const saveDadosPagamento = useCallback(
    async (payload: UpdateProfissionalFinanceiroDadosPagamentoInput) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      setIsSavingPagamento(true)
      try {
        const dados = await updateProfissionalFinanceiroDadosPagamento(token, payload)
        const nextEmpresa = dadosPagamentoToEmpresa(dados)
        queryClient.setQueryData<FinanceiroBaseCache>(
          queryKeys.profissionalFinanceiroBase(),
          (current) =>
            current
              ? { ...current, empresa: nextEmpresa }
              : {
                  summary: {} as ProfissionalFinanceiroSummary,
                  repasses: [],
                  empresa: nextEmpresa,
                },
        )
        return dados
      } finally {
        setIsSavingPagamento(false)
      }
    },
    [getAccessToken, queryClient],
  )

  const submitFechamento = useCallback(
    async (
      competencia: string,
      payload: {
        invoiceFile: File
        pixKeyType: string
        pixKey: string
        onUploadProgress?: (percent: number) => void
      },
    ) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      setIsSavingFechamento(true)
      try {
        const fechamento = await submitProfissionalFinanceiroFechamento(token, competencia, payload)

        queryClient.setQueryData<FinanceiroBaseCache>(
          queryKeys.profissionalFinanceiroBase(),
          (current) =>
            current
              ? {
                  ...current,
                  repasses: current.repasses.map((repasse) =>
                    repasse.competencia === competencia
                      ? { ...repasse, status: 'processando' as const }
                      : repasse,
                  ),
                }
              : current,
        )

        queryClient.setQueryData<ProfissionalFinanceiroRepasseDetail>(
          queryKeys.profissionalFinanceiroDetail(competencia),
          (current) =>
            current && current.competencia === competencia
              ? { ...current, status: 'processando', fechamento }
              : current,
        )

        return fechamentoApiToClosure(fechamento)
      } finally {
        setIsSavingFechamento(false)
      }
    },
    [getAccessToken, queryClient],
  )

  const handleClosureChange = useCallback((_updated: ProfissionalCompetenceClosure) => {
    // Tour/demo: estado local; produção persiste via submitFechamento.
  }, [])

  const defaultCompetenceKey = useMemo(() => {
    const current = competenceKeyFromDate(new Date())
    const bounds = competenceBounds.length > 0 ? competenceBounds : [current]
    if (current < bounds[0]) return bounds[0]
    if (current > bounds[bounds.length - 1]) return bounds[bounds.length - 1]
    return current
  }, [competenceBounds])

  const loadError = baseQuery.isError
    ? isProfissionalFinanceiroApiError(baseQuery.error)
      ? baseQuery.error.message
      : 'Não foi possível carregar o financeiro.'
    : detailQuery.isError
      ? isProfissionalFinanceiroApiError(detailQuery.error)
        ? detailQuery.error.message
        : 'Não foi possível carregar a competência.'
      : null

  return {
    summary,
    repasses,
    detail,
    empresa,
    closures,
    competenceBounds,
    defaultCompetenceKey,
    monthShifts,
    stats,
    forecastRows,
    isLoading: baseQuery.isPending,
    isDetailLoading: detailQuery.isPending && !detail,
    loadError,
    isSavingPagamento,
    isSavingFechamento,
    reload: reloadBase,
    reloadDetail,
    saveDadosPagamento,
    submitFechamento,
    handleClosureChange,
  }
}
