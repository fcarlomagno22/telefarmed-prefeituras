import { supabaseAdmin } from '../../db/supabase.js'

/** IDs de consultas finalizadas atribuíveis ao profissional (direto, agenda ou fila→agenda). */
export async function listConsultaIdsForProfissionalHistorico(
  profissionalId: string,
): Promise<string[]> {
  const ids = new Set<string>()

  const { data: directRows, error: directError } = await supabaseAdmin
    .from('consultas')
    .select('id')
    .eq('profissional_id', profissionalId)
    .in('status', ['concluida', 'interrompida'])

  if (directError) throw directError
  for (const row of directRows ?? []) {
    ids.add(String(row.id))
  }

  const { data: agendaRows, error: agendaError } = await supabaseAdmin
    .from('agenda_consultas')
    .select('id')
    .eq('profissional_id', profissionalId)

  if (agendaError) throw agendaError

  const agendaIds = (agendaRows ?? []).map((row) => String(row.id))
  if (agendaIds.length === 0) {
    return [...ids]
  }

  const [{ data: viaAgenda, error: viaAgendaError }, { data: filaRows, error: filaError }] =
    await Promise.all([
      supabaseAdmin
        .from('consultas')
        .select('id')
        .in('agenda_consulta_id', agendaIds)
        .in('status', ['concluida', 'interrompida']),
      supabaseAdmin.from('fila_espera').select('id').in('agenda_consulta_id', agendaIds),
    ])

  if (viaAgendaError) throw viaAgendaError
  if (filaError) throw filaError

  for (const row of viaAgenda ?? []) {
    ids.add(String(row.id))
  }

  const filaIds = (filaRows ?? []).map((row) => String(row.id))
  if (filaIds.length > 0) {
    const { data: viaFila, error: viaFilaError } = await supabaseAdmin
      .from('consultas')
      .select('id')
      .in('fila_espera_id', filaIds)
      .in('status', ['concluida', 'interrompida'])

    if (viaFilaError) throw viaFilaError
    for (const row of viaFila ?? []) {
      ids.add(String(row.id))
    }
  }

  return [...ids]
}

export async function profissionalOwnsHistoricoConsulta(
  profissionalId: string,
  consultaId: string,
): Promise<boolean> {
  const ids = await listConsultaIdsForProfissionalHistorico(profissionalId)
  return ids.includes(consultaId)
}
