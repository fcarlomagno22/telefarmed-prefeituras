import { supabaseAdmin } from '../../db/supabase.js'
import type { ContratoEntidadeRow } from './types.js'

const CONTRATO_SELECT =
  'id, entidade_contratante_id, numero, tipo, status, data_assinatura, data_encerramento, consultas_contratadas, consultas_realizadas, percentual_utilizado, permite_ultrapassar'

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = 'message' in error ? String((error as { message: unknown }).message) : ''
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /relation .* does not exist/i.test(message) ||
    /Could not find the table/i.test(message)
  )
}

export async function loadContratosForEntidade(entidadeId: string): Promise<ContratoEntidadeRow[]> {
  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select(CONTRATO_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .in('status', ['ativo', 'encerrado'])
    .order('data_assinatura', { ascending: false })

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as ContratoEntidadeRow[]
}

export async function loadContratoById(
  entidadeId: string,
  contratoId: string,
): Promise<ContratoEntidadeRow | null> {
  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select(CONTRATO_SELECT)
    .eq('id', contratoId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }

  return (data as ContratoEntidadeRow | null) ?? null
}

export async function loadActiveContrato(entidadeId: string): Promise<ContratoEntidadeRow | null> {
  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select(CONTRATO_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'ativo')
    .order('data_assinatura', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }

  return (data as ContratoEntidadeRow | null) ?? null
}

export async function countConsultasRealizadas(
  entidadeId: string,
  startIso: string,
  endIso: string,
  unitIds?: string[],
): Promise<number> {
  let query = supabaseAdmin
    .from('consultas')
    .select('id', { count: 'exact', head: true })
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'concluida')
    .gte('finalizada_em', startIso)
    .lte('finalizada_em', endIso)

  if (unitIds && unitIds.length > 0) {
    query = query.in('unidade_ubt_id', unitIds)
  }

  const { count, error } = await query
  if (error) {
    if (isMissingRelationError(error)) return 0
    throw error
  }

  return count ?? 0
}

type ConsultaMonthRow = {
  finalizada_em: string | null
}

export async function loadConsultasForHistory(
  entidadeId: string,
  startIso: string,
  endIso: string,
): Promise<ConsultaMonthRow[]> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('finalizada_em')
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'concluida')
    .gte('finalizada_em', startIso)
    .lte('finalizada_em', endIso)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as ConsultaMonthRow[]
}

export async function loadEntidadeContratoInfo(entidadeId: string) {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('nome_exibicao, razao_social, municipio, uf, contato_contrato')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function loadContratoEspecialidades(contratoId: string) {
  const { data, error } = await supabaseAdmin
    .from('contrato_entidade_precos_especialidade')
    .select('especialidade_id, tipo, valor_consulta_centavos, config_especialidades(nome)')
    .eq('contrato_id', contratoId)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return data ?? []
}

export async function loadTipoContratoNome(tipoId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('config_tipos_contrato')
    .select('nome')
    .eq('id', tipoId)
    .maybeSingle()

  if (error) return null
  return data?.nome ? String(data.nome) : null
}

export async function loadConsultasForMonthDetail(
  entidadeId: string,
  startIso: string,
  endIso: string,
  limit: number,
) {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      'id, paciente_nome, paciente_cpf, paciente_data_nascimento, finalizada_em, especialidade_nome, duracao_minutos, iniciada_em, criado_em',
    )
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'concluida')
    .gte('finalizada_em', startIso)
    .lte('finalizada_em', endIso)
    .order('finalizada_em', { ascending: true })
    .limit(limit)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return data ?? []
}
