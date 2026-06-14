import type {
  AdminCentroCusto,
  AdminContaPagarRecorrencia,
  AdminContaPagarRow,
  AdminFechamentoCompetenciaRow,
  AdminFechamentoCompetenciaStatus,
  AdminFornecedorRow,
} from '../../../types/adminFinanceiro'
import type {
  BalancoResponse,
  CnpjLookupResponse,
  FinanceiroSummaryResponse,
  NotaFiscalApi,
} from '../../mockServices/admin/financeiro'
import { API_BASE_URL } from '../config'

export class AdminFinanceiroApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminFinanceiroApiError'
    this.status = status
    this.code = code
  }
}

async function parseError(response: Response): Promise<AdminFinanceiroApiError> {
  let message = 'Não foi possível concluir a operação financeira.'
  let code: string | undefined
  try {
    const body = (await response.json()) as { error?: string; message?: string; code?: string }
    if (body.error) message = body.error
    else if (body.message) message = body.message
    code = body.code
  } catch {
    // ignore
  }
  return new AdminFinanceiroApiError(message, response.status, code)
}

function authHeaders(token: string, json = true) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

export async function fetchFinanceiroSummary(token: string): Promise<FinanceiroSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/summary`, {
    headers: authHeaders(token, false),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as FinanceiroSummaryResponse
}

export async function fetchFinanceiroFechamentos(
  token: string,
  params: {
    search?: string
    status?: AdminFechamentoCompetenciaStatus | 'all'
    modalidade?: AdminFechamentoCompetenciaRow['modalidade'] | 'all'
    competencia?: string
  } = {},
): Promise<AdminFechamentoCompetenciaRow[]> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.modalidade) query.set('modalidade', params.modalidade)
  if (params.competencia) query.set('competencia', params.competencia)

  const response = await fetch(`${API_BASE_URL}/admin/financeiro/fechamentos?${query}`, {
    headers: authHeaders(token, false),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminFechamentoCompetenciaRow[]
}

export async function fetchFinanceiroReceber(
  token: string,
  params: {
    search?: string
    modalidade?: AdminFechamentoCompetenciaRow['modalidade'] | 'all'
    competencia?: string
  } = {},
): Promise<AdminFechamentoCompetenciaRow[]> {
  return fetchFinanceiroFechamentos(token, { ...params, status: 'fechado' })
}

export async function closeFinanceiroFechamento(
  token: string,
  fechamentoId: string,
): Promise<AdminFechamentoCompetenciaRow> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/fechamentos/${fechamentoId}/fechar`,
    { method: 'POST', headers: authHeaders(token) },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminFechamentoCompetenciaRow
}

export async function toggleFinanceiroReceberPagamento(
  token: string,
  fechamentoId: string,
  pin: string,
): Promise<AdminFechamentoCompetenciaRow> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/fechamentos/${fechamentoId}/toggle-pagamento`,
    { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ pin }) },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminFechamentoCompetenciaRow
}

export async function deleteFinanceiroReceber(
  token: string,
  fechamentoId: string,
  pin: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/fechamentos/${fechamentoId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ pin }),
  })
  if (!response.ok) throw await parseError(response)
}

export async function emitFinanceiroNotaFiscal(
  token: string,
  fechamentoId: string,
): Promise<NotaFiscalApi> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/fechamentos/${fechamentoId}/nota-fiscal/emitir`,
    { method: 'POST', headers: authHeaders(token) },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as NotaFiscalApi
}

export async function fetchFinanceiroNotaFiscalDownloadUrl(
  token: string,
  fechamentoId: string,
): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/fechamentos/${fechamentoId}/nota-fiscal/download`,
    { headers: authHeaders(token, false) },
  )
  if (!response.ok) throw await parseError(response)
  const body = (await response.json()) as { url: string }
  return body.url
}

export async function fetchFinanceiroCentrosCusto(token: string): Promise<AdminCentroCusto[]> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/centros-custo`, {
    headers: authHeaders(token, false),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminCentroCusto[]
}

