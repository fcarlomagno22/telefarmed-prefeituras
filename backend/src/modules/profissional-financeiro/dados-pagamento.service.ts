import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { validatePixKey, type PixKeyType } from '../profissional-cadastro/pix.validation.js'
import { ProfissionalFinanceiroError } from './errors.js'
import { formatDadosPagamentoApi } from './formatters.js'
import type { DadosPagamentoRow, ProfissionalFinanceiroContext } from './types.js'
import type { UpdateDadosPagamentoBody } from './schemas.js'

function normalizePixTipo(value: string): PixKeyType {
  if (value === 'email' || value === 'telefone' || value === 'aleatoria') return value
  return 'cnpj'
}

async function loadProfissionalPjFallback(profissionalId: string): Promise<Partial<DadosPagamentoRow>> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('nome, dados_pj')
    .eq('id', profissionalId)
    .maybeSingle()

  if (error || !data) return {}

  const pj = data.dados_pj as Record<string, unknown> | null
  const bancarios = (pj?.dadosBancarios ?? pj?.dados_bancarios) as Record<string, unknown> | undefined

  return {
    profissional_id: profissionalId,
    pix_tipo: String(bancarios?.pixKeyType ?? bancarios?.pix_tipo ?? 'cnpj'),
    pix_chave: String(bancarios?.pixKey ?? bancarios?.pix_chave ?? ''),
    banco_nome: String(bancarios?.bankName ?? bancarios?.banco_nome ?? ''),
    banco_codigo: String(bancarios?.bankCode ?? bancarios?.banco_codigo ?? ''),
    agencia: String(bancarios?.agency ?? bancarios?.agencia ?? ''),
    conta: String(bancarios?.account ?? bancarios?.conta ?? ''),
    tipo_conta: String(bancarios?.accountType ?? bancarios?.tipo_conta ?? 'corrente'),
    titular: String(pj?.razaoSocial ?? pj?.razao_social ?? data.nome ?? ''),
  }
}

export async function getProfissionalDadosPagamento(ctx: ProfissionalFinanceiroContext) {
  const { data, error } = await supabaseAdmin
    .from('profissional_dados_pagamento')
    .select('*')
    .eq('profissional_id', ctx.profissionalId)
    .maybeSingle()

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_dados_pagamento')) {
      throw new ProfissionalFinanceiroError(
        'Módulo financeiro indisponível.',
        'SERVICE_UNAVAILABLE',
        503,
      )
    }
    throw error
  }

  if (data) {
    return formatDadosPagamentoApi(data as DadosPagamentoRow)
  }

  const fallback = await loadProfissionalPjFallback(ctx.profissionalId)
  return formatDadosPagamentoApi({
    id: '',
    profissional_id: ctx.profissionalId,
    pix_tipo: fallback.pix_tipo ?? '',
    pix_chave: fallback.pix_chave ?? '',
    banco_nome: fallback.banco_nome ?? '',
    banco_codigo: fallback.banco_codigo ?? '',
    agencia: fallback.agencia ?? '',
    conta: fallback.conta ?? '',
    tipo_conta: fallback.tipo_conta ?? '',
    titular: fallback.titular ?? '',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  })
}

export async function updateProfissionalDadosPagamento(
  ctx: ProfissionalFinanceiroContext,
  body: UpdateDadosPagamentoBody,
) {
  const patch: Record<string, string> = {}

  if (body.pixTipo !== undefined) patch.pix_tipo = body.pixTipo.trim()
  if (body.pixChave !== undefined) {
    const tipo = normalizePixTipo(body.pixTipo ?? patch.pix_tipo ?? 'cnpj')
    patch.pix_chave = validatePixKey(tipo, body.pixChave)
    if (body.pixTipo !== undefined) patch.pix_tipo = body.pixTipo.trim()
  }
  if (body.bancoNome !== undefined) patch.banco_nome = body.bancoNome
  if (body.bancoCodigo !== undefined) patch.banco_codigo = body.bancoCodigo
  if (body.agencia !== undefined) patch.agencia = body.agencia
  if (body.conta !== undefined) patch.conta = body.conta
  if (body.tipoConta !== undefined) patch.tipo_conta = body.tipoConta
  if (body.titular !== undefined) patch.titular = body.titular

  if (Object.keys(patch).length === 0) {
    throw new ProfissionalFinanceiroError('Nenhum campo para atualizar.', 'INVALID_DATA', 400)
  }

  const { data: existing } = await supabaseAdmin
    .from('profissional_dados_pagamento')
    .select('id')
    .eq('profissional_id', ctx.profissionalId)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await supabaseAdmin
      .from('profissional_dados_pagamento')
      .update(patch)
      .eq('profissional_id', ctx.profissionalId)
      .select('*')
      .single()

    if (error) throw error
    return formatDadosPagamentoApi(data as DadosPagamentoRow)
  }

  const fallback = await loadProfissionalPjFallback(ctx.profissionalId)
  const { data, error } = await supabaseAdmin
    .from('profissional_dados_pagamento')
    .insert({
      profissional_id: ctx.profissionalId,
      pix_tipo: patch.pix_tipo ?? fallback.pix_tipo ?? '',
      pix_chave: patch.pix_chave ?? fallback.pix_chave ?? '',
      banco_nome: patch.banco_nome ?? fallback.banco_nome ?? '',
      banco_codigo: patch.banco_codigo ?? fallback.banco_codigo ?? '',
      agencia: patch.agencia ?? fallback.agencia ?? '',
      conta: patch.conta ?? fallback.conta ?? '',
      tipo_conta: patch.tipo_conta ?? fallback.tipo_conta ?? '',
      titular: patch.titular ?? fallback.titular ?? '',
    })
    .select('*')
    .single()

  if (error) throw error
  return formatDadosPagamentoApi(data as DadosPagamentoRow)
}
