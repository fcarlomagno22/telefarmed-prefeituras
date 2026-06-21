import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { resolveDefaultRecordId } from '../components/prefeitura/faturamento/fechamento/prefeituraFaturamentoComplementoUi'
import { usePrefeituraAuth } from './PrefeituraAuthContext'
import {
  apiFetchCompetencias,
  apiFetchFechamentoOverview,
  isPrefeituraFaturamentoApiError,
  type FechamentoOverviewResponse,
} from '../lib/services/prefeitura/faturamento'
import type {
  PrefeituraFaturamentoFechamentoLoteItem,
  PrefeituraFaturamentoFechamentoRecord,
  PrefeituraFaturamentoFechamentoSummary,
} from '../types/prefeituraFaturamentoFechamento'

type PrefeituraFaturamentoFechamentoContextValue = {
  records: PrefeituraFaturamentoFechamentoRecord[]
  loteItems: PrefeituraFaturamentoFechamentoLoteItem[]
  summary: PrefeituraFaturamentoFechamentoSummary | null
  selectedCompetencia: string
  selectedFechamentoRecordId: string
  setSelectedCompetencia: (competencia: string) => void
  setSelectedFechamentoRecordId: (recordId: string) => void
  openFechamentoView: (competencia: string, recordId: string) => void
  applyOverview: (overview: FechamentoOverviewResponse) => void
  reloadOverview: (competencia?: string) => Promise<void>
  isLoading: boolean
  loadError: string | null
}

const PrefeituraFaturamentoFechamentoContext =
  createContext<PrefeituraFaturamentoFechamentoContextValue | null>(null)

function currentCompetenciaFallback() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function PrefeituraFaturamentoFechamentoProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, isAuthenticated, isBootstrapping, user } = usePrefeituraAuth()
  const [records, setRecords] = useState<PrefeituraFaturamentoFechamentoRecord[]>([])
  const [loteItems, setLoteItems] = useState<PrefeituraFaturamentoFechamentoLoteItem[]>([])
  const [summary, setSummary] = useState<PrefeituraFaturamentoFechamentoSummary | null>(null)
  const [selectedCompetencia, setSelectedCompetenciaState] = useState(currentCompetenciaFallback())
  const [selectedFechamentoRecordId, setSelectedFechamentoRecordId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const applyOverview = useCallback((overview: FechamentoOverviewResponse) => {
    setRecords(overview.records)
    setLoteItems(overview.loteItems)
    setSummary(overview.summary)
    if (overview.competencia) {
      setSelectedCompetenciaState(overview.competencia)
    }
    setSelectedFechamentoRecordId((current) => {
      if (current && overview.records.some((record) => record.id === current)) {
        return current
      }
      return resolveDefaultRecordId(
        overview.records,
        overview.competencia,
        user?.entidadeContratanteId,
      )
    })
  }, [user?.entidadeContratanteId])

  const reloadOverview = useCallback(
    async (competencia?: string) => {
      const token = getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const overview = await apiFetchFechamentoOverview(token, competencia ?? selectedCompetencia)
        applyOverview(overview)
      } catch (error) {
        const message = isPrefeituraFaturamentoApiError(error)
          ? error.message
          : 'Não foi possível carregar o fechamento SUS.'
        setLoadError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [applyOverview, getAccessToken, selectedCompetencia],
  )

  useEffect(() => {
    const token = getAccessToken()
    if (!token || isBootstrapping) return

    void apiFetchCompetencias(token)
      .then(({ competencias }) => {
        if (competencias.length > 0) {
          setSelectedCompetenciaState(competencias[0])
        }
      })
      .catch(() => undefined)
  }, [getAccessToken, isBootstrapping])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reloadOverview(selectedCompetencia)
  }, [isAuthenticated, isBootstrapping, reloadOverview, selectedCompetencia])

  const setSelectedCompetencia = useCallback((competencia: string) => {
    setSelectedCompetenciaState(competencia)
  }, [])

  const openFechamentoView = useCallback((competencia: string, recordId: string) => {
    setSelectedCompetenciaState(competencia)
    setSelectedFechamentoRecordId(recordId)
  }, [])

  const value = useMemo(
    () => ({
      records,
      loteItems,
      summary,
      selectedCompetencia,
      selectedFechamentoRecordId,
      setSelectedCompetencia,
      setSelectedFechamentoRecordId,
      openFechamentoView,
      applyOverview,
      reloadOverview,
      isLoading,
      loadError,
    }),
    [
      applyOverview,
      isLoading,
      loadError,
      loteItems,
      openFechamentoView,
      records,
      reloadOverview,
      selectedCompetencia,
      selectedFechamentoRecordId,
      setSelectedCompetencia,
      summary,
    ],
  )

  return (
    <PrefeituraFaturamentoFechamentoContext.Provider value={value}>
      {children}
    </PrefeituraFaturamentoFechamentoContext.Provider>
  )
}

export function usePrefeituraFaturamentoFechamentoContext() {
  const context = useContext(PrefeituraFaturamentoFechamentoContext)
  if (!context) {
    throw new Error(
      'usePrefeituraFaturamentoFechamentoContext must be used within PrefeituraFaturamentoFechamentoProvider',
    )
  }
  return context
}
