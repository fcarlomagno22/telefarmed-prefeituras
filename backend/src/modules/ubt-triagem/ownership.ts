import { supabaseAdmin } from '../../db/supabase.js'
import { UbtTriagemError } from './errors.js'
import type { UbtScope } from './types.js'

export async function assertFilaBelongsToUnit(
  scope: UbtScope,
  filaId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabaseAdmin
    .from('vw_ubt_fila_espera')
    .select('*')
    .eq('id', filaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtTriagemError('Entrada de fila não encontrada.', 'NOT_FOUND', 404)
  }

  return data as Record<string, unknown>
}
