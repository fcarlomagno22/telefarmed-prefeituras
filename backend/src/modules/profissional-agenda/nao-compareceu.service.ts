import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalAgendaError } from './errors.js'
import type { ProfissionalAgendaContext } from './types.js'

export async function markAgendaConsultaNaoCompareceu(
  ctx: ProfissionalAgendaContext,
  consultaId: string,
): Promise<void> {
  const { data: consultaClinica, error: consultaError } = await supabaseAdmin
    .from('consultas')
    .select('id, agenda_consulta_id, profissional_id, status')
    .eq('id', consultaId)
    .maybeSingle()

  if (consultaError) throw consultaError

  let agendaConsultaId: string | null = consultaClinica?.agenda_consulta_id
    ? String(consultaClinica.agenda_consulta_id)
    : null

  if (!agendaConsultaId) {
    const { data: agendaRow, error: agendaError } = await supabaseAdmin
      .from('agenda_consultas')
      .select('id, profissional_id, escala_slot_id, status')
      .eq('id', consultaId)
      .maybeSingle()

    if (agendaError) throw agendaError
    if (!agendaRow) {
      throw new ProfissionalAgendaError('Consulta não encontrada.', 'NOT_FOUND', 404)
    }

    await assertAgendaOwnership(ctx, agendaRow)
    agendaConsultaId = String(agendaRow.id)
  } else {
    const { data: agendaRow, error: agendaError } = await supabaseAdmin
      .from('agenda_consultas')
      .select('id, profissional_id, escala_slot_id, status')
      .eq('id', agendaConsultaId)
      .maybeSingle()

    if (agendaError) throw agendaError
    if (!agendaRow) {
      throw new ProfissionalAgendaError('Consulta da agenda não encontrada.', 'NOT_FOUND', 404)
    }
    await assertAgendaOwnership(ctx, agendaRow)
  }

  const now = new Date().toISOString()

  const { error: updateAgendaError } = await supabaseAdmin
    .from('agenda_consultas')
    .update({ status: 'faltou' })
    .eq('id', agendaConsultaId)

  if (updateAgendaError) throw updateAgendaError

  await supabaseAdmin
    .from('fila_espera')
    .update({ status: 'desistiu', encerrado_em: now })
    .eq('agenda_consulta_id', agendaConsultaId)
    .in('status', ['aguardando', 'chamado'])

  if (consultaClinica?.id) {
    await supabaseAdmin
      .from('consultas')
      .update({ status: 'cancelada', cancelada_em: now })
      .eq('id', consultaClinica.id)
      .in('status', ['aguardando_medico'])
  }
}

async function assertAgendaOwnership(
  ctx: ProfissionalAgendaContext,
  agendaRow: {
    profissional_id: string | null
    escala_slot_id: string | null
  },
): Promise<void> {
  if (agendaRow.profissional_id === ctx.profissionalId) return

  if (agendaRow.escala_slot_id) {
    const { data, error } = await supabaseAdmin
      .from('escala_plantoes_confirmados')
      .select('id')
      .eq('slot_id', agendaRow.escala_slot_id)
      .eq('profissional_id', ctx.profissionalId)
      .in('status', ['confirmado', 'realizado'])
      .maybeSingle()

    if (error) throw error
    if (data) return
  }

  throw new ProfissionalAgendaError('Consulta fora do seu plantão.', 'FORBIDDEN', 403)
}
