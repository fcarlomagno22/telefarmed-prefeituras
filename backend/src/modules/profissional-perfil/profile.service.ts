import { supabaseAdmin } from '../../db/supabase.js'
import { createProfissionalFotoSignedUrl } from '../admin-profissionais/documentos.service.js'
import { isValidCnpj, normalizeCnpj } from '../../lib/cnpj.js'
import { normalizeCpf } from '../../lib/cpf.js'
import { parseBirthDateBr } from '../profissional-cadastro/schemas.js'
import { validatePixKey, type PixKeyType } from '../profissional-cadastro/pix.validation.js'
import { ProfissionalPerfilError } from './errors.js'
import { mapProfissionalPerfilDto } from './formatters.js'
import { updateProfissionalFoto } from './foto.service.js'
import type { PatchProfissionalPerfilBody } from './schemas.js'
import type { ProfissionalPerfilContext, ProfissionalPerfilDto } from './types.js'

const PROFISSIONAL_SELECT =
  'id, cpf, nome, email, telefone, rg, formacao, especialidade, conselho_numero, conselho_uf, rqe, bio, endereco, dados_pj, assinatura, foto_storage_path, data_nascimento, rating_media, rating_total, plantao_rotulo, online_ate'

async function loadCandidaturaId(profissionalId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .select('id')
    .eq('profissional_id', profissionalId)
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.id ? String(data.id) : null
}

async function loadDocuments(candidaturaId: string | null) {
  if (!candidaturaId) return []

  const { data, error } = await supabaseAdmin
    .from('candidatura_documentos')
    .select('id, tipo, rotulo, nome_arquivo, criado_em, status')
    .eq('candidatura_id', candidaturaId)
    .order('criado_em', { ascending: true })

  if (error) throw error
  return data ?? []
}

async function countAttendances(profissionalId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('consultas_clinicas')
    .select('id', { count: 'exact', head: true })
    .eq('profissional_id', profissionalId)
    .in('status', ['concluida'])

  if (error) {
    if (error.message?.includes('consultas_clinicas')) return 0
    throw error
  }
  return count ?? 0
}

