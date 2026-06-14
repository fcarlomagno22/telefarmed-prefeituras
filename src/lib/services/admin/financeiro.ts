import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/financeiro'
import * as mock from '../../mockServices/admin/financeiro'

const useApi = isBackendApiEnabled()

export type FinanceiroSummaryResponse = mock.FinanceiroSummaryResponse
export type NotaFiscalApi = mock.NotaFiscalApi
export type BalancoResponse = mock.BalancoResponse
export type CnpjLookupResponse = mock.CnpjLookupResponse

export const AdminFinanceiroApiError = useApi ? api.AdminFinanceiroApiError : mock.AdminFinanceiroApiError

export const fetchFinanceiroSummary = useApi ? api.fetchFinanceiroSummary : mock.fetchFinanceiroSummary
export const fetchFinanceiroFechamentos = useApi ? api.fetchFinanceiroFechamentos : mock.fetchFinanceiroFechamentos
export const fetchFinanceiroReceber = useApi ? api.fetchFinanceiroReceber : mock.fetchFinanceiroReceber
export const closeFinanceiroFechamento = useApi ? api.closeFinanceiroFechamento : mock.closeFinanceiroFechamento
export const toggleFinanceiroReceberPagamento = useApi
  ? api.toggleFinanceiroReceberPagamento
  : mock.toggleFinanceiroReceberPagamento
export const deleteFinanceiroReceber = useApi ? api.deleteFinanceiroReceber : mock.deleteFinanceiroReceber
export const emitFinanceiroNotaFiscal = useApi ? api.emitFinanceiroNotaFiscal : mock.emitFinanceiroNotaFiscal
export const fetchFinanceiroNotaFiscalDownloadUrl = useApi
  ? api.fetchFinanceiroNotaFiscalDownloadUrl
  : mock.fetchFinanceiroNotaFiscalDownloadUrl
export const fetchFinanceiroCentrosCusto = useApi ? api.fetchFinanceiroCentrosCusto : mock.fetchFinanceiroCentrosCusto
export const createFinanceiroCentroCusto = useApi ? api.createFinanceiroCentroCusto : mock.createFinanceiroCentroCusto
export const fetchFinanceiroFornecedores = useApi ? api.fetchFinanceiroFornecedores : mock.fetchFinanceiroFornecedores
export const createFinanceiroFornecedor = useApi ? api.createFinanceiroFornecedor : mock.createFinanceiroFornecedor
export const updateFinanceiroFornecedor = useApi ? api.updateFinanceiroFornecedor : mock.updateFinanceiroFornecedor
export const deleteFinanceiroFornecedor = useApi ? api.deleteFinanceiroFornecedor : mock.deleteFinanceiroFornecedor
export const lookupFinanceiroCnpj = useApi ? api.lookupFinanceiroCnpj : mock.lookupFinanceiroCnpj
export const fetchFinanceiroContasPagar = useApi ? api.fetchFinanceiroContasPagar : mock.fetchFinanceiroContasPagar
export const createFinanceiroContaPagar = useApi ? api.createFinanceiroContaPagar : mock.createFinanceiroContaPagar
export const appendFinanceiroContaPagar = mock.appendFinanceiroContaPagar
export const updateFinanceiroContaPagar = useApi ? api.updateFinanceiroContaPagar : mock.updateFinanceiroContaPagar
export const toggleFinanceiroContaPagarPagamento = useApi
  ? api.toggleFinanceiroContaPagarPagamento
  : mock.toggleFinanceiroContaPagarPagamento
export const deleteFinanceiroContaPagar = useApi ? api.deleteFinanceiroContaPagar : mock.deleteFinanceiroContaPagar
export const fetchFinanceiroBalanco = useApi ? api.fetchFinanceiroBalanco : mock.fetchFinanceiroBalanco
export const upsertFinanceiroBalancoAjuste = useApi
  ? api.upsertFinanceiroBalancoAjuste
  : mock.upsertFinanceiroBalancoAjuste
export const clearFinanceiroBalancoAjuste = useApi
  ? api.clearFinanceiroBalancoAjuste
  : mock.clearFinanceiroBalancoAjuste

export const isAdminFinanceiroApiError = useApi ? api.isAdminFinanceiroApiError : mock.isAdminFinanceiroApiError

export type {
  AdminFechamentoCompetenciaRow,
  AdminContaReceberStatusVencimento,
} from '../../../types/adminFinanceiro'
