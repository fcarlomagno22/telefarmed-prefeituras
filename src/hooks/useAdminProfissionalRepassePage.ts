import { compareCompetenciaLabels } from '../utils/admin/financeiroCompetencia'
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { AdminContaPagarRow, AdminFornecedorRow } from '../types/adminFinanceiro'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { useAdminPageAccess } from './useAdminPageAccess'
import { isBackendApiEnabled } from '../lib/api/config'
import {
  approveAdminRepasseCompetencia,
  fetchAdminRepasseCompetencias,
  isAdminProfissionalRepasseApiError,
  markAdminRepasseCompetenciaPago,
  rejectAdminRepasseCompetencia,
  requestAdminRepasseCorrecao,
  submitAdminRepassePlantaoDecisao,
} from '../lib/services/admin/profissionalRepasse'
import {
  fetchFinanceiroContasPagar,
  fetchFinanceiroFornecedores,
} from '../lib/services/admin/financeiro'
import type {
  AdminRepasseProfissionalCompetenciaRow,
  RepasseCompetenciaAprovadaPayload,
  SubmitPlantaoDecisaoPayload,
} from '../types/adminProfissionalRepasse'
import { buildAdminRepasseProfissionalKpis } from '../components/admin/financeiro/AdminProfissionalRepasseTabPanel'

export type AdminProfissionalRepassePermissions = {
  /** Visualizar aba, tabela e drawers de auditoria. */
  canView: boolean
  /** Aprovar, rejeitar ou solicitar correção de competência. */
  canApprove: boolean
  /** Marcar competência aprovada como paga. */
  canMarkPaid: boolean
}

type UseAdminProfissionalRepassePageOptions = {
  setFornecedores: Dispatch<SetStateAction<AdminFornecedorRow[]>>
  onContaPagarCreated?: (conta: AdminContaPagarRow) => void
}

export function resolveAdminProfissionalRepassePermissions(
  pageAccess: ReturnType<typeof useAdminPageAccess>['pageAccess'],
): AdminProfissionalRepassePermissions {
  const { canView, canEdit, canInsert } = pageAccess
  return {
    canView,
    canApprove: canEdit || canInsert,
    canMarkPaid: canEdit,
  }
}