async function loadPagamento(profissionalId: string) {
  const { data, error } = await supabaseAdmin
    .from('profissional_dados_pagamento')
    .select(
      'pix_tipo, pix_chave, banco_nome, banco_codigo, agencia, conta, tipo_conta, titular',
    )
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getProfissionalPerfil(
  ctx: ProfissionalPerfilContext,
): Promise<ProfissionalPerfilDto> {
  const { data: row, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select(PROFISSIONAL_SELECT)
    .eq('id', ctx.profissionalId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) throw error
  if (!row) {
    throw new ProfissionalPerfilError('Profissional não encontrado.', 'NOT_FOUND', 404)
  }

  const [pagamento, candidaturaId, totalAttendances] = await Promise.all([
    loadPagamento(ctx.profissionalId),
    loadCandidaturaId(ctx.profissionalId),
    countAttendances(ctx.profissionalId),
  ])
  const documents = await loadDocuments(candidaturaId)
  const avatarUrl = (await createProfissionalFotoSignedUrl(row.foto_storage_path)) ?? null

  return mapProfissionalPerfilDto({
    row,
    pagamento,
    documents,
    avatarUrl,
    totalAttendances,
  })
}

function normalizePixTipo(value: string): PixKeyType {
  if (value === 'email' || value === 'telefone' || value === 'aleatoria') return value
  return 'cnpj'
}

function normalizeBirthDateInput(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return parseBirthDateBr(value)
}

async function syncDadosPagamento(
  profissionalId: string,
  body: PatchProfissionalPerfilBody,
  currentPj: Record<string, unknown>,
): Promise<void> {
  const patch: Record<string, string> = {}
  const pixTipoInput = body.pixKeyType ?? String(currentPj.pixTipo ?? currentPj.pix_tipo ?? 'cnpj')

  if (body.pixKeyType !== undefined) patch.pix_tipo = body.pixKeyType
  if (body.pixKey !== undefined) {
    patch.pix_chave = validatePixKey(normalizePixTipo(pixTipoInput), body.pixKey)
    if (body.pixKeyType !== undefined) patch.pix_tipo = body.pixKeyType
  }
  if (body.bankCode !== undefined) patch.banco_codigo = body.bankCode
  if (body.agency !== undefined) patch.agencia = body.agency
  if (body.account !== undefined) patch.conta = body.account
  if (body.accountType !== undefined) patch.tipo_conta = body.accountType
  if (body.razaoSocial !== undefined) patch.titular = body.razaoSocial.trim()

  if (Object.keys(patch).length === 0) return

  const { data: existing } = await supabaseAdmin
    .from('profissional_dados_pagamento')
    .select('id')
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from('profissional_dados_pagamento')
      .update(patch)
      .eq('profissional_id', profissionalId)
    if (error) throw error
    return
  }

  const { error } = await supabaseAdmin.from('profissional_dados_pagamento').insert({
    profissional_id: profissionalId,
    pix_tipo: patch.pix_tipo ?? 'cnpj',
    pix_chave: patch.pix_chave ?? '',
    banco_nome: patch.banco_nome ?? '',
    banco_codigo: patch.banco_codigo ?? '',
    agencia: patch.agencia ?? '',
    conta: patch.conta ?? '',
    tipo_conta: patch.tipo_conta ?? 'corrente',
    titular: patch.titular ?? '',
  })
  if (error) throw error
}

export async function patchProfissionalPerfil(
  ctx: ProfissionalPerfilContext,
  body: PatchProfissionalPerfilBody,
): Promise<ProfissionalPerfilDto> {
  const { data: current, error: currentError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, dados_pj, endereco')
    .eq('id', ctx.profissionalId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (currentError) throw currentError
  if (!current) {
    throw new ProfissionalPerfilError('Profissional não encontrado.', 'NOT_FOUND', 404)
  }

  if (body.fotoDataUrl) {
    await updateProfissionalFoto(ctx.profissionalId, body.fotoDataUrl)
  }

  const patch: Record<string, unknown> = {}
  if (body.fullName !== undefined) patch.nome = body.fullName.trim()
  if (body.specialty !== undefined) patch.especialidade = body.specialty.trim()
  if (body.rqe !== undefined) patch.rqe = body.rqe.trim()
  if (body.phone !== undefined) patch.telefone = body.phone.trim()
  if (body.professionalDescription !== undefined) patch.bio = body.professionalDescription.trim()
  if (body.bio !== undefined) patch.bio = body.bio.trim()

  if (body.cpf !== undefined) {
    try {
      patch.cpf = normalizeCpf(body.cpf)
    } catch {
      throw new ProfissionalPerfilError('CPF inválido.', 'INVALID_DATA', 400)
    }
  }
  if (body.birthDate !== undefined) {
    try {
      patch.data_nascimento = normalizeBirthDateInput(body.birthDate)
    } catch {
      throw new ProfissionalPerfilError('Data de nascimento inválida.', 'INVALID_DATA', 400)
    }
  }
  if (body.conselhoRegistro !== undefined) {
    patch.conselho_numero = body.conselhoRegistro.trim()
  }
  if (body.conselhoUf !== undefined) {
    patch.conselho_uf = body.conselhoUf.trim().toUpperCase()
  }

  if (body.professionalAddress !== undefined) {
    const endereco =
      current.endereco && typeof current.endereco === 'object'
        ? { ...(current.endereco as Record<string, unknown>) }
        : {}
    endereco.formatted = body.professionalAddress.trim()
    patch.endereco = endereco
  }

  const currentPj =
    current.dados_pj && typeof current.dados_pj === 'object'
      ? ({ ...(current.dados_pj as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  let pjChanged = false
  if (body.razaoSocial !== undefined) {
    currentPj.razaoSocial = body.razaoSocial.trim()
    pjChanged = true
  }
  if (body.cnpj !== undefined) {
    const cnpj = normalizeCnpj(body.cnpj)
    if (!isValidCnpj(cnpj)) {
      throw new ProfissionalPerfilError('CNPJ inválido.', 'INVALID_DATA', 400)
    }
    currentPj.cnpj = cnpj
    pjChanged = true
  }
  if (body.bankCode !== undefined) {
    currentPj.bancoCodigo = body.bankCode.trim()
    pjChanged = true
  }
  if (body.agency !== undefined) {
    currentPj.agencia = body.agency.trim()
    pjChanged = true
  }
  if (body.account !== undefined) {
    currentPj.conta = body.account.trim()
    pjChanged = true
  }
  if (body.accountType !== undefined) {
    currentPj.tipoConta = body.accountType
    pjChanged = true
  }
  if (body.pixKeyType !== undefined) {
    currentPj.pixTipo = body.pixKeyType
    pjChanged = true
  }
  if (body.pixKey !== undefined) {
    const tipo = normalizePixTipo(String(body.pixKeyType ?? currentPj.pixTipo ?? 'cnpj'))
    currentPj.pixChave = validatePixKey(tipo, body.pixKey)
    pjChanged = true
  }

  if (pjChanged) patch.dados_pj = currentPj

  if (Object.keys(patch).length > 0) {
    const { error } = await supabaseAdmin
      .from('usuarios_profissionais')
      .update(patch)
      .eq('id', ctx.profissionalId)
    if (error) throw error
  }

  await syncDadosPagamento(ctx.profissionalId, body, currentPj)

  return getProfissionalPerfil(ctx)
}
