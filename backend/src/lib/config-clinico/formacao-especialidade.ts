import { supabaseAdmin } from '../../db/supabase.js'
import { logProfissionalCadastro } from '../../modules/profissional-cadastro/debug-log.js'
import { ProfissionalCadastroError } from '../../modules/profissional-cadastro/errors.js'
import type { FormacaoCandidatura } from '../../modules/profissional-cadastro/types.js'

export const FORMACAO_CONSELHO_SIGLA: Record<FormacaoCandidatura, string> = {
  medicina: 'CRM',
  psicologia: 'CRP',
  nutricao: 'CRN',
  fonoaudiologia: 'CRFa',
}

const FORMACAO_ESPECIALIDADE_NOME: Record<Exclude<FormacaoCandidatura, 'medicina'>, string> = {
  psicologia: 'Psicologia',
  nutricao: 'Nutrição',
  fonoaudiologia: 'Fonoaudiologia',
}

const FORMACAO_ESPECIALIDADE_NOME_ALTERNATIVO: Partial<
  Record<Exclude<FormacaoCandidatura, 'medicina'>, string[]>
> = {
  nutricao: ['Orientação Nutricional', 'Nutrologia'],
}

const FORMACAO_PROFISSAO_NOMES: Record<Exclude<FormacaoCandidatura, 'medicina'>, string[]> = {
  psicologia: ['Psicologia', 'Psicólogos'],
  nutricao: ['Nutrição', 'Nutricionistas'],
  fonoaudiologia: ['Fonoaudiologia', 'Fonoaudiólogos'],
}

export async function resolveEspecialidadeIdByName(
  name: string,
  options?: { requireActive?: boolean },
): Promise<string> {
  let query = supabaseAdmin
    .from('config_especialidades')
    .select('id')
    .ilike('nome', name.trim())

  if (options?.requireActive !== false) {
    query = query.eq('ativo', true)
  }

  const { data, error } = await query.maybeSingle()

  if (error) throw error
  if (!data?.id) {
    throw new ProfissionalCadastroError(
      `Especialidade não encontrada: ${name}.`,
      'SPECIALTY_NOT_FOUND',
      400,
    )
  }

  return String(data.id)
}

async function lookupSpecialtyIdByName(name: string): Promise<string | null> {
  const { data: active, error: activeError } = await supabaseAdmin
    .from('config_especialidades')
    .select('id')
    .ilike('nome', name.trim())
    .eq('ativo', true)
    .maybeSingle()

  if (activeError) throw activeError
  if (active?.id) return String(active.id)

  const { data: anyStatus, error: anyError } = await supabaseAdmin
    .from('config_especialidades')
    .select('id')
    .ilike('nome', name.trim())
    .maybeSingle()

  if (anyError) throw anyError
  return anyStatus?.id ? String(anyStatus.id) : null
}

async function findProfissaoIdForFormacao(
  formacao: Exclude<FormacaoCandidatura, 'medicina'>,
): Promise<string | null> {
  for (const nome of FORMACAO_PROFISSAO_NOMES[formacao]) {
    const { data, error } = await supabaseAdmin
      .from('config_profissoes')
      .select('id')
      .ilike('nome', nome.trim())
      .eq('ativo', true)
      .maybeSingle()

    if (error) throw error
    if (data?.id) return String(data.id)
  }

  return null
}

async function findSpecialtyIdByProfissao(profissaoId: string): Promise<string | null> {
  const { data: links, error: linksError } = await supabaseAdmin
    .from('config_especialidade_profissao')
    .select('especialidade_id')
    .eq('profissao_id', profissaoId)

  if (linksError) throw linksError

  const especialidadeIds = (links ?? [])
    .map((row) => String(row.especialidade_id))
    .filter(Boolean)

  if (especialidadeIds.length === 0) return null

  const { data: especialidades, error: especialidadesError } = await supabaseAdmin
    .from('config_especialidades')
    .select('id')
    .in('id', especialidadeIds)
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })
    .limit(1)

  if (especialidadesError) throw especialidadesError
  return especialidades?.[0]?.id ? String(especialidades[0].id) : null
}

async function ensureLinkEspecialidadeProfissao(
  especialidadeId: string,
  profissaoId: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from('config_especialidade_profissao').upsert(
    {
      especialidade_id: especialidadeId,
      profissao_id: profissaoId,
    },
    { onConflict: 'especialidade_id,profissao_id' },
  )

  if (error) throw error
}

async function ensureDefaultSpecialtyForFormacao(
  formacao: Exclude<FormacaoCandidatura, 'medicina'>,
  profissaoId: string,
  nome: string,
): Promise<string> {
  const stableId = `cad-formacao-${formacao}`

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('config_especialidades')
    .select('id')
    .eq('id', stableId)
    .maybeSingle()

  if (existingError) throw existingError

  if (!existing?.id) {
    const { error: insertError } = await supabaseAdmin.from('config_especialidades').insert({
      id: stableId,
      nome,
      ativo: true,
      ordem: 900,
    })

    if (insertError) {
      const recovered = await lookupSpecialtyIdByName(nome)
      if (recovered) {
        await ensureLinkEspecialidadeProfissao(recovered, profissaoId)
        return recovered
      }
      throw insertError
    }

    logProfissionalCadastro('info', 'especialidade padrão criada para formação', {
      formacao,
      especialidadeId: stableId,
      nome,
      profissaoId,
    })
  }

  await ensureLinkEspecialidadeProfissao(stableId, profissaoId)
  return stableId
}

export async function resolveFormacaoEspecialidadeId(
  formacao: Exclude<FormacaoCandidatura, 'medicina'>,
): Promise<string> {
  const defaultName = FORMACAO_ESPECIALIDADE_NOME[formacao]

  const primary = await lookupSpecialtyIdByName(defaultName)
  if (primary) return primary

  for (const altName of FORMACAO_ESPECIALIDADE_NOME_ALTERNATIVO[formacao] ?? []) {
    const alt = await lookupSpecialtyIdByName(altName)
    if (alt) return alt
  }

  const profissaoId = await findProfissaoIdForFormacao(formacao)
  if (profissaoId) {
    const linked = await findSpecialtyIdByProfissao(profissaoId)
    if (linked) return linked

    return ensureDefaultSpecialtyForFormacao(formacao, profissaoId, defaultName)
  }

  throw new ProfissionalCadastroError(
    `Especialidade não configurada para ${defaultName}. Cadastre a profissão e especialidade em Configurações.`,
    'SPECIALTY_NOT_FOUND',
    400,
  )
}
