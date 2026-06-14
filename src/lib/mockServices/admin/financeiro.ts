import type {
  AdminCentroCusto,
  AdminContaPagarRecorrencia,
  AdminContaPagarRow,
  AdminContaReceberStatusVencimento,
  AdminFechamentoCompetenciaRow,
  AdminFechamentoCompetenciaStatus,
  AdminFornecedorRow,
} from '../../../data/adminFinanceiroMock'
import {
  adminCentrosCustoIniciais,
  adminContasPagarIniciais,
  adminFornecedoresIniciais,
  buildAdminFechamentosCompetenciaFromContratos,
} from '../../../data/adminFinanceiroMock'
import { mockDelay } from '../delay'

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

export type FinanceiroSummaryResponse = {
  receitaPrevista: number
  receitaRecebida: number
  despesasTotais: number
  saldoOperacional: number
  totalEmAtrasoReceber: number
}

export type NotaFiscalApi = {
  status: 'emitting' | 'issued' | 'failed'
  invoiceNumber?: string
  issuedAt?: string
  downloadUrl?: string
}

export type BalancoResponse = {
  receita: number
  despesa: number
  resultado: number
  lucratividadePercentual: number
  despesasPagas: number
  totalEmAtrasoReceber: number
  despesasPorCentro: Array<{
    id: string
    nome: string
    valorBase: number
    ajuste: number
    valor: number
  }>
}

export type CnpjLookupResponse = {
  razaoSocial?: string
  situacao?: AdminFornecedorRow['situacao']
  contatoEmail?: string
  contatoTelefone?: string
  pessoaContato?: string
}

let fechamentosState: AdminFechamentoCompetenciaRow[] = buildAdminFechamentosCompetenciaFromContratos()
let centrosState: AdminCentroCusto[] = JSON.parse(JSON.stringify(adminCentrosCustoIniciais))
let fornecedoresState: AdminFornecedorRow[] = JSON.parse(JSON.stringify(adminFornecedoresIniciais))
let pagarState: AdminContaPagarRow[] = JSON.parse(JSON.stringify(adminContasPagarIniciais))
const balancoAjustes = new Map<string, number>()

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function ensureRows<T>(rows: T[] | undefined | null): T[] {
  return rows ?? []
}

export function isAdminFinanceiroApiError(error: unknown): error is AdminFinanceiroApiError {
  return error instanceof AdminFinanceiroApiError
}

export async function fetchFinanceiroSummary(
  _accessToken: string,
): Promise<FinanceiroSummaryResponse> {
  void _accessToken
  const receitaPrevista = fechamentosState.reduce((sum, row) => sum + row.valorFinal, 0)
  const receitaRecebida = fechamentosState
    .filter((row) => row.statusVencimento === 'paga')
    .reduce((sum, row) => sum + row.valorFinal, 0)
  const despesasTotais = pagarState.reduce((sum, row) => sum + row.valor, 0)
  const totalEmAtrasoReceber = fechamentosState
    .filter((row) => row.statusVencimento === 'atrasada')
    .reduce((sum, row) => sum + row.valorFinal, 0)
  return mockDelay(
    {
      receitaPrevista,
      receitaRecebida,
      despesasTotais,
      saldoOperacional: receitaRecebida - despesasTotais,
      totalEmAtrasoReceber,
    },
    60,
  )
}

export async function fetchFinanceiroFechamentos(
  _accessToken: string,
  params: {
    search?: string
    status?: AdminFechamentoCompetenciaStatus | 'all'
    modalidade?: AdminFechamentoCompetenciaRow['modalidade'] | 'all'
    competencia?: string
  } = {},
): Promise<AdminFechamentoCompetenciaRow[]> {
  void _accessToken
  const search = params.search?.trim().toLowerCase()
  return mockDelay(
    ensureRows(
      clone(fechamentosState).filter((row) => {
        if (params.status && params.status !== 'all' && row.status !== params.status) return false
        if (params.modalidade && params.modalidade !== 'all' && row.modalidade !== params.modalidade) return false
        if (params.competencia && params.competencia !== 'all' && row.competencia !== params.competencia) {
          return false
        }
        if (
          search &&
          ![row.prefeitura, row.contratoNumero, row.competencia].some((value) =>
            value.toLowerCase().includes(search),
          )
        ) {
          return false
        }
        return true
      }),
    ),
    70,
  )
}

export async function fetchFinanceiroReceber(
  accessToken: string,
  params: {
    search?: string
    modalidade?: AdminFechamentoCompetenciaRow['modalidade'] | 'all'
    competencia?: string
  } = {},
): Promise<AdminFechamentoCompetenciaRow[]> {
  return fetchFinanceiroFechamentos(accessToken, { ...params, status: 'all' })
}

export async function closeFinanceiroFechamento(
  _accessToken: string,
  fechamentoId: string,
): Promise<AdminFechamentoCompetenciaRow> {
  void _accessToken
  const row = fechamentosState.find((item) => item.id === fechamentoId)
  if (!row) throw new AdminFinanceiroApiError('Fechamento não encontrado.', 404)
  row.status = 'fechado'
  return mockDelay(clone(row), 70)
}

