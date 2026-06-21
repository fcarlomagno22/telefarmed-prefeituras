import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildViewModesForCompetencia,
  countPostCloseCandidates,
  createEmptyRecord,
  formatFechamentoTipoLabel,
  getLoteItemsForRecord,
  getOpenComplementRecord,
  getPrincipalRecord,
  getRecordsForCompetencia,
  isFechamentoRecordClosed,
  isPostCloseCandidate,
} from '../components/prefeitura/faturamento/fechamento/prefeituraFaturamentoComplementoUi'
import {
  normalizeFechamentoSearch,
} from '../components/prefeitura/faturamento/fechamento/prefeituraFaturamentoFechamentoUi'
import {
  formatPendenciaCompetenciaLabel,
  isPendenciaAberta,
  normalizePendenciaSearch,
} from '../components/prefeitura/faturamento/pendencias/prefeituraFaturamentoPendenciasUi'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { usePrefeituraFaturamentoFechamentoContext } from '../contexts/PrefeituraFaturamentoFechamentoContext'
import {
  apiExcludeLoteItem,
  apiFecharCompetencia,
  apiFetchHistorico,
  apiFetchPendencias,
  apiIniciarComplemento,
  apiMarcarExportado,
  apiRevalidarFechamento,
  apiRestoreLoteItem,
  downloadFechamentoBpaFromApi,
  downloadFechamentoRelatorioFromApi,
} from '../lib/services/prefeitura/faturamento'
import type {
  PrefeituraFaturamentoFechamentoCloseResult,
  PrefeituraFaturamentoFechamentoFilters,
  PrefeituraFaturamentoFechamentoGateItem,
  PrefeituraFaturamentoFechamentoRecord,
  PrefeituraFaturamentoFechamentoStatus,
  PrefeituraFaturamentoFechamentoSummary,
} from '../types/prefeituraFaturamentoFechamento'
import type { PrefeituraFaturamentoPendencia } from '../types/prefeituraFaturamentoPendencias'

export type PrefeituraFaturamentoHistoricoItem = {
  record: PrefeituraFaturamentoFechamentoRecord
  competenciaLabel: string
  tipoLabel: string
  consultasNoLote: number
}

type TableFilters = Omit<PrefeituraFaturamentoFechamentoFilters, 'competencia'>

export const defaultPrefeituraFaturamentoFechamentoTableFilters: TableFilters = {
  unitId: 'all',
  professionalName: 'all',
  search: '',
}

function resolveOperationalStatus(
  record: PrefeituraFaturamentoFechamentoRecord,
  bloqueantes: number,
): PrefeituraFaturamentoFechamentoStatus {
  if (isFechamentoRecordClosed(record)) {
    return record.status
  }
  return bloqueantes === 0 ? 'pronto_para_fechar' : 'em_preparacao'
}

function buildGateItems(
  bloqueantes: number,
  avisosAbertos: number,
  lastRevalidationAt: string | null,
  isComplement: boolean,
): PrefeituraFaturamentoFechamentoGateItem[] {
  return [
    {
      id: 'bloqueantes',
      label: 'Pendências bloqueantes resolvidas',
      ok: bloqueantes === 0,
      detail:
        bloqueantes === 0
          ? 'Nenhuma pendência bloqueante aberta nesta competência.'
          : `${bloqueantes} pendência(s) bloqueante(s) impedem o fechamento.`,
    },
    {
      id: 'revalidacao',
      label: isComplement ? 'Complemento revalidado' : 'Competência revalidada',
      ok: !!lastRevalidationAt,
      detail: lastRevalidationAt
        ? `Última revalidação em ${new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(lastRevalidationAt))}.`
        : 'Execute a revalidação antes de fechar.',
    },
    {
      id: 'avisos',
      label: 'Avisos conferidos',
      ok: avisosAbertos === 0,
      detail:
        avisosAbertos === 0
          ? 'Nenhum aviso aberto pendente de atenção.'
          : `${avisosAbertos} aviso(s) aberto(s). Recomendado revisar antes do fechamento.`,
    },
    {
      id: 'lote',
      label: isComplement ? 'Consultas pós-fechamento selecionadas' : 'Lote elegível montado',
      ok: true,
      detail: isComplement
        ? 'Consultas realizadas após o fechamento principal e ainda não enviadas.'
        : 'Consultas aptas para faturamento SUS disponíveis para pré-visualização.',
    },
  ]
}

