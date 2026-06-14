import { supabaseAdmin } from '../../db/supabase.js'
import { PrefeituraRedeError } from '../prefeitura-rede/errors.js'

export async function assertUbtBelongsToEntity(
  entidadeId: string,
  unidadeUbtId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id')
    .eq('id', unidadeUbtId)
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PrefeituraRedeError('Unidade não encontrada.', 'NOT_FOUND', 404)
  }
}
