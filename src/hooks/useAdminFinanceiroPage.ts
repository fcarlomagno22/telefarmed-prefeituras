import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AdminCentroCusto,
  AdminContaPagarRow,
  AdminFechamentoCompetenciaRow,
  AdminFornecedorRow,
} from '../types/adminFinanceiro'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import {
  fetchFinanceiroCentrosCusto,
  fetchFinanceiroContasPagar,
  fetchFinanceiroFechamentos,
  fetchFinanceiroFornecedores,
  fetchFinanceiroSummary,
  fetchFinanceiroBalanco,
  isAdminFinanceiroApiError,
  type BalancoResponse,
  type FinanceiroSummaryResponse,
  type NotaFiscalApi,
} from '../lib/services/admin/financeiro'

export function useAdminFinanceiroPage() {
  const { getAccessToken, isAuthenticated, isBootstrapping } = useAdminAuth()
  const [fechamentos, setFechamentos] = useState<AdminFechamentoCompetenciaRow[]>([])
  const [contasPagar, setContasPagar] = useState<AdminContaPagarRow[]>([])
  const [fornecedores, setFornecedores] = useState<AdminFornecedorRow[]>([])
  const [centrosCusto, setCentrosCusto] = useState<AdminCentroCusto[]>([])
  const [summary, setSummary] = useState<FinanceiroSummaryResponse | null>(null)
  const [despesaAjustePorCentro, setDespesaAjustePorCentro] = useState<Record<string, number>>({})
  const [notaFiscalByFechamentoId, setNotaFiscalByFechamentoId] = useState<
    Record<string, { status: 'emitting' | 'issued'; invoiceNumber?: string; issuedAt?: string }>
  >({})
  const [balanco, setBalanco] = useState<BalancoResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBalancoLoading, setIsBalancoLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const applyNotasFromRows = useCallback((rows: AdminFechamentoCompetenciaRow[]) => {
    const next: Record<string, { status: 'emitting' | 'issued'; invoiceNumber?: string; issuedAt?: string }> =
      {}
    for (const row of rows) {
      const nota = (row as AdminFechamentoCompetenciaRow & { notaFiscal?: NotaFiscalApi | null })
        .notaFiscal
      if (!nota || nota.status === 'failed') continue
      if (nota.status === 'emitting' || nota.status === 'issued') {
        next[row.id] = {
          status: nota.status,
          invoiceNumber: nota.invoiceNumber,
          issuedAt: nota.issuedAt,
        }
      }
    }
    setNotaFiscalByFechamentoId(next)
  }, [])

  const applyBalancoAjustes = useCallback(
    (despesasPorCentro: Array<{ id: string; ajuste: number }> | null | undefined) => {
      const next: Record<string, number> = {}
      for (const centro of despesasPorCentro ?? []) {
        if (centro.ajuste !== 0) next[centro.id] = centro.ajuste
      }
      setDespesaAjustePorCentro(next)
    },
    [],
  )

  const loadBalanco = useCallback(
    async (
      params: {
        viewMode?: 'consolidado' | 'competencia' | 'periodo'
        competencia?: string
        dataInicial?: string
        dataFinal?: string
      } = {},
    ) => {
      const token = getAccessToken()
      if (!token) return null

      setIsBalancoLoading(true)
      try {
        const balancoData = await fetchFinanceiroBalanco(token, {
          viewMode: params.viewMode ?? 'consolidado',
          competencia: params.competencia,
          dataInicial: params.dataInicial,
          dataFinal: params.dataFinal,
        })
        setBalanco(balancoData)
        applyBalancoAjustes(balancoData.despesasPorCentro)
        return balancoData
      } catch (error) {
        const message = isAdminFinanceiroApiError(error)
          ? error.message
          : 'Não foi possível carregar o balanço.'
        setLoadError(message)
        return null
      } finally {
        setIsBalancoLoading(false)
      }
    },
    [applyBalancoAjustes, getAccessToken],
  )

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const [summaryData, fechamentosData, contasData, fornecedoresData, centrosData, balanco] =
        await Promise.all([
          fetchFinanceiroSummary(token),
          fetchFinanceiroFechamentos(token),
          fetchFinanceiroContasPagar(token),
          fetchFinanceiroFornecedores(token),
          fetchFinanceiroCentrosCusto(token),
          fetchFinanceiroBalanco(token, { viewMode: 'consolidado' }),
        ])

      setSummary(summaryData ?? null)
      setFechamentos(fechamentosData ?? [])
      setContasPagar(contasData ?? [])
      setFornecedores(fornecedoresData ?? [])
      setCentrosCusto(centrosData ?? [])
      setBalanco(balanco ?? null)
      applyNotasFromRows(fechamentosData ?? [])
      applyBalancoAjustes(balanco?.despesasPorCentro ?? [])
    } catch (error) {
      const message = isAdminFinanceiroApiError(error)
        ? error.message
        : 'Não foi possível carregar o financeiro.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [applyBalancoAjustes, applyNotasFromRows, getAccessToken])

  useEffect(() => {
    if (isBootstrapping) return
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    void reload()
  }, [isAuthenticated, isBootstrapping, reload])

  const financeKpisFromApi = useMemo(() => summary, [summary])

  return {
    fechamentos,
    setFechamentos,
    contasPagar,
    setContasPagar,
    fornecedores,
    setFornecedores,
    centrosCusto,
    setCentrosCusto,
    summary: financeKpisFromApi,
    balanco,
    despesaAjustePorCentro,
    setDespesaAjustePorCentro,
    notaFiscalByFechamentoId,
    setNotaFiscalByFechamentoId,
    isLoading: isLoading || isBootstrapping,
    isBalancoLoading,
    loadError,
    reload,
    loadBalanco,
    applyBalancoAjustes,
    applyNotasFromRows,
  }
}
