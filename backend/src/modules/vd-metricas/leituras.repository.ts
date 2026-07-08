import { supabaseAdmin } from '../../db/supabase.js'
import type { TipoMetricaPaciente } from './types.js'

export const POS_CONSULTA_CHECKIN_METADATA_KEY = 'posConsultaCheckinId'

export async function existsLeituraFromPosConsultaCheckin(
  pacienteId: string,
  tipo: Extract<TipoMetricaPaciente, 'glicemia' | 'pressao'>,
  checkinId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select('id')
    .eq('paciente_id', pacienteId)
    .eq('tipo', tipo)
    .eq('origem', 'pos_consulta')
    .contains('metadados', { [POS_CONSULTA_CHECKIN_METADATA_KEY]: checkinId })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data != null
}
