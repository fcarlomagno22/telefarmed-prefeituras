import { supabaseAdmin } from '../../db/supabase.js'
import type { ConsultaAggregateRow } from './types.js'
import { periodBounds } from './period.js'

const LIST_SELECT = `
  unidade_ubt_id,
  status,
  criado_em,
  duracao_minutos,
  iniciada_em,
  finalizada_em,
  especialidade_id,
  especialidade_nome,
  paciente_sexo
`

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

export async function fetchConsultasForPeriod(
  entidadeId: string,
  periodStart: string,
  periodEnd: string,
  unitIds?: string[],
): Promise<ConsultaAggregateRow[]> {
  const { startIso, endIso } = periodBounds(periodStart, periodEnd)

  let query = supabaseAdmin
    .from('vw_consultas_operacional')
    .select(LIST_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .gte('criado_em', startIso)
    .lte('criado_em', endIso)

  if (unitIds && unitIds.length > 0) {
    query = query.in('unidade_ubt_id', unitIds)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as ConsultaAggregateRow[]
}