function resolveCurrentRecord(
  records: PrefeituraFaturamentoFechamentoRecord[],
  competencia: string,
  recordId: string,
) {
  return (
    records.find((record) => record.id === recordId) ??
    getPrincipalRecord(records, competencia) ??
    records[0]
  )
}

export function usePrefeituraFaturamentoFechamentoPage() {
  const { getAccessToken, user } = usePrefeituraAuth()
  const {
    records,
    loteItems,
    summary: contextSummary,
    selectedCompetencia,
    selectedFechamentoRecordId,
    setSelectedCompetencia,
    setSelectedFechamentoRecordId,
    applyOverview,
    reloadOverview,
    isLoading,
    loadError,
  } = usePrefeituraFaturamentoFechamentoContext()

  const [tableFilters, setTableFilters] = useState(defaultPrefeituraFaturamentoFechamentoTableFilters)
  const [pendenciasScoped, setPendenciasScoped] = useState<PrefeituraFaturamentoPendencia[]>([])

  const loadPendenciasForCompetencia = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !selectedCompetencia) return
    try {
      const data = await apiFetchPendencias(token, {
        competencia: selectedCompetencia,
        unitId: 'all',
        professionalName: 'all',
        specialty: 'all',
        category: 'all',
        gravidade: 'all',
        status: 'all',
        search: '',
        page: 1,
        pageSize: 100,
      })
      setPendenciasScoped(data.allItems ?? data.items)
    } catch {
      setPendenciasScoped([])
    }
  }, [getAccessToken, selectedCompetencia])

  useEffect(() => {
    void loadPendenciasForCompetencia()
  }, [loadPendenciasForCompetencia])

  const principalRecord = useMemo(
    () => getPrincipalRecord(records, selectedCompetencia),
    [records, selectedCompetencia],
  )

  const entidadeId = user?.entidadeContratanteId ?? ''

  const currentRecord = useMemo(() => {
    if (!records.length) return createEmptyRecord(selectedCompetencia, entidadeId)
    return (
      resolveCurrentRecord(records, selectedCompetencia, selectedFechamentoRecordId) ??
      createEmptyRecord(selectedCompetencia, entidadeId)
    )
  }, [entidadeId, records, selectedCompetencia, selectedFechamentoRecordId])

  const isComplementMode = currentRecord.tipo === 'complementar'
  const isPrincipalClosed = principalRecord ? isFechamentoRecordClosed(principalRecord) : false
  const isClosed = isFechamentoRecordClosed(currentRecord)

  const scopedLote = useMemo(() => {
    return getLoteItemsForRecord(currentRecord, loteItems, principalRecord)
  }, [currentRecord, loteItems, principalRecord])

  const activeLoteCount = useMemo(
    () => scopedLote.filter((item) => !item.excluded).length,
    [scopedLote],
  )

  const postClosePendingCount = useMemo(
    () => countPostCloseCandidates(loteItems, principalRecord),
    [loteItems, principalRecord],
  )

  const openComplementRecord = useMemo(
    () => getOpenComplementRecord(records, selectedCompetencia),
    [records, selectedCompetencia],
  )

  const viewModes = useMemo(
    () => buildViewModesForCompetencia(records, selectedCompetencia),
    [records, selectedCompetencia],
  )

  const pendenciasAbertas = useMemo(
    () => pendenciasScoped.filter((item) => isPendenciaAberta(item.status)),
    [pendenciasScoped],
  )

  const bloqueantes = contextSummary?.bloqueantes ?? pendenciasAbertas.filter((item) => item.gravidade === 'bloqueante').length
  const avisosAbertos = pendenciasAbertas.filter((item) => item.gravidade === 'aviso').length
  const ignoradas = contextSummary?.ignoradas ?? pendenciasScoped.filter(
    (item) => item.status === 'ignorada' || item.status === 'nao_faturavel',
  ).length

  const operationalStatus = useMemo(
    (): PrefeituraFaturamentoFechamentoStatus =>
      resolveOperationalStatus(currentRecord, bloqueantes),
    [bloqueantes, currentRecord],
  )

  const summary = useMemo((): PrefeituraFaturamentoFechamentoSummary => {
    if (contextSummary) {
      return {
        ...contextSummary,
        noLote: activeLoteCount,
        elegiveis: scopedLote.length,
      }
    }
    return {
      competenciaLabel: formatPendenciaCompetenciaLabel(selectedCompetencia),
      realizadas: 0,
      elegiveis: scopedLote.length,
      noLote: activeLoteCount,
      bloqueantes,
      ignoradas,
    }
  }, [activeLoteCount, bloqueantes, contextSummary, ignoradas, scopedLote.length, selectedCompetencia])

  const gateItems = useMemo(
    () =>
      buildGateItems(
        bloqueantes,
        avisosAbertos,
        currentRecord.lastRevalidationAt,
        isComplementMode,
      ),
    [avisosAbertos, bloqueantes, currentRecord.lastRevalidationAt, isComplementMode],
  )

  const canClose = useMemo(() => !isClosed && activeLoteCount > 0, [activeLoteCount, isClosed])

  const canStartComplement = useMemo(
    () =>
      isPrincipalClosed &&
      postClosePendingCount > 0 &&
      !openComplementRecord &&
      currentRecord.tipo === 'principal',
    [currentRecord.tipo, isPrincipalClosed, openComplementRecord, postClosePendingCount],
  )

  const showComplementBanner = useMemo(
    () => isPrincipalClosed && postClosePendingCount > 0 && !openComplementRecord,
    [isPrincipalClosed, openComplementRecord, postClosePendingCount],
  )

  const filterOptions = useMemo(() => {
    const competencias = [...new Set(records.map((record) => record.competencia))]
      .concat([...new Set(loteItems.map((item) => item.competencia))])
      .filter((value, index, array) => array.indexOf(value) === index)
      .sort()
      .reverse()

    const units = [
      ...new Map(scopedLote.map((item) => [item.unitId, item.unitName] as const)).entries(),
    ]
    const professionals = [...new Set(scopedLote.map((item) => item.professionalName))].sort()

    return {
      competencias: competencias.map((value) => ({
        value,
        label: formatPendenciaCompetenciaLabel(value),
      })),
      units: [{ value: 'all', label: 'Unidade: Todas' }, ...units.map(([value, label]) => ({ value, label }))],
      professionals: [
        { value: 'all', label: 'Profissional: Todos' },
        ...professionals.map((name) => ({ value: name, label: name })),
      ],
    }
  }, [loteItems, records, scopedLote])

  const filteredLote = useMemo(() => {
    const search = normalizeFechamentoSearch(tableFilters.search.trim())

    return scopedLote.filter((item) => {
      if (tableFilters.unitId !== 'all' && item.unitId !== tableFilters.unitId) return false
      if (
        tableFilters.professionalName !== 'all' &&
        item.professionalName !== tableFilters.professionalName
      ) {
        return false
      }
      if (!search) return true

      const haystack = normalizePendenciaSearch(
        [
          item.consultaId,
          item.patientName,
          item.patientCpf ?? '',
          item.professionalName,
          item.procedureCode,
          item.procedureName,
        ].join(' '),
      )

      return haystack.includes(search)
    })
  }, [scopedLote, tableFilters])

  const filters = useMemo(
    (): PrefeituraFaturamentoFechamentoFilters => ({
      competencia: selectedCompetencia,
      ...tableFilters,
    }),
    [selectedCompetencia, tableFilters],
  )

  const updateFilters = useCallback(
    (patch: Partial<PrefeituraFaturamentoFechamentoFilters>) => {
      if (patch.competencia) {
        setSelectedCompetencia(patch.competencia)
      }

      setTableFilters((current) => ({
        unitId: patch.unitId ?? current.unitId,
        professionalName: patch.professionalName ?? current.professionalName,
        search: patch.search ?? current.search,
      }))
    },
    [setSelectedCompetencia],
  )

  const selectViewMode = useCallback(
    (recordId: string) => {
      setSelectedFechamentoRecordId(recordId)
    },
    [setSelectedFechamentoRecordId],
  )

  const iniciarComplemento = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return
    const overview = await apiIniciarComplemento(token, selectedCompetencia)
    applyOverview(overview)
    if (overview.record) {
      setSelectedFechamentoRecordId(overview.record.id)
    }
  }, [applyOverview, getAccessToken, selectedCompetencia, setSelectedFechamentoRecordId])

  const verConsultasComplemento = useCallback(async () => {
    if (openComplementRecord) {
      setSelectedFechamentoRecordId(openComplementRecord.id)
      return
    }
    await iniciarComplemento()
  }, [iniciarComplemento, openComplementRecord, setSelectedFechamentoRecordId])

  const revalidarCompetencia = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !currentRecord || isClosed) return
    const overview = await apiRevalidarFechamento(token, currentRecord.id)
    applyOverview(overview)
    await loadPendenciasForCompetencia()
  }, [applyOverview, currentRecord, getAccessToken, isClosed, loadPendenciasForCompetencia])

  const excludeFromLote = useCallback(
    async (id: string, reason: string) => {
      const token = getAccessToken()
      if (!token || !currentRecord || isClosed) return
      const overview = await apiExcludeLoteItem(token, currentRecord.id, id, reason)
      applyOverview(overview)
    },
    [applyOverview, currentRecord, getAccessToken, isClosed],
  )

  const restoreToLote = useCallback(
    async (id: string) => {
      const token = getAccessToken()
      if (!token || !currentRecord || isClosed) return
      const overview = await apiRestoreLoteItem(token, currentRecord.id, id)
      applyOverview(overview)
    },
    [applyOverview, currentRecord, getAccessToken, isClosed],
  )

  const fecharCompetencia = useCallback(async (): Promise<PrefeituraFaturamentoFechamentoCloseResult> => {
    const token = getAccessToken()
    if (!token || !currentRecord) {
      return { ok: false, errorReason: 'Sessão expirada ou fechamento indisponível.' }
    }

    const result = await apiFecharCompetencia(token, currentRecord.id)
    if (result.overview) {
      applyOverview(result.overview)
    } else {
      await reloadOverview(selectedCompetencia)
    }

    return {
      ok: result.ok,
      message: result.message,
      errorReason: result.errorReason,
      fechamentoId: result.fechamentoId,
    }
  }, [applyOverview, currentRecord, getAccessToken, reloadOverview, selectedCompetencia])

  const marcarExportado = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !currentRecord) return
    const overview = await apiMarcarExportado(token, currentRecord.id)
    applyOverview(overview)
  }, [applyOverview, currentRecord, getAccessToken])

  const exportarBpa = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !currentRecord || !isClosed) return
    await downloadFechamentoBpaFromApi(token, currentRecord.id)
    await marcarExportado()
  }, [currentRecord, getAccessToken, isClosed, marcarExportado])

  const baixarRelatorio = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !currentRecord || !isClosed) return
    await downloadFechamentoRelatorioFromApi(token, currentRecord.id)
  }, [currentRecord, getAccessToken, isClosed])

  return {
    filters,
    filterOptions,
    updateFilters,
    summary,
    operationalStatus,
    currentRecord,
    principalRecord,
    gateItems,
    canClose,
    isClosed,
    isComplementMode,
    isPrincipalClosed,
    filteredLote,
    bloqueantes,
    postClosePendingCount,
    showComplementBanner,
    canStartComplement,
    viewModes,
    competenciaRecords: getRecordsForCompetencia(records, selectedCompetencia),
    selectViewMode,
    iniciarComplemento,
    verConsultasComplemento,
    revalidarCompetencia,
    excludeFromLote,
    restoreToLote,
    fecharCompetencia,
    marcarExportado,
    exportarBpa,
    baixarRelatorio,
    isLoading,
    loadError,
  }
}

export function usePrefeituraFaturamentoHistoricoPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = usePrefeituraAuth()
  const { openFechamentoView } = usePrefeituraFaturamentoFechamentoContext()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<PrefeituraFaturamentoHistoricoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await apiFetchHistorico(token, search)
      setItems(data.items)
    } catch {
      setLoadError('Não foi possível carregar o histórico de fechamentos.')
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken, search])

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) return
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const openInFechamento = useCallback(
    (competencia: string, recordId: string) => {
      openFechamentoView(competencia, recordId)
    },
    [openFechamentoView],
  )

  const exportarBpa = useCallback(
    async (record: PrefeituraFaturamentoFechamentoRecord) => {
      const token = getAccessToken()
      if (!token) return
      await downloadFechamentoBpaFromApi(token, record.id)
    },
    [getAccessToken],
  )

  const baixarRelatorio = useCallback(
    async (record: PrefeituraFaturamentoFechamentoRecord) => {
      const token = getAccessToken()
      if (!token) return
      await downloadFechamentoRelatorioFromApi(token, record.id)
    },
    [getAccessToken],
  )

  return {
    items,
    search,
    setSearch,
    openInFechamento,
    exportarBpa,
    baixarRelatorio,
    isLoading,
    loadError,
    reload,
  }
}