export async function createFinanceiroCentroCusto(
  token: string,
  nome: string,
): Promise<AdminCentroCusto> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/centros-custo`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ nome }),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminCentroCusto
}

export async function fetchFinanceiroFornecedores(token: string): Promise<AdminFornecedorRow[]> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/fornecedores`, {
    headers: authHeaders(token, false),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminFornecedorRow[]
}

export async function createFinanceiroFornecedor(
  token: string,
  payload: Omit<AdminFornecedorRow, 'id'>,
): Promise<AdminFornecedorRow> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/fornecedores`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminFornecedorRow
}

export async function updateFinanceiroFornecedor(
  token: string,
  payload: AdminFornecedorRow,
): Promise<AdminFornecedorRow> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/fornecedores/${payload.id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminFornecedorRow
}

export async function deleteFinanceiroFornecedor(
  token: string,
  fornecedorId: string,
  pin: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/fornecedores/${fornecedorId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ pin }),
  })
  if (!response.ok) throw await parseError(response)
}

export async function lookupFinanceiroCnpj(
  token: string,
  cnpjDigits: string,
): Promise<CnpjLookupResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/cnpj/${encodeURIComponent(cnpjDigits)}`,
    { headers: authHeaders(token, false) },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as CnpjLookupResponse
}

export async function fetchFinanceiroContasPagar(token: string): Promise<AdminContaPagarRow[]> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/contas-pagar`, {
    headers: authHeaders(token, false),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminContaPagarRow[]
}

export async function createFinanceiroContaPagar(
  token: string,
  payload: {
    fornecedorId: string
    descricao: string
    centroCustoId: string
    recorrencia: AdminContaPagarRecorrencia
    valor: number
    vencimento: string
  },
): Promise<AdminContaPagarRow> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/contas-pagar`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminContaPagarRow
}

export async function updateFinanceiroContaPagar(
  token: string,
  contaId: string,
  pin: string,
  payload: {
    descricao: string
    centroCustoId: string
    recorrencia: AdminContaPagarRecorrencia
    valor: number
    vencimento: string
    motivoAjuste?: string
  },
): Promise<AdminContaPagarRow> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/contas-pagar/${contaId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ ...payload, pin }),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminContaPagarRow
}

export async function toggleFinanceiroContaPagarPagamento(
  token: string,
  contaId: string,
  pin: string,
): Promise<AdminContaPagarRow> {
  const response = await fetch(
    `${API_BASE_URL}/admin/financeiro/contas-pagar/${contaId}/toggle-pagamento`,
    { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ pin }) },
  )
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as AdminContaPagarRow
}

export async function deleteFinanceiroContaPagar(
  token: string,
  contaId: string,
  pin: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/contas-pagar/${contaId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ pin }),
  })
  if (!response.ok) throw await parseError(response)
}

export async function fetchFinanceiroBalanco(
  token: string,
  params: {
    viewMode?: 'consolidado' | 'competencia' | 'periodo'
    competencia?: string
    dataInicial?: string
    dataFinal?: string
  } = {},
): Promise<BalancoResponse> {
  const query = new URLSearchParams()
  if (params.viewMode) query.set('viewMode', params.viewMode)
  if (params.competencia) query.set('competencia', params.competencia)
  if (params.dataInicial) query.set('dataInicial', params.dataInicial)
  if (params.dataFinal) query.set('dataFinal', params.dataFinal)

  const response = await fetch(`${API_BASE_URL}/admin/financeiro/balanco?${query}`, {
    headers: authHeaders(token, false),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as BalancoResponse
}

export async function upsertFinanceiroBalancoAjuste(
  token: string,
  centroId: string,
  valorConsolidado: number,
): Promise<BalancoResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/balanco/ajustes/${centroId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ valorConsolidado }),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as BalancoResponse
}

export async function clearFinanceiroBalancoAjuste(
  token: string,
  centroId: string,
  pin: string,
): Promise<BalancoResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/financeiro/balanco/ajustes/${centroId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ pin }),
  })
  if (!response.ok) throw await parseError(response)
  return (await response.json()) as BalancoResponse
}

export function isAdminFinanceiroApiError(error: unknown): error is AdminFinanceiroApiError {
  return error instanceof AdminFinanceiroApiError
}

export type { FinanceiroSummaryResponse, NotaFiscalApi, BalancoResponse, CnpjLookupResponse }
