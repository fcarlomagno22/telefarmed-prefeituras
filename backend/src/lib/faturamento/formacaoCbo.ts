import { supabaseAdmin } from '../../db/supabase.js'

export const FORMACAO_CBO_DEFAULTS = {
  medicina: { codigo: '225125', descricao: 'Medico clinico' },
  psicologia: { codigo: '251510', descricao: 'Psicologo clinico' },
  nutricao: { codigo: '223710', descricao: 'Nutricionista' },
  fonoaudiologia: { codigo: '223810', descricao: 'Fonoaudiologo' },
} as const

export type FormacaoCboKey = keyof typeof FORMACAO_CBO_DEFAULTS

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function inferFormacaoFromEspecialidadeNome(
  especialidadeNome: string | null | undefined,
): FormacaoCboKey {
  const normalized = normalizeText(especialidadeNome ?? '')
  if (!normalized) return 'medicina'
  if (normalized.includes('psicolog')) return 'psicologia'
  if (normalized.includes('nutric') || normalized.includes('nutrolog')) return 'nutricao'
  if (normalized.includes('fonoaud')) return 'fonoaudiologia'
  return 'medicina'
}

export function normalizeFormacaoForCbo(
  formacao: string | null | undefined,
  especialidadeNome?: string | null,
): FormacaoCboKey {
  const normalizedFormacao = formacao?.trim() as FormacaoCboKey
  if (normalizedFormacao && FORMACAO_CBO_DEFAULTS[normalizedFormacao]) {
    return normalizedFormacao
  }
  return inferFormacaoFromEspecialidadeNome(especialidadeNome)
}

export function getFormacaoCboCodigo(
  formacao: string | null | undefined,
  especialidadeNome?: string | null,
): string {
  return resolveFormacaoCboSync(formacao, especialidadeNome).codigo
}

export function resolveFormacaoCboSync(
  formacao: string | null | undefined,
  especialidadeNome?: string | null,
): { codigo: string; descricao: string; formacao: FormacaoCboKey } {
  const normalized = normalizeFormacaoForCbo(formacao, especialidadeNome)
  const defaults = FORMACAO_CBO_DEFAULTS[normalized]
  return {
    formacao: normalized,
    codigo: defaults.codigo,
    descricao: defaults.descricao,
  }
}

async function resolveOcupacaoDescricao(codigo: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('config_sigtap_ocupacao')
    .select('nome')
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) throw error
  return data?.nome ? String(data.nome) : null
}

export async function resolveFormacaoCbo(
  formacao: string | null | undefined,
  especialidadeNome?: string | null,
): Promise<{
  codigo: string
  descricao: string
  formacao: FormacaoCboKey
}> {
  const sync = resolveFormacaoCboSync(formacao, especialidadeNome)
  const descricao = (await resolveOcupacaoDescricao(sync.codigo)) ?? sync.descricao
  return {
    formacao: sync.formacao,
    codigo: sync.codigo,
    descricao,
  }
}

export async function buildProfissionalCboFields(
  formacao: string | null | undefined,
  especialidadeNome?: string | null,
): Promise<{
  cbo_codigo: string
  cbo_descricao: string
  formacao: FormacaoCboKey
}> {
  const resolved = await resolveFormacaoCbo(formacao, especialidadeNome)
  return {
    cbo_codigo: resolved.codigo,
    cbo_descricao: resolved.descricao,
    formacao: resolved.formacao,
  }
}

export async function persistCanonicalProfissionalCbo(params: {
  origemAtendimento: string
  profissionalId?: string | null
  profissionalMtId?: string | null
  formacao?: string | null
  especialidadeNome?: string | null
}): Promise<void> {
  const resolved = await resolveFormacaoCbo(params.formacao, params.especialidadeNome)
  const patch = {
    formacao: resolved.formacao,
    cbo_codigo: resolved.codigo,
    cbo_descricao: resolved.descricao,
  }

  if (params.origemAtendimento === 'mt' && params.profissionalMtId) {
    const { error } = await supabaseAdmin
      .from('profissionais_mt')
      .update(patch)
      .eq('id', params.profissionalMtId)
    if (error) throw error
    return
  }

  if (params.profissionalId) {
    const { error } = await supabaseAdmin
      .from('usuarios_profissionais')
      .update(patch)
      .eq('id', params.profissionalId)
    if (error) throw error
  }
}

export function listFormacaoCboSeedRows(): Array<{ formacao: FormacaoCboKey; ocupacao_codigo: string }> {
  return (Object.entries(FORMACAO_CBO_DEFAULTS) as Array<[FormacaoCboKey, { codigo: string }]>).map(
    ([formacao, value]) => ({
      formacao,
      ocupacao_codigo: value.codigo,
    }),
  )
}
