import { supabaseAdmin } from '../../db/supabase.js'
import { UbtPacientesError } from './errors.js'

export async function assertPacienteBelongsToEntity(
  entidadeId: string,
  pacienteId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .select('id')
    .eq('id', pacienteId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtPacientesError('Paciente não encontrado.', 'NOT_FOUND', 404)
  }
}

export async function assertUnidadeBelongsToEntity(
  entidadeId: string,
  unidadeUbtId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id')
    .eq('id', unidadeUbtId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtPacientesError('Unidade UBT inválida para esta entidade.', 'INVALID_DATA', 400)
  }
}
