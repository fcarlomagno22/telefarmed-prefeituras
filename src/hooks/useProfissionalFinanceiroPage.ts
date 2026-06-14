import { useCallback, useEffect, useMemo, useState } from 'react'
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
import {
  readPortalPageCache,
  writePortalPageCache,
} from '../utils/portal/portalPageCache'
import { shouldBlockPortalPageWithCache } from '../utils/portal/portalPageLoading'

const FINANCEIRO_BASE_CACHE_KEY = 'profissional:financeiro:base'

type FinanceiroBaseCache = {
  summary: ProfissionalFinanceiroSummary
  repasses: ProfissionalFinanceiroRepasse[]
  empresa: ProfissionalPrestadorEmpresa
}

type FinanceiroDetailCache = Record<string, ProfissionalFinanceiroRepasseDetail>

export function readDefaultProfissionalFinanceiroCompetenceKey(): string {
  const repasses =
    readPortalPageCache<FinanceiroBaseCache>(FINANCEIRO_BASE_CACHE_KEY)?.repasses ?? []
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

  const [summary, setSummary] = useState<ProfissionalFinanceiroSummary | null>(() => {
    return readPortalPageCache<FinanceiroBaseCache>(FINANCEIRO_BASE_CACHE_KEY)?.summary ?? null
  })
  const [repasses, setRepasses] = useState<ProfissionalFinanceiroRepasse[]>(() => {
    return readPortalPageCache<FinanceiroBaseCache>(FINANCEIRO_BASE_CACHE_KEY)?.repasses ?? []
  })
  const [detail, setDetail] = useState<ProfissionalFinanceiroRepasseDetail | null>(() => {
    if (!competenceKey) return null
    const details =
      readPortalPageCache<FinanceiroDetailCache>('profissional:financeiro:details') ?? {}
    return details[competenceKey] ?? null
  })
  const [empresa, setEmpresa] = useState<ProfissionalPrestadorEmpresa | null>(() => {
    return readPortalPageCache<FinanceiroBaseCache>(FINANCEIRO_BASE_CACHE_KEY)?.empresa ?? null
  })
  const [isLoading, setIsLoading] = useState(
    shouldBlockPortalPageWithCache(FINANCEIRO_BASE_CACHE_KEY),
  )
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSavingPagamento, setIsSavingPagamento] = useState(false)
  const [isSavingFechamento, setIsSavingFechamento] = useState(false)

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
    const token = getAccessToken()
    if (!token) return

    if (shouldBlockPortalPageWithCache(FINANCEIRO_BASE_CACHE_KEY)) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const [summaryData, repassesData, dadosPagamento] = await Promise.all([
        fetchProfissionalFinanceiroSummary(token),
        fetchProfissionalFinanceiroRepasses(token, { limit: 120 }),
        fetchProfissionalFinanceiroDadosPagamento(token),
      ])

      const nextEmpresa = dadosPagamentoToEmpresa(dadosPagamento)
      setSummary(summaryData)
      setRepasses(repassesData)
      setEmpresa(nextEmpresa)
      writePortalPageCache(FINANCEIRO_BASE_CACHE_KEY, {
        summary: summaryData,
        repasses: repassesData,
        empresa: nextEmpresa,
      })
    } catch (error) {
      const message = isProfissionalFinanceiroApiError(error)
        ? error.message
        : 'Não foi possível carregar o financeiro.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  const reloadDetail = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !competenceKey) return

    const cachedDetail = readPortalPageCache<FinanceiroDetailCache>(
      'profissional:financeiro:details',
    )?.[competenceKey]

    if (cachedDetail) {
      setDetail(cachedDetail)
    } else {
      setIsDetailLoading(true)
    }

    try {
      const detailData = await fetchProfissionalFinanceiroRepasseDetail(token, competenceKey)
      setDetail(detailData)
      const details =
        readPortalPageCache<FinanceiroDetailCache>('profissional:financeiro:details') ?? {}
      writePortalPageCache('profissional:financeiro:details', {
        ...details,
        [competenceKey]: detailData,
      })
    } catch (error) {
      const message = isProfissionalFinanceiroApiError(error)
        ? error.message
        : 'Não foi possível carregar a competência.'
      setLoadError(message)
    } finally {
      setIsDetailLoading(false)
    }
  }, [competenceKey, getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reloadBase()
  }, [isAuthenticated, isBootstrapping, reloadBase])

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) return
    void reloadDetail()
  }, [competenceKey, isAuthenticated, isBootstrapping, reloadDetail])

  const saveDadosPagamento = useCallback(
    async (payload: UpdateProfissionalFinanceiroDadosPagamentoInput) => {
      const token = getAccessToken()
      if (!token) throw new Error('Sessão expirada.')

      setIsSavingPagamento(true)
      try {
        const dados = await updateProfissionalFinanceiroDadosPagamento(token, payload)
        setEmpresa(dadosPagamentoToEmpresa(dados))
        return dados
      } finally {
        setIsSavingPagamento(false)
      }
    },
    [getAccessToken],
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

        setRepasses((prev) =>
          prev.map((repasse) =>
            repasse.competencia === competencia
              ? { ...repasse, status: 'processando' as const }
              : repasse,
          ),
        )

        setDetail((prev) => {
          if (!prev || prev.competencia !== competencia) return prev
          return {
            ...prev,
            status: 'processando',
            fechamento,
          }
        })

        const baseCache = readPortalPageCache<FinanceiroBaseCache>(FINANCEIRO_BASE_CACHE_KEY)
        if (baseCache) {
          writePortalPageCache(FINANCEIRO_BASE_CACHE_KEY, {
            ...baseCache,
            repasses: baseCache.repasses.map((repasse) =>
              repasse.competencia === competencia
                ? { ...repasse, status: 'processando' as const }
                : repasse,
            ),
          })
        }

        const details =
          readPortalPageCache<FinanceiroDetailCache>('profissional:financeiro:details') ?? {}
        const cachedDetail = details[competencia]
        if (cachedDetail) {
          writePortalPageCache('profissional:financeiro:details', {
            ...details,
            [competencia]: {
              ...cachedDetail,
              status: 'processando',
              fechamento,
            },
          })
        }

        return fechamentoApiToClosure(fechamento)
      } finally {
        setIsSavingFechamento(false)
      }
    },
    [getAccessToken],
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
    isLoading,
    isDetailLoading,
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
