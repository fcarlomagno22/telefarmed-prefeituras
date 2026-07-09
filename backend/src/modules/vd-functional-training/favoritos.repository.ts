import { supabaseAdmin } from '../../db/supabase.js'
import type { InsertFavoritoRow } from './favoritos.formatters.js'
import type { FunctionalTrainingFavoritoRow, VdFunctionalTrainingPacienteScope } from './types.js'

export const FUNCTIONAL_TRAINING_FAVORITO_SELECT =
  'id, paciente_id, entidade_contratante_id, exercise_id, criado_em'

export async function listFavoritos(
  scope: VdFunctionalTrainingPacienteScope,
): Promise<FunctionalTrainingFavoritoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('functional_training_favoritos')
    .select(FUNCTIONAL_TRAINING_FAVORITO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .order('criado_em', { ascending: false })

  if (error) throw error
  return (data ?? []) as FunctionalTrainingFavoritoRow[]
}

export async function insertFavorito(
  row: InsertFavoritoRow,
): Promise<FunctionalTrainingFavoritoRow> {
  const { data, error } = await supabaseAdmin
    .from('functional_training_favoritos')
    .insert(row)
    .select(FUNCTIONAL_TRAINING_FAVORITO_SELECT)
    .single()

  if (error) throw error
  return data as FunctionalTrainingFavoritoRow
}

export async function deleteFavorito(
  scope: VdFunctionalTrainingPacienteScope,
  exerciseId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('functional_training_favoritos')
    .delete()
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('exercise_id', exerciseId)
    .select('id')

  if (error) throw error
  return (data ?? []).length > 0
}

export function isUniqueViolationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}
