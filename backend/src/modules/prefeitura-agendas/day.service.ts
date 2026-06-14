import { supabaseAdmin } from '../../db/supabase.js'
import { formatAgendaConsultaRow, formatAgendaConsultaRows } from '../ubt-agenda/formatters.js'
import { buildDayBreakdownFromAppointments } from './formatters.js'
import { assertUbtBelongsToEntity } from './ownership.js'
import type { PrefeituraAgendaDayDto } from './types.js'

export async function getPrefeituraAgendaDay(
  entidadeId: string,
  params: { date: string; unidadeUbtId: string },
): Promise<PrefeituraAgendaDayDto> {
  await assertUbtBelongsToEntity(entidadeId, params.unidadeUbtId)

  const { data, error } = await supabaseAdmin
    .from('vw_ubt_agenda_consultas')
    .select('*')
    .eq('entidade_contratante_id', entidadeId)
    .eq('unidade_ubt_id', params.unidadeUbtId)
    .eq('data', params.date)
    .neq('status', 'cancelado')
    .order('hora', { ascending: true })

  if (error) throw error

  const appointments = await formatAgendaConsultaRows(
    (data ?? []) as Parameters<typeof formatAgendaConsultaRow>[0][],
  )

  return {
    date: params.date,
    unitId: params.unidadeUbtId,
    appointments,
    breakdown: buildDayBreakdownFromAppointments(appointments),
  }
}
