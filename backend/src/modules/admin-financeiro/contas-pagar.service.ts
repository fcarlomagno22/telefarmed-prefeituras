import { verifyAdminAuthorizationPin } from '../admin-auth/service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { formatContaPagar } from './formatters.js'
import { parseDateBrToIso, reaisToCentavos } from './money.js'
import { FinanceiroError } from './errors.js'
import type { ContaPagarDto, ContaPagarRecorrencia } from './types.js'

const FECHAMENTO_SELECT = `
  id,
  fornecedor_id,
  descricao,
  centro_custo_id,
  recorrencia,
  valor_centavos,
  vencimento,
  status,
  origem,
  profissional_fechamento_id,
  motivo_ajuste,
  repasse_conferencia_status,
  repasse_snapshot
`

export async function listContasPagar(): Promise<ContaPagarDto[]> {
  const { data, error } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .select(FECHAMENTO_SELECT)
    .order('vencimento', { ascending: false })

  if (error) throw error
  return (data ?? []).map(formatContaPagar)
}

export async function createContaPagar(input: {
  fornecedorId: string
  descricao: string
  centroCustoId: string
  recorrencia: ContaPagarRecorrencia
  valor: number
  vencimento: string
}): Promise<ContaPagarDto> {
  const vencimentoIso = parseDateBrToIso(input.vencimento)

  const { data, error } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .insert({
      fornecedor_id: input.fornecedorId,
      descricao: input.descricao.trim(),
      centro_custo_id: input.centroCustoId,
      recorrencia: input.recorrencia,
      valor_centavos: reaisToCentavos(input.valor),
      vencimento: vencimentoIso,
      status: 'pendente',
      origem: 'manual',
    })
    .select(FECHAMENTO_SELECT)
    .single()

  if (error) throw error
  if (!data) throw new FinanceiroError('Não foi possível criar conta a pagar.', 'INVALID_DATA', 500)
  return formatContaPagar(data)
}

export async function updateContaPagar(
  adminId: string,
  contaId: string,
  pin: string,
  input: {
    descricao: string
    centroCustoId: string
    recorrencia: ContaPagarRecorrencia
    valor: number
    vencimento: string
    motivoAjuste?: string
  },
): Promise<ContaPagarDto> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { data: existing, error: findError } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .select('origem, valor_centavos')
    .eq('id', contaId)
    .maybeSingle()

  if (findError) throw findError
  if (!existing) throw new FinanceiroError('Conta não encontrada.', 'NOT_FOUND', 404)

  const novoValor = reaisToCentavos(input.valor)
  if (
    existing.origem === 'repasse_profissional' &&
    novoValor !== Number(existing.valor_centavos) &&
    !input.motivoAjuste?.trim()
  ) {
    throw new FinanceiroError(
      'Informe o motivo do ajuste de valor em conta de repasse.',
      'INVALID_DATA',
      400,
    )
  }

  const { data, error } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .update({
      descricao: input.descricao.trim(),
      centro_custo_id: input.centroCustoId,
      recorrencia: input.recorrencia,
      valor_centavos: novoValor,
      vencimento: parseDateBrToIso(input.vencimento),
      motivo_ajuste: input.motivoAjuste?.trim() ?? '',
    })
    .eq('id', contaId)
    .select(FECHAMENTO_SELECT)
    .single()

  if (error) throw error
  if (!data) throw new FinanceiroError('Conta não encontrada.', 'NOT_FOUND', 404)
  return formatContaPagar(data)
}

export async function toggleContaPagarPagamento(
  adminId: string,
  contaId: string,
  pin: string,
): Promise<ContaPagarDto> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { data: existing, error: findError } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .select('status')
    .eq('id', contaId)
    .maybeSingle()

  if (findError) throw findError
  if (!existing) throw new FinanceiroError('Conta não encontrada.', 'NOT_FOUND', 404)

  const nextStatus = existing.status === 'pago' ? 'pendente' : 'pago'

  const { data, error } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .update({ status: nextStatus })
    .eq('id', contaId)
    .select(FECHAMENTO_SELECT)
    .single()

  if (error) throw error
  if (!data) throw new FinanceiroError('Conta não encontrada.', 'NOT_FOUND', 404)
  return formatContaPagar(data)
}

export async function deleteContaPagar(
  adminId: string,
  contaId: string,
  pin: string,
): Promise<void> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { data: existing } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .select('origem, profissional_fechamento_id')
    .eq('id', contaId)
    .maybeSingle()

  if (!existing) throw new FinanceiroError('Conta não encontrada.', 'NOT_FOUND', 404)

  const { error } = await supabaseAdmin.from('financeiro_contas_pagar').delete().eq('id', contaId)
  if (error) throw error

  if (existing.profissional_fechamento_id) {
    await supabaseAdmin
      .from('profissional_fechamento_competencia')
      .update({
        conta_pagar_id: null,
        status: 'em_analise',
        approved_at: null,
      })
      .eq('id', existing.profissional_fechamento_id)
  }
}
