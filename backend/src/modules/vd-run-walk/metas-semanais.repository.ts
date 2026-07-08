import { supabaseAdmin } from '../../db/supabase.js'
import type { RunWalkMetasSemanalRow } from './metas-semanais.formatters.js'
import type { VdRunWalkPacienteScope } from './types.js'

const METAS_SEMANAIS_SELECT =
  'id, paciente_id, entidade_contratante_id, semana_inicio, target_activities, target_active_minutes, target_movement_days, criado_em, atualizado_em'

function mapRow(row: RunWalkMetasSemanalRow): RunWalkMetasSemanalRow {
  return {
    ...row,
    target_activities: Number(row.target_activities),
    target_active_minutes: Number(row.target_active_minutes),
    target_movement_days: Number(row.target_movement_days),
  }
}

export async function findMetasSemanaisBySemana(
  scope: VdRunWalkPacienteScope,
  semanaInicio: string,
): Promise<RunWalkMetasSemanalRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_metas_semanais')
    .select(METAS_SEMANAIS_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('semana_inicio', semanaInicio)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapRow(data as RunWalkMetasSemanalRow)
}

export async function upsertMetasSemanais(
  scope: VdRunWalkPacienteScope,
  semanaInicio: string,
  input: {
    targetActivities: number
    targetActiveMinutes: number
    targetMovementDays: number
  },
): Promise<RunWalkMetasSemanalRow> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_metas_semanais')
    .upsert(
      {
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        semana_inicio: semanaInicio,
        target_activities: input.targetActivities,
        target_active_minutes: input.targetActiveMinutes,
        target_movement_days: input.targetMovementDays,
      },
      { onConflict: 'paciente_id,semana_inicio' },
    )
    .select(METAS_SEMANAIS_SELECT)
    .single()

  if (error) throw error

  return mapRow(data as RunWalkMetasSemanalRow)
}