export async function toggleFinanceiroReceberPagamento(
  _accessToken: string,
  fechamentoId: string,
  _pin: string,
): Promise<AdminFechamentoCompetenciaRow> {
  void _accessToken
  void _pin
  const row = fechamentosState.find((item) => item.id === fechamentoId)
  if (!row) throw new AdminFinanceiroApiError('Recebível não encontrado.', 404)
  row.statusVencimento = row.statusVencimento === 'paga' ? 'a_vencer' : 'paga'
  return mockDelay(clone(row), 70)
}

export async function deleteFinanceiroReceber(
  _accessToken: string,
  fechamentoId: string,
  _pin: string,
): Promise<void> {
  void _accessToken
  void _pin
  fechamentosState = fechamentosState.filter((item) => item.id !== fechamentoId)
  return mockDelay(undefined, 60)
}

export async function emitFinanceiroNotaFiscal(
  _accessToken: string,
  fechamentoId: string,
): Promise<NotaFiscalApi> {
  void _accessToken
  return mockDelay(
    {
      status: 'issued',
      invoiceNumber: `NF-${fechamentoId.slice(-4).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      downloadUrl: `/mock/nf/${fechamentoId}.pdf`,
    },
    80,
  )
}

export async function fetchFinanceiroNotaFiscalDownloadUrl(
  _accessToken: string,
  fechamentoId: string,
): Promise<string> {
  void _accessToken
  return mockDelay(`/mock/nf/${fechamentoId}.pdf`, 40)
}

export async function fetchFinanceiroCentrosCusto(
  _accessToken: string,
): Promise<AdminCentroCusto[]> {
  void _accessToken
  return mockDelay(ensureRows(clone(centrosState)), 50)
}

export async function createFinanceiroCentroCusto(
  _accessToken: string,
  nome: string,
): Promise<AdminCentroCusto> {
  void _accessToken
  const row = { id: `cc-${Date.now()}`, nome }
  centrosState = [row, ...centrosState]
  return mockDelay(clone(row), 60)
}

export async function fetchFinanceiroFornecedores(
  _accessToken: string,
): Promise<AdminFornecedorRow[]> {
  void _accessToken
  return mockDelay(ensureRows(clone(fornecedoresState)), 50)
}

export function upsertFornecedorForRepasse(pjCnpj: string, pjRazaoSocial: string): string {
  const digits = pjCnpj.replace(/\D/g, '')
  const match = fornecedoresState.find((item) => item.cnpj.replace(/\D/g, '') === digits)
  if (match) return match.id

  const novo: AdminFornecedorRow = {
    id: `forn-repasse-${digits.slice(0, 8)}`,
    cnpj: pjCnpj,
    razaoSocial: pjRazaoSocial,
    situacao: 'ativa',
    contatoEmail: '',
    contatoTelefone: '',
    pessoaContato: '',
    observacoes: 'Gerado automaticamente pelo repasse de profissionais.',
  }
  fornecedoresState = [novo, ...fornecedoresState]
  return novo.id
}

export async function createFinanceiroFornecedor(
  _accessToken: string,
  payload: Omit<AdminFornecedorRow, 'id'>,
): Promise<AdminFornecedorRow> {
  void _accessToken
  const row = { ...payload, id: `forn-${Date.now()}` }
  fornecedoresState = [row, ...fornecedoresState]
  return mockDelay(clone(row), 60)
}

export async function updateFinanceiroFornecedor(
  _accessToken: string,
  payload: AdminFornecedorRow,
): Promise<AdminFornecedorRow> {
  fornecedoresState = fornecedoresState.map((item) => (item.id === payload.id ? payload : item))
  return mockDelay(clone(payload), 60)
}

export async function deleteFinanceiroFornecedor(
  _accessToken: string,
  fornecedorId: string,
  _pin: string,
): Promise<void> {
  void _accessToken
  void _pin
  fornecedoresState = fornecedoresState.filter((item) => item.id !== fornecedorId)
  return mockDelay(undefined, 60)
}

export async function lookupFinanceiroCnpj(
  _accessToken: string,
  cnpjDigits: string,
): Promise<CnpjLookupResponse> {
  void _accessToken
  const normalized = cnpjDigits.replace(/\D/g, '')
  const match = fornecedoresState.find((item) => item.cnpj.replace(/\D/g, '') === normalized)
  return mockDelay(
    match
      ? {
          razaoSocial: match.razaoSocial,
          situacao: match.situacao,
          contatoEmail: match.contatoEmail,
          contatoTelefone: match.contatoTelefone,
          pessoaContato: match.pessoaContato,
        }
      : {},
    50,
  )
}

export async function fetchFinanceiroContasPagar(
  _accessToken: string,
): Promise<AdminContaPagarRow[]> {
  void _accessToken
  return mockDelay(ensureRows(clone(pagarState)), 50)
}

export async function createFinanceiroContaPagar(
  _accessToken: string,
  payload: {
    fornecedorId: string
    descricao: string
    centroCustoId: string
    recorrencia: AdminContaPagarRecorrencia
    valor: number
    vencimento: string
  },
): Promise<AdminContaPagarRow> {
  void _accessToken
  const row: AdminContaPagarRow = {
    id: `cp-${Date.now()}`,
    fornecedorId: payload.fornecedorId,
    descricao: payload.descricao,
    centroCustoId: payload.centroCustoId,
    recorrencia: payload.recorrencia,
    valor: payload.valor,
    vencimento: payload.vencimento,
    status: 'pendente',
  }
  pagarState = [row, ...pagarState]
  return mockDelay(clone(row), 60)
}

export async function appendFinanceiroContaPagar(
  _accessToken: string,
  row: AdminContaPagarRow,
): Promise<AdminContaPagarRow> {
  void _accessToken
  pagarState = [row, ...pagarState]
  return mockDelay(clone(row), 60)
}

export async function updateFinanceiroContaPagar(
  _accessToken: string,
  contaId: string,
  _pin: string,
  payload: {
    descricao: string
    centroCustoId: string
    recorrencia: AdminContaPagarRecorrencia
    valor: number
    vencimento: string
  },
): Promise<AdminContaPagarRow> {
  void _accessToken
  void _pin
  const row = pagarState.find((item) => item.id === contaId)
  if (!row) throw new AdminFinanceiroApiError('Conta não encontrada.', 404)
  row.descricao = payload.descricao
  row.centroCustoId = payload.centroCustoId
  row.recorrencia = payload.recorrencia
  row.valor = payload.valor
  row.vencimento = payload.vencimento
  return mockDelay(clone(row), 60)
}

export async function toggleFinanceiroContaPagarPagamento(
  _accessToken: string,
  contaId: string,
  _pin: string,
): Promise<AdminContaPagarRow> {
  void _accessToken
  void _pin
  const row = pagarState.find((item) => item.id === contaId)
  if (!row) throw new AdminFinanceiroApiError('Conta não encontrada.', 404)
  row.status = row.status === 'pago' ? 'pendente' : 'pago'
  return mockDelay(clone(row), 60)
}

export async function deleteFinanceiroContaPagar(
  _accessToken: string,
  contaId: string,
  _pin: string,
): Promise<void> {
  void _accessToken
  void _pin
  pagarState = pagarState.filter((item) => item.id !== contaId)
  return mockDelay(undefined, 50)
}

function buildBalanco(): BalancoResponse {
  const receita = fechamentosState.reduce((sum, row) => sum + row.valorFinal, 0)
  const despesa = pagarState.reduce((sum, row) => sum + row.valor, 0)
  const despesasPagas = pagarState
    .filter((row) => row.status === 'pago')
    .reduce((sum, row) => sum + row.valor, 0)
  const totalEmAtrasoReceber = fechamentosState
    .filter((row) => row.statusVencimento === 'atrasada')
    .reduce((sum, row) => sum + row.valorFinal, 0)
  const despesasPorCentro = centrosState.map((centro) => {
    const valorBase = pagarState
      .filter((item) => item.centroCustoId === centro.id)
      .reduce((sum, item) => sum + item.valor, 0)
    const ajuste = balancoAjustes.get(centro.id) ?? 0
    return {
      id: centro.id,
      nome: centro.nome,
      valorBase,
      ajuste,
      valor: valorBase + ajuste,
    }
  })
  const resultado = receita - despesa
  return {
    receita,
    despesa,
    resultado,
    lucratividadePercentual: receita ? Number(((resultado / receita) * 100).toFixed(2)) : 0,
    despesasPagas,
    totalEmAtrasoReceber,
    despesasPorCentro,
  }
}

export async function fetchFinanceiroBalanco(
  _accessToken: string,
  _params: {
    viewMode?: 'consolidado' | 'competencia' | 'periodo'
    competencia?: string
    dataInicial?: string
    dataFinal?: string
  } = {},
): Promise<BalancoResponse> {
  void _accessToken
  void _params
  return mockDelay(buildBalanco(), 60)
}

export async function upsertFinanceiroBalancoAjuste(
  _accessToken: string,
  centroId: string,
  valorConsolidado: number,
): Promise<BalancoResponse> {
  void _accessToken
  balancoAjustes.set(centroId, valorConsolidado)
  return mockDelay(buildBalanco(), 60)
}

export async function clearFinanceiroBalancoAjuste(
  _accessToken: string,
  centroId: string,
  _pin: string,
): Promise<BalancoResponse> {
  void _accessToken
  void _pin
  balancoAjustes.delete(centroId)
  return mockDelay(buildBalanco(), 60)
}

export type { AdminFechamentoCompetenciaRow, AdminContaReceberStatusVencimento }
