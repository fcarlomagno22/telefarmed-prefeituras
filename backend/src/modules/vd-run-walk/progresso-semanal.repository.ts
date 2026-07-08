import { supabaseAdmin } from '../../db/supabase.js'
import type { VdRunWalkPacienteScope } from './types.js'

const PROGRESSO_SEMANAL_SELECT =
  'id, paciente_id, entidade_contratante_id, semana_inicio, completed_activities, active_minutes, movement_days, daily_extra_minutes, extra_completed_activities, extra_active_minutes, extra_movement_days, criado_em, atualizado_em'

export type RunWalkProgressoSemanalRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  semana_inicio: string
  completed_activities: number
  active_minutes: number
  movement_days: number
  daily_extra_minutes: Record<string, number>
  extra_completed_activities: number
  extra_active_minutes: number
  extra_movement_days: number
  criado_em: string
  atualizado_em: string
}

function mapProgressoRow(row: RunWalkProgressoSemanalRow): RunWalkProgressoSemanalRow {
  return {
    ...row,
    daily_extra_minutes:
      row.daily_extra_minutes && typeof row.daily_extra_minutes === 'object'
        ? row.daily_extra_minutes
        : {},
  }
}

export async function findProgressoSemanalBySemana(
  scope: VdRunWalkPacienteScope,
  semanaInicio: string,
): Promise<RunWalkProgressoSemanalRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_progresso_semanal')
    .select(PROGRESSO_SEMANAL_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('semana_inicio', semanaInicio)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapProgressoRow(data as RunWalkProgressoSemanalRow)
}

export async function updateProgressoSemanalMaterialized(
  scope: VdRunWalkPacienteScope,
  semanaInicio: string,
  materialized: {
    completedActivities: number
    activeMinutes: number
    movementDays: number
  },
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('run_walk_progresso_semanal')
    .update({
      completed_activities: materialized.completedActivities,
      active_minutes: materialized.activeMinutes,
      movement_days: materialized.movementDays,
    })
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('semana_inicio', semanaInicio)

  if (error) throw error
}
