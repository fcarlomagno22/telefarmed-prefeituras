import { supabaseAdmin } from '../../db/supabase.js'
import type { RunWalkPlanoDiarioRow, UpsertPlanoDiarioPayload } from './plano.formatters.js'
import type { VdRunWalkPacienteScope } from './types.js'

const PLANO_DIARIO_SELECT =
  'id, paciente_id, entidade_contratante_id, plano_date, preset_id, activity_type, title, duration_minutes, intensity, intensity_label, audio_guidance, selected_activity, menu_state, skipped'

function mapRow(data: RunWalkPlanoDiarioRow): RunWalkPlanoDiarioRow {
  return {
    ...data,
    duration_minutes:
      data.duration_minutes == null ? null : Number(data.duration_minutes),
    audio_guidance: Boolean(data.audio_guidance),
    skipped: Boolean(data.skipped),
  }
}

export async function findPlanoDiarioByDate(
  scope: VdRunWalkPacienteScope,
  planoDate: string,
): Promise<RunWalkPlanoDiarioRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_plano_diario')
    .select(PLANO_DIARIO_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('plano_date', planoDate)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapRow(data as RunWalkPlanoDiarioRow)
}

export async function upsertPlanoDiario(
  scope: VdRunWalkPacienteScope,
  planoDate: string,
  payload: UpsertPlanoDiarioPayload,
): Promise<RunWalkPlanoDiarioRow> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_plano_diario')
    .upsert(
      {
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        plano_date: planoDate,
        preset_id: payload.preset_id,
        activity_type: payload.activity_type,
        title: payload.title,
        duration_minutes: payload.duration_minutes,
        intensity: payload.intensity,
        intensity_label: payload.intensity_label,
        audio_guidance: payload.audio_guidance,
        selected_activity: payload.selected_activity,
        menu_state: payload.menu_state,
        skipped: payload.skipped,
      },
      { onConflict: 'paciente_id,plano_date' },
    )
    .select(PLANO_DIARIO_SELECT)
    .single()

  if (error) throw error

  return mapRow(data as RunWalkPlanoDiarioRow)
}
