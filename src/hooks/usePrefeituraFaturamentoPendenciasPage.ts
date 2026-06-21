import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import {
  PENDENCIAS_PAGE_SIZE,
} from '../components/prefeitura/faturamento/pendencias/prefeituraFaturamentoPendenciasUi'
import type {
  PrefeituraFaturamentoPendencia,
  PrefeituraFaturamentoPendenciasCategoryTab,
  PrefeituraFaturamentoPendenciasFilters,
  PrefeituraFaturamentoPendenciasSummary,
} from '../types/prefeituraFaturamentoPendencias'
import type { PrefeituraFaturamentoCorrecaoPayload } from '../types/prefeituraFaturamentoCorrecao'
import {
  apiCorrigirPendencia,
  apiFetchCompetencias,
  apiFetchPendencias,
  apiIgnorarPendencia,
  apiReavaliarPendencia,
  apiRevalidarCompetenciaPendencias,
  apiSaveCnsPendencia,
  apiSolicitarCorrecaoClinica,
  isPrefeituraFaturamentoApiError,
} from '../lib/services/prefeitura/faturamento'

export type PrefeituraFaturamentoReavaliacaoResult = {
  ok: boolean
  message?: string
  errorReason?: string
}

function currentCompetenciaFallback() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const defaultPrefeituraFaturamentoPendenciasFilters: PrefeituraFaturamentoPendenciasFilters =
  {
    competencia: currentCompetenciaFallback(),
    unitId: 'all',
    professionalName: 'all',
    specialty: 'all',
    category: 'all',
    gravidade: 'all',
    status: 'all',
    search: '',
  }

const emptySummary: PrefeituraFaturamentoPendenciasSummary = {
  abertas: 0,
  bloqueantes: 0,
  avisos: 0,
  corrigidasHoje: 0,
  faturaveis: 0,
  competenciaLabel: '',
}

export function usePrefeituraFaturamentoPendenciasPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const [items, setItems] = useState<PrefeituraFaturamentoPendencia[]>([])
  const [allFilteredItems, setAllFilteredItems] = useState<PrefeituraFaturamentoPendencia[]>([])
  const [filters, setFilters] = useState(defaultPrefeituraFaturamentoPendenciasFilters)
  const [categoryTab, setCategoryTab] = useState<PrefeituraFaturamentoPendenciasCategoryTab>('todas')
  const [page, setPage] = useState(1)
  const [summary, setSummary] = useState(emptySummary)
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [filterOptions, setFilterOptions] = useState({
    competencias: [] as Array<{ value: string; label: string }>,
    units: [{ value: 'all', label: 'Unidade: Todas' }],
    professionals: [{ value: 'all', label: 'Profissional: Todos' }],
    specialties: [{ value: 'all', label: 'Especialidade: Todas' }],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<PrefeituraFaturamentoPendencia | null>(null)
  const [detailClosing, setDetailClosing] = useState(false)
  const [ignoreItem, setIgnoreItem] = useState<PrefeituraFaturamentoPendencia | null>(null)

  const staticFilterOptions = useMemo(
    () => ({
      categories: [
        { value: 'all', label: 'Tipo: Todos' },
        { value: 'paciente', label: 'Paciente' },
        { value: 'profissional', label: 'Profissional' },
        { value: 'consulta', label: 'Consulta' },
        { value: 'procedimento', label: 'Procedimento' },
      ],
      gravidades: [
        { value: 'all', label: 'Tipo: Todos' },
        { value: 'bloqueante', label: 'Impeditiva' },
        { value: 'aviso', label: 'Aviso' },
      ],
      statuses: [
        { value: 'all', label: 'Situação: Todas' },
        { value: 'aberta', label: 'Pendente' },
        { value: 'em_correcao', label: 'Em correção' },
        { value: 'aguardando_profissional', label: 'Aguardando profissional' },
        { value: 'corrigida', label: 'Corrigida' },
        { value: 'validada', label: 'Resolvida' },
        { value: 'ignorada', label: 'Ignorada' },
        { value: 'nao_faturavel', label: 'Não faturável' },
      ],
    }),
    [],
  )

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await apiFetchPendencias(token, {
        ...filters,
        categoryTab,
        page,
        pageSize: PENDENCIAS_PAGE_SIZE,
      })
      setItems(data.items)
      setAllFilteredItems(data.allItems ?? data.items)
      setSummary(data.summary)
      setTotalFiltered(data.totalFiltered)
      setTotalPages(data.totalPages)
      setFilterOptions((current) => ({
        ...current,
        competencias: data.filterOptions.competencias,
        units: data.filterOptions.units,
        professionals: data.filterOptions.professionals,
        specialties: data.filterOptions.specialties,
      }))
      setDetailItem((current) => {
        if (!current) return null
        return data.items.find((item) => item.id === current.id) ?? current
      })
    } catch (error) {
      const message = isPrefeituraFaturamentoApiError(error)
        ? error.message
        : 'Não foi possível carregar as pendências de faturamento.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [categoryTab, filters, getAccessToken, page])

  useEffect(() => {
    const token = getAccessToken()
    if (!token || isBootstrapping) return

    void apiFetchCompetencias(token)
      .then(({ competencias }) => {
        if (competencias.length === 0) return
        setFilters((current) =>
          competencias.includes(current.competencia)
            ? current
            : { ...current, competencia: competencias[0] },
        )
      })
      .catch(() => undefined)
  }, [getAccessToken, isBootstrapping])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const updateFilters = useCallback(
    (patch: Partial<PrefeituraFaturamentoPendenciasFilters>) => {
      setFilters((current) => ({ ...current, ...patch }))
      setPage(1)
    },
    [],
  )

  const updateItem = useCallback((id: string, patch: Partial<PrefeituraFaturamentoPendencia>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    setDetailItem((current) => (current?.id === id ? { ...current, ...patch } : current))
  }, [])

  const openDetail = useCallback((item: PrefeituraFaturamentoPendencia) => {
    setDetailClosing(false)
    setDetailItem(item)
  }, [])

  const closeDetail = useCallback(() => setDetailClosing(true), [])
  const finalizeDetailClose = useCallback(() => {
    setDetailItem(null)
    setDetailClosing(false)
  }, [])

  const markEmCorrecao = useCallback(
    (ids: string[], responsibleName = 'Você') => {
      setItems((current) =>
        current.map((item) =>
          ids.includes(item.id)
            ? { ...item, status: 'em_correcao', responsibleName, correctedAt: new Date().toISOString() }
            : item,
        ),
      )
    },
    [],
  )

  const saveCorrecaoAndRevalidate = useCallback(
    async (id: string, payload: PrefeituraFaturamentoCorrecaoPayload) => {
      const token = getAccessToken()
      if (!token) return
      await apiCorrigirPendencia(token, id, payload)
      await reload()
    },
    [getAccessToken, reload],
  )

  const requestClinicalCorrection = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      if (!token) return
      await apiSolicitarCorrecaoClinica(token, id)
      await reload()
    },
    [getAccessToken, reload],
  )

  const saveCnsCorrection = useCallback(
    async (id: string, cns: string) => {
      const digits = cns.replace(/\D/g, '')
      if (digits.length < 15) return false
      const token = getAccessToken()
      if (!token) return false
      await apiSaveCnsPendencia(token, id, digits)
      await reload()
      return true
    },
    [getAccessToken, reload],
  )

  const confirmIgnore = useCallback(
    async (id: string, justification: string) => {
      const token = getAccessToken()
      if (!token) return
      await apiIgnorarPendencia(token, id, justification)
      setIgnoreItem(null)
      await reload()
    },
    [getAccessToken, reload],
  )

  const revalidarCompetencia = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return
    await apiRevalidarCompetenciaPendencias(token, filters.competencia)
    await reload()
  }, [filters.competencia, getAccessToken, reload])

  const reavaliarElegibilidade = useCallback(
    async (id: string): Promise<PrefeituraFaturamentoReavaliacaoResult> => {
      const token = getAccessToken()
      if (!token) {
        return { ok: false, errorReason: 'Sessão expirada.' }
      }

      const result = await apiReavaliarPendencia(token, id)
      await reload()

      return {
        ok: result.ok,
        message: result.message,
        errorReason: result.errorReason,
      }
    },
    [getAccessToken, reload],
  )

  return {
    items,
    filters,
    filterOptions: {
      ...filterOptions,
      ...staticFilterOptions,
    },
    categoryTab,
    setCategoryTab: (tab: PrefeituraFaturamentoPendenciasCategoryTab) => {
      setCategoryTab(tab)
      setPage(1)
    },
    updateFilters,
    summary,
    filteredItems: allFilteredItems,
    paginatedItems: items,
    page,
    setPage,
    pageSize: PENDENCIAS_PAGE_SIZE,
    totalFiltered,
    totalPages,
    isLoading,
    loadError,
    reload,
    markEmCorrecao,
    revalidarCompetencia,
    reavaliarElegibilidade,
    saveCnsCorrection,
    saveCorrecaoAndRevalidate,
    requestClinicalCorrection,
    detailItem,
    detailClosing,
    openDetail,
    closeDetail,
    finalizeDetailClose,
    ignoreItem,
    setIgnoreItem,
    confirmIgnore,
    updateItem,
  }
}
