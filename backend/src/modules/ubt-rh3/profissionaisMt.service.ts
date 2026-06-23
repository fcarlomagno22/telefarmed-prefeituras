import { supabaseAdmin } from '../../db/supabase.js'
import { consultarCrmPorNome, isConsultarCrmConfigured } from '../../lib/consultarCrm/index.js'
import { buildProfissionalCboFields, normalizeFormacaoForCbo, resolveFormacaoCboSync } from '../../lib/faturamento/formacaoCbo.js'
import { UbtRh3Error } from './errors.js'

export type UpsertProfissionalMtInput = {
  nome: string
  especialidade: string
  conselhoSigla?: string | null
  conselhoNumero?: string | null
  conselhoUf?: string | null
  cns?: string | null
  cboCodigo?: string | null
  cboDescricao?: string | null
  formacao?: string | null
  rh3ProfessionalId?: number | null
}

function normalizeProfissionalMtField(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function pickDefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

function hasProfissionalMtCrmCached(row: {
  conselho_numero?: string | null
  conselho_uf?: string | null
}): boolean {
  return Boolean(row.conselho_numero?.trim() && row.conselho_uf?.trim())
}

async function ensureProfissionalMtCrmFromConsultar(
  profissionalMtId: string,
  nome: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('profissionais_mt')
    .select('conselho_numero, conselho_uf')
    .eq('id', profissionalMtId)
    .maybeSingle()

  if (error) throw error
  if (hasProfissionalMtCrmCached(data ?? {})) return
  if (!isConsultarCrmConfigured()) return

  try {
    const resolved = await consultarCrmPorNome(nome)
    if (!resolved) return

    const { error: updateError } = await supabaseAdmin
      .from('profissionais_mt')
      .update({
        conselho_sigla: resolved.conselhoSigla,
        conselho_numero: resolved.conselhoNumero,
        conselho_uf: resolved.conselhoUf,
      })
      .eq('id', profissionalMtId)

    if (updateError) throw updateError
  } catch (lookupError) {
    console.warn(
      '[profissionais_mt] Falha ao consultar CRM via Consultar.io:',
      lookupError instanceof Error ? lookupError.message : lookupError,
    )
  }
}

function buildSusPatch(input: UpsertProfissionalMtInput): Record<string, unknown> {
  const formacao = normalizeFormacaoForCbo(input.formacao, input.especialidade)
  const cbo = resolveFormacaoCboSync(input.formacao, input.especialidade)

  return pickDefined({
    conselho_sigla: input.conselhoSigla?.trim() || undefined,
    conselho_numero: input.conselhoNumero?.trim() || undefined,
    conselho_uf: input.conselhoUf?.trim().toUpperCase() || undefined,
    cns: input.cns?.replace(/\D/g, '') || undefined,
    formacao,
    cbo_codigo: cbo.codigo,
    cbo_descricao: cbo.descricao,
    rh3_professional_id: input.rh3ProfessionalId ?? undefined,
  })
}

export async function upsertProfissionalMt(input: UpsertProfissionalMtInput): Promise<string> {
  const normalizedNome = normalizeProfissionalMtField(input.nome)
  const normalizedEspecialidade = normalizeProfissionalMtField(input.especialidade)

  if (!normalizedNome || !normalizedEspecialidade) {
    throw new UbtRh3Error(
      'Nome e especialidade do profissional MT são obrigatórios.',
      'MT_PROFESSIONAL_INVALID',
      400,
    )
  }

  const susPatch = buildSusPatch(input)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('profissionais_mt')
    .select('id, conselho_numero, conselho_uf')
    .eq('nome', normalizedNome)
    .eq('especialidade', normalizedEspecialidade)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing?.id) {
    if (Object.keys(susPatch).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profissionais_mt')
        .update(susPatch)
        .eq('id', existing.id)

      if (updateError) throw updateError
    }

    await ensureProfissionalMtCrmFromConsultar(String(existing.id), normalizedNome)
    return String(existing.id)
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('profissionais_mt')
    .insert({
      nome: normalizedNome,
      especialidade: normalizedEspecialidade,
      conselho_sigla: input.conselhoSigla?.trim() || 'CRM',
      ...susPatch,
    })
    .select('id')
    .single()

  if (!insertError && inserted?.id) {
    const profissionalMtId = String(inserted.id)
    await ensureProfissionalMtCrmFromConsultar(profissionalMtId, normalizedNome)
    return profissionalMtId
  }

  if (insertError && insertError.code !== '23505') {
    throw insertError
  }

  const { data: raced, error: racedError } = await supabaseAdmin
    .from('profissionais_mt')
    .select('id')
    .eq('nome', normalizedNome)
    .eq('especialidade', normalizedEspecialidade)
    .maybeSingle()

  if (racedError) throw racedError
  if (!raced?.id) {
    throw new UbtRh3Error(
      'Falha ao registrar profissional terceirizado.',
      'MT_PROFESSIONAL_PERSIST_FAILED',
      500,
    )
  }

  if (Object.keys(susPatch).length > 0) {
    await supabaseAdmin.from('profissionais_mt').update(susPatch).eq('id', raced.id)
  }

  const profissionalMtId = String(raced.id)
  await ensureProfissionalMtCrmFromConsultar(profissionalMtId, normalizedNome)
  return profissionalMtId
}

export async function syncProfissionalMtFromUsuarioProfissional(
  profissionalId: string,
  especialidadeNome: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select(
      'nome, conselho_sigla, conselho_numero, conselho_uf, formacao, cbo_codigo, cbo_descricao, cns',
    )
    .eq('id', profissionalId)
    .maybeSingle()

  if (error) throw error
  if (!data?.nome) {
    throw new UbtRh3Error(
      'Profissional local não encontrado para sincronizar cadastro MT.',
      'MT_PROFESSIONAL_NOT_FOUND',
      404,
    )
  }

  const formacao = data.formacao ? String(data.formacao) : 'medicina'
  const cbo = await buildProfissionalCboFields(formacao, especialidadeNome)

  return upsertProfissionalMt({
    nome: String(data.nome),
    especialidade: especialidadeNome,
    conselhoSigla: data.conselho_sigla ? String(data.conselho_sigla) : null,
    conselhoNumero: data.conselho_numero ? String(data.conselho_numero) : null,
    conselhoUf: data.conselho_uf ? String(data.conselho_uf) : null,
    formacao: cbo.formacao,
    cboCodigo: cbo.cbo_codigo,
    cboDescricao: cbo.cbo_descricao,
    cns: data.cns ? String(data.cns) : null,
  })
}

export async function updateProfissionalMtSusFields(
  profissionalMtId: string,
  patch: {
    conselhoSigla?: string
    conselhoNumero?: string
    conselhoUf?: string
    cns?: string
    cboCodigo?: string
    cboDescricao?: string
  },
): Promise<void> {
  const payload = pickDefined({
    conselho_sigla: patch.conselhoSigla?.trim(),
    conselho_numero: patch.conselhoNumero?.trim(),
    conselho_uf: patch.conselhoUf?.trim().toUpperCase(),
    cns: patch.cns?.replace(/\D/g, ''),
    cbo_codigo: patch.cboCodigo?.trim(),
    cbo_descricao: patch.cboDescricao?.trim(),
  })

  if (Object.keys(payload).length === 0) return

  const { error } = await supabaseAdmin
    .from('profissionais_mt')
    .update(payload)
    .eq('id', profissionalMtId)

  if (error) throw error
}

export async function loadLocalEspecialidadeNome(especialidadeId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('config_especialidades')
    .select('nome')
    .eq('id', especialidadeId)
    .maybeSingle()

  if (error) throw error
  const nome = data?.nome?.trim()
  if (!nome) {
    throw new UbtRh3Error('Especialidade não encontrada.', 'SPECIALTY_NOT_FOUND', 404)
  }

  return nome
}