export function useAdminProfissionalRepassePage({
  setFornecedores,
  onContaPagarCreated,
}: UseAdminProfissionalRepassePageOptions) {
  const { getAccessToken } = useAdminAuth()
  const { pageAccess } = useAdminPageAccess('financeiro')
  const permissions = useMemo(
    () => resolveAdminProfissionalRepassePermissions(pageAccess),
    [pageAccess],
  )

  const [rows, setRows] = useState<AdminRepasseProfissionalCompetenciaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')
  const [auditoriaRequestId, setAuditoriaRequestId] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const kpis = useMemo(() => buildAdminRepasseProfissionalKpis(rows), [rows])

  const competenciaOptions = useMemo(
    () =>
      [...new Set(rows.map((row) => row.competencia))].sort(compareCompetenciaLabels).reverse(),
    [rows],
  )

  const profissionalOptions = useMemo(
    () => [...new Set(rows.map((row) => row.profissionalNome))].sort(),
    [rows],
  )

  const reload = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchAdminRepasseCompetencias(token)
      setRows(response.rows)
    } catch (err) {
      const message = isAdminProfissionalRepasseApiError(err)
        ? err.message
        : 'Não foi possível carregar repasses de profissionais.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const showToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastVariant(variant)
  }, [])

  const openAuditoria = useCallback((competenciaId: string) => {
    setAuditoriaRequestId(competenciaId)
  }, [])

  const consumeAuditoriaRequest = useCallback(() => {
    setAuditoriaRequestId(null)
  }, [])

  const approveCompetencia = useCallback(
    async (payload: RepasseCompetenciaAprovadaPayload) => {
      if (!permissions.canApprove) {
        showToast('Sem permissão para aprovar repasse.', 'error')
        return false
      }
      if (
        payload.competenciaRow.status === 'aprovado' ||
        payload.competenciaRow.status === 'pago'
      ) {
        showToast('Esta competência já possui conta a pagar gerada.', 'error')
        return false
      }

      const token = getAccessToken()
      if (!token) return false

      setIsMutating(true)
      try {
        const { row } = await approveAdminRepasseCompetencia(token, payload)
        setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)))

        const contas = await fetchFinanceiroContasPagar(token)
        const novaConta = contas.find((conta) => conta.repasseCompetenciaId === row.id)
        if (novaConta) onContaPagarCreated?.(novaConta)

        if (!isBackendApiEnabled()) {
          const nextFornecedores = await fetchFinanceiroFornecedores(token)
          setFornecedores(nextFornecedores)
        }

        showToast(
          novaConta
            ? `Competência aprovada e conta a pagar gerada: ${novaConta.descricao}`
            : 'Competência aprovada e conta a pagar gerada.',
        )
        return true
      } catch (err) {
        const message = isAdminProfissionalRepasseApiError(err)
          ? err.message
          : 'Não foi possível aprovar a competência.'
        showToast(message, 'error')
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [
      getAccessToken,
      onContaPagarCreated,
      permissions.canApprove,
      setFornecedores,
      showToast,
    ],
  )

  const rejectCompetencia = useCallback(
    async (competenciaId: string, motivo: string) => {
      if (!permissions.canApprove) {
        showToast('Sem permissão para rejeitar repasse.', 'error')
        return false
      }
      const token = getAccessToken()
      if (!token) return false

      setIsMutating(true)
      try {
        const { row } = await rejectAdminRepasseCompetencia(token, competenciaId, motivo)
        setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)))
        showToast('Competência rejeitada.', 'error')
        return true
      } catch (err) {
        const message = isAdminProfissionalRepasseApiError(err)
          ? err.message
          : 'Não foi possível rejeitar a competência.'
        showToast(message, 'error')
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [getAccessToken, permissions.canApprove, showToast],
  )

  const requestCorrecao = useCallback(
    async (competenciaId: string, motivo: string) => {
      if (!permissions.canApprove) {
        showToast('Sem permissão para solicitar correção.', 'error')
        return false
      }
      const token = getAccessToken()
      if (!token) return false

      setIsMutating(true)
      try {
        await requestAdminRepasseCorrecao(token, competenciaId, motivo)
        showToast('Correção solicitada ao profissional.')
        return true
      } catch (err) {
        const message = isAdminProfissionalRepasseApiError(err)
          ? err.message
          : 'Não foi possível solicitar correção.'
        showToast(message, 'error')
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [getAccessToken, permissions.canApprove, showToast],
  )

  const markCompetenciaPago = useCallback(
    async (competenciaId: string) => {
      if (!permissions.canMarkPaid) {
        showToast('Sem permissão para marcar como pago.', 'error')
        return false
      }
      const token = getAccessToken()
      if (!token) return false

      setIsMutating(true)
      try {
        const { row } = await markAdminRepasseCompetenciaPago(token, competenciaId)
        setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)))
        showToast('Competência marcada como paga.')
        return true
      } catch (err) {
        const message = isAdminProfissionalRepasseApiError(err)
          ? err.message
          : 'Não foi possível marcar como pago.'
        showToast(message, 'error')
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [getAccessToken, permissions.canMarkPaid, showToast],
  )

  const submitPlantaoDecisao = useCallback(
    async (payload: SubmitPlantaoDecisaoPayload) => {
      if (!permissions.canApprove) {
        showToast('Sem permissão para registrar decisão de plantão.', 'error')
        return null
      }
      const token = getAccessToken()
      if (!token) return null

      setIsMutating(true)
      try {
        const { row } = await submitAdminRepassePlantaoDecisao(token, payload)
        setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)))
        showToast('Decisão do plantão registrada.')
        return row
      } catch (err) {
        const message = isAdminProfissionalRepasseApiError(err)
          ? err.message
          : 'Não foi possível registrar a decisão do plantão.'
        showToast(message, 'error')
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [getAccessToken, permissions.canApprove, showToast],
  )

  return {
    rows,
    kpis,
    isLoading,
    error,
    isMutating,
    permissions,
    toastMessage,
    toastVariant,
    setToastMessage,
    showToast,
    reload,
    competenciaOptions,
    profissionalOptions,
    auditoriaRequestId,
    openAuditoria,
    consumeAuditoriaRequest,
    approveCompetencia,
    rejectCompetencia,
    requestCorrecao,
    markCompetenciaPago,
    submitPlantaoDecisao,
  }
}
